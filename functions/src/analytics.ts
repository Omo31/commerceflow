import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// The summary document path
const summaryRef = admin.firestore().doc("stats/summary");

/**
 * A transactional function that increments a specified field in the summary.
 * This ensures that simultaneous updates do not overwrite each other.
 *
 * @param {string} field The field to increment ('totalUsers' or 'totalOrders').
 * @return {Promise<void>} A promise that resolves when the transaction is complete.
 */
const incrementCounter = (field: string) => {
  return admin.firestore().runTransaction(async (transaction) => {
    const doc = await transaction.get(summaryRef);
    if (!doc.exists) {
      // If the summary document doesn't exist, create it and set the counter to 1.
      transaction.set(summaryRef, { [field]: 1 });
    } else {
      // If it exists, get the current count and increment it.
      const newCount = (doc.data()?.[field] || 0) + 1;
      transaction.update(summaryRef, { [field]: newCount });
    }
  });
};

/**
 * Cloud Function that triggers when a new user document is created.
 * It calls the transactional incrementer to update the total user count.
 */
export const onUserCreate = functions.firestore
  .document("users/{userId}")
  .onCreate(async (snap, context) => {
    functions.logger.info(
      `New user created: ${context.params.userId}. Incrementing totalUsers.`,
    );
    try {
      await incrementCounter("totalUsers");
      functions.logger.info("Successfully incremented totalUsers.");
    } catch (error) {
      functions.logger.error("Error incrementing totalUsers:", error);
    }
  });

/**
 * Cloud Function that triggers when a new order document is created.
 * It calls the transactional incrementer to update the total order count.
 */
export const onOrderCreate = functions.firestore
  .document("orders/{orderId}")
  .onCreate(async (snap, context) => {
    functions.logger.info(
      `New order created: ${context.params.orderId}. Incrementing totalOrders.`,
    );
    try {
      await incrementCounter("totalOrders");
      functions.logger.info("Successfully incremented totalOrders.");
    } catch (error) {
      functions.logger.error("Error incrementing totalOrders:", error);
    }
  });
