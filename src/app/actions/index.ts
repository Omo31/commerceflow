"use server";

import {
  doc,
  runTransaction,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { firestore } from "@/firebase-admin";
import { createNotification } from "@/lib/notifications";
import { headers } from "next/headers";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

interface PaystackVerificationResponse {
  status: boolean;
  message: string;
  data: {
    status: string;
    reference: string;
    amount: number;
    currency: string;
    metadata: {
      orderId: string;
      userId: string;
    };
  };
}

export async function verifyPaystackTransaction(
  reference: string,
  orderId: string,
  userId: string,
): Promise<{ success: boolean; message: string }> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("Paystack secret key is not configured.");
  }

  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      return {
        success: false,
        message: `Paystack API error: ${response.statusText} - ${errorBody}`,
      };
    }

    const result: PaystackVerificationResponse = await response.json();

    if (result.data.status !== "success") {
      return { success: false, message: "Payment was not successful." };
    }

    const orderRef = doc(firestore, "customOrders", orderId);

    await runTransaction(firestore, async (transaction) => {
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists()) {
        throw new Error("Order not found.");
      }

      const order = orderDoc.data();
      const orderTotalKobo = Math.round(order.total * 100);

      if (orderTotalKobo !== result.data.amount) {
        // This is a critical security check
        // You might want to flag this transaction for manual review
        throw new Error(
          `Amount mismatch. Expected ${orderTotalKobo}, but Paystack reported ${result.data.amount}.`,
        );
      }

      if (order.status === "Completed" || order.status === "Shipped") {
        // Payment already processed, no need to update
        return;
      }

      // 1. Update order status
      transaction.update(orderRef, {
        status: "Processing", // Or 'Completed' if no shipping is involved
        updatedAt: serverTimestamp(),
      });

      // 2. Create a payment record
      const paymentsRef = collection(firestore, "payments");
      transaction.set(doc(paymentsRef), {
        orderId: orderId,
        userId: userId,
        amount: result.data.amount / 100, // Store in the base currency unit (e.g., Naira)
        currency: result.data.currency,
        status: "Success",
        transactionId: result.data.reference,
        paymentDate: serverTimestamp(),
        gateway: "Paystack",
      });
    });

    // Send notification to user
    await createNotification(
      firestore,
      userId,
      `Your payment for order #${orderId.substring(0, 7)} was successful!`,
      `/dashboard/orders/${orderId}`,
    );

    return { success: true, message: "Payment verified and order updated." };
  } catch (error: any) {
    console.error("Verification transaction error:", error);
    return {
      success: false,
      message: `An unexpected error occurred: ${error.message}`,
    };
  }
}
