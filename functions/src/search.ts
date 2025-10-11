import * as functions from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

/**
 * A callable Cloud Function for server-side searching and filtering.
 * This is more performant and scalable than client-side filtering.
 */
export const searchCollection = functions.onCall(async (request) => {
  // 1. Authentication and Authorization:
  // Ensure the user is authenticated and is an admin.
  if (!request.auth || !request.auth.token.isAdmin) {
    throw new functions.HttpsError(
      "permission-denied",
      "This function must be called by an authenticated administrator.",
    );
  }

  const { collectionName, searchTerm, filters } = request.data;

  // 2. Input Validation:
  if (!collectionName || typeof collectionName !== "string") {
    throw new functions.HttpsError(
      "invalid-argument",
      'The function must be called with a "collectionName" string.',
    );
  }

  let query: admin.firestore.Query = admin
    .firestore()
    .collection(collectionName);

  // 3. Apply Filters:
  // Allows filtering by specific fields, e.g., { status: 'active' }.
  if (filters && typeof filters === "object") {
    for (const key in filters) {
      if (Object.prototype.hasOwnProperty.call(filters, key)) {
        query = query.where(key, "==", filters[key]);
      }
    }
  }

  // 4. Apply Search Term:
  // This performs a basic prefix search on a designated 'searchableField'.
  // For full-text search, a dedicated service like Algolia should be used.
  if (searchTerm && typeof searchTerm === "string") {
    const searchableField = collectionName === "users" ? "email" : "id";
    query = query
      .orderBy(searchableField)
      .startAt(searchTerm)
      .endAt(searchTerm + "\uf8ff");
  }

  // 5. Execute Query and Return Results:
  try {
    const snapshot = await query.limit(50).get(); // Limit results
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return { data };
  } catch (error) {
    console.error("Query failed: ", error);
    throw new functions.HttpsError(
      "internal",
      "An error occurred while executing the search.",
    );
  }
});
