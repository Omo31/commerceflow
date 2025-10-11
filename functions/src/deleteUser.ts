import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";

export const deleteUser = onCall(async (request) => {
  // Check if the user is authenticated
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "The function must be called by an authenticated user.",
    );
  }

  const uid = request.auth.uid;
  const targetUid = request.data.uid;

  if (!targetUid) {
    throw new HttpsError(
      "invalid-argument",
      "The function must be called with a 'uid' argument.",
    );
  }

  const firestore = getFirestore();
  const auth = getAuth();

  try {
    // Check if the calling user has 'write' permissions for 'users'
    // eslint-disable-next-line max-len
    const adminRoleDoc = await firestore
      .collection("roles_admin")
      .doc(uid)
      .get();
    if (!adminRoleDoc.exists || adminRoleDoc.data()?.users !== "write") {
      throw new HttpsError(
        "permission-denied",
        "You do not have permission to delete users.",
      );
    }

    // 1. Delete user from Firebase Authentication
    await auth.deleteUser(targetUid);

    // 2. Delete user document from 'users' collection
    const userDocRef = firestore.collection("users").doc(targetUid);

    // 3. Delete role document from 'roles_admin' collection
    const roleDocRef = firestore.collection("roles_admin").doc(targetUid);

    // Use a batch to delete both documents atomically
    const batch = firestore.batch();
    batch.delete(userDocRef);
    batch.delete(roleDocRef);

    await batch.commit();

    return { success: true, message: `Successfully deleted user ${targetUid}` };
  } catch (error) {
    // Log the error for debugging
    console.error("Error deleting user:", error);

    // Re-throw as an HttpsError to the client
    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      "internal",
      "An internal error occurred while deleting the user.",
    );
  }
});
