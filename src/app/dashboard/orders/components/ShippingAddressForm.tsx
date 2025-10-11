"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useFirestore } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { createNotification } from "@/lib/notifications";

const addressSchema = z.object({
  line1: z.string().min(1, "Address Line 1 is required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface ShippingAddressFormProps {
  orderId: string;
  adminIds: string[];
}

export function ShippingAddressForm({
  orderId,
  adminIds,
}: ShippingAddressFormProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
  });

  const onSubmit = async (data: AddressFormData) => {
    if (!firestore) return;
    const orderRef = doc(firestore, "customOrders", orderId);

    try {
      await updateDoc(orderRef, {
        shippingAddress: data,
        status: "Ready for Shipping Cost",
        updatedAt: serverTimestamp(),
      });

      const notificationPromises = adminIds.map((adminId) =>
        createNotification(
          firestore,
          adminId,
          `Shipping address for order #${orderId.substring(0, 7)} has been added.`,
          `/admin/orders/${orderId}`,
        ),
      );
      await Promise.all(notificationPromises);

      toast({
        title: "Success",
        description:
          "Shipping address submitted. The admin will now calculate shipping costs.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Your Shipping Address</CardTitle>
        <CardDescription>
          Please provide your shipping details so we can calculate the final
          shipping cost.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input {...register("line1")} placeholder="Address Line 1" />
            {errors.line1 && (
              <p className="text-red-500 text-sm mt-1">
                {errors.line1.message}
              </p>
            )}
          </div>
          <Input
            {...register("line2")}
            placeholder="Address Line 2 (Optional)"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input {...register("city")} placeholder="City" />
              {errors.city && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.city.message}
                </p>
              )}
            </div>
            <div>
              <Input {...register("state")} placeholder="State / Province" />
              {errors.state && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.state.message}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input {...register("postalCode")} placeholder="Postal Code" />
              {errors.postalCode && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.postalCode.message}
                </p>
              )}
            </div>
            <div>
              <Input {...register("country")} placeholder="Country" />
              {errors.country && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.country.message}
                </p>
              )}
            </div>
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Address
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
