"use client";
import {
  Firestore,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

/**
 * Creates a notification for a specific user in Firestore.
 * @param firestore - The Firestore instance.
 * @param userId - The ID of the user to notify.
 * @param message - The notification message.
 * @param link - An optional link for the notification.
 */
export async function createNotification(
  firestore: Firestore,
  userId: string,
  message: string,
  link?: string,
): Promise<void> {
  if (!firestore || !userId) {
    console.error("Firestore instance or User ID is missing.");
    return;
  }

  try {
    const notificationsRef = collection(
      firestore,
      `users/${userId}/notifications`,
    );
    await addDoc(notificationsRef, {
      userId,
      message,
      link,
      type: "order",
      read: false,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    // Optionally, you could re-throw the error or handle it in another way
  }
}
