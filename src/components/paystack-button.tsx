"use client";

import { useState } from "react";
import { usePaystackPayment } from "react-paystack";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { verifyPaystackTransaction } from "@/app/actions";
import type { Order } from "@/lib/types";

interface PaystackButtonProps {
  order: Order;
  userEmail: string;
}

export const PaystackButton = ({ order, userEmail }: PaystackButtonProps) => {
  const { toast } = useToast();
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(false);

  const config = {
    reference: new Date().getTime().toString(),
    email: userEmail,
    amount: Math.round(order.total * 100), // Amount in kobo
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
    metadata: {
      orderId: order.id,
      userId: order.userId,
    },
  };

  const initializePayment = usePaystackPayment(config);

  const onSuccess = (reference: any) => {
    setIsVerifying(true);
    toast({
      title: "Payment submitted...",
      description: "Verifying transaction...",
    });

    verifyPaystackTransaction(reference.reference, order.id, order.userId)
      .then((result) => {
        if (result.success) {
          toast({
            title: "Payment Successful!",
            description: "Your order has been updated.",
          });
          router.refresh(); // Re-fetches data and re-renders the page with the new order status
        } else {
          toast({
            variant: "destructive",
            title: "Verification Failed",
            description: result.message,
          });
        }
      })
      .catch((error) => {
        toast({
          variant: "destructive",
          title: "Verification Error",
          description: error.message,
        });
      })
      .finally(() => {
        setIsVerifying(false);
      });
  };

  const onClose = () => {
    toast({
      variant: "destructive",
      title: "Payment Cancelled",
      description: "You have cancelled the payment process.",
    });
  };

  if (!config.publicKey) {
    return (
      <Button disabled aria-label="Paystack public key not configured">
        Payment Gateway Not Configured
      </Button>
    );
  }

  return (
    <Button
      onClick={() => initializePayment(onSuccess, onClose)}
      disabled={isVerifying}
      aria-label={`Pay ₦${order.total.toFixed(2)}`}
      size="lg"
    >
      {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {isVerifying ? "Verifying..." : "Pay Now"}
    </Button>
  );
};
