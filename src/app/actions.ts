"use server";

import {
  generateMarketingFlyer,
  type GenerateMarketingFlyerInput,
  type GenerateMarketingFlyerOutput,
} from "@/ai/flows/generate-marketing-flyers";
import {
  generateProductDetails,
  type GenerateProductDetailsInput,
} from "@/ai/flows/generate-product-details";
import {
  doc,
  updateDoc,
  serverTimestamp,
  getFirestore,
  collection,
  addDoc,
  writeBatch,
} from "firebase/firestore";
import { initializeFirebase } from "@/firebase/init";
import type { Payment, Order } from "@/lib/types";

export async function handleGenerateFlyer(
  data: GenerateMarketingFlyerInput,
): Promise<GenerateMarketingFlyerOutput | { error: string }> {
  try {
    const result = await generateMarketingFlyer(data);
    return result;
  } catch (error) {
    console.error("Error generating marketing flyer:", error);
    return { error: "Failed to generate marketing flyer. Please try again." };
  }
}

export async function handleGenerateProductDetails(
  data: GenerateProductDetailsInput,
) {
  try {
    const result = await generateProductDetails(data);
    return result;
  } catch (error) {
    console.error("Error generating product details:", error);
    return { error: "Failed to generate product details. Please try again." };
  }
}

type PaystackVerificationResponse = {
  status: boolean;
  message: string;
  data: {
    status: string;
    amount: number;
    currency: string;
    id: number;
    reference: string;
  };
};

export async function verifyPaystackTransaction(
  reference: string,
  orderId: string,
  userId: string,
): Promise<{ success: boolean; message: string }> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    console.error("Paystack secret key not found.");
    return { success: false, message: "Server configuration error." };
  }

  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      },
    );

    const result: PaystackVerificationResponse = await response.json();

    if (result.status && result.data.status === "success") {
      const { firestore } = initializeFirebase();

      const orderRef = doc(firestore, "customOrders", orderId);
      const orderDoc = await orderRef.get();
      const order = orderDoc.data() as Order;

      // Paystack amount is in kobo, order total is in Naira
      if (order.total * 100 !== result.data.amount) {
        console.error(
          `Amount mismatch: Paystack returned ${result.data.amount}, order total was ${order.total * 100}`,
        );
        return {
          success: false,
          message: "Transaction amount does not match order total.",
        };
      }

      const batch = writeBatch(firestore);

      // Update order status
      batch.update(orderRef, {
        status: "Completed",
        updatedAt: serverTimestamp(),
      });

      // Create payment record
      const paymentRef = doc(collection(firestore, `users/${userId}/payments`));
      const newPayment: Omit<Payment, "id"> = {
        userId,
        orderId,
        amount: result.data.amount / 100, // Convert back to Naira
        status: "Success",
        paymentDate: new Date().toISOString(),
        transactionId: result.data.id.toString(),
      };
      batch.set(paymentRef, newPayment);

      await batch.commit();

      return { success: true, message: "Payment verified and order updated." };
    } else {
      return { success: false, message: result.message };
    }
  } catch (error: any) {
    console.error("Paystack verification error:", error);
    return {
      success: false,
      message:
        error.message || "An unknown error occurred during verification.",
    };
  }
}
