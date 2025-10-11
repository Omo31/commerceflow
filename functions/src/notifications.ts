import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

/**
 * Triggers when an order document is updated. It checks if the order's status
 * has changed and, if so, creates a notification for the user.
 */
export const onOrderStatusUpdate = functions.firestore
  .document("orders/{orderId}")
  .onUpdate(async (change, context) => {
    const orderId = context.params.orderId;
    const orderDataAfter = change.after.data();
    const orderDataBefore = change.before.data();

    // If status hasn't changed or if essential data is missing, do nothing.
    if (
      orderDataAfter.status === orderDataBefore.status ||
      !orderDataAfter.userId
    ) {
      return null;
    }

    functions.logger.info(
      `Order ${orderId} status changed from '${orderDataBefore.status}' ` +
        `to '${orderDataAfter.status}'. Creating notification.`,
    );

    const notification = {
      title: "Order Status Updated",
      message: `Your order #${orderId.substring(0, 7)} is now '${orderDataAfter.status}'.`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
      link: `/dashboard/orders/${orderId}`, // A direct link to the order page
    };

    try {
      // Add the new notification to the user's personal notifications subcollection.
      await admin
        .firestore()
        .collection("users")
        .doc(orderDataAfter.userId)
        .collection("notifications")
        .add(notification);

      functions.logger.info(
        `Successfully created notification for user ${orderDataAfter.userId}.`,
      );
    } catch (error) {
      functions.logger.error(
        `Error creating notification for user ${orderDataAfter.userId}:`,
        error,
      );
    }

    return null;
  });
