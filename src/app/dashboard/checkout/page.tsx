"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import {
  doc,
  updateDoc,
  serverTimestamp,
  writeBatch,
  collection,
  addDoc,
  getDoc,
  runTransaction,
  increment,
} from "firebase/firestore";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import {
  useAuth,
  useFirestore,
  useCollection,
  useMemoFirebase,
  useDoc,
} from "@/firebase";
import type { CartItem, Order, ShippingAddress, User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Discount } from "@/lib/types/discount";

const shippingAddressSchema = z.object({
  addressLine1: z.string().min(5, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  postalCode: z.string().min(4, "Postal code is required"),
  country: z.string().min(2, "Country is required"),
});

const SERVICE_CHARGE_PERCENTAGE = 0.06;

function CheckoutPageContent() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const cartId = searchParams.get("cartId");
  const discountId = searchParams.get("discountId");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCustomOrder, setIsCustomOrder] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);

  const cartQuery = useMemoFirebase(
    () =>
      firestore && user
        ? collection(firestore, `users/${user.uid}/cart`)
        : null,
    [firestore, user],
  );
  const { data: cartItems, isLoading: isCartLoading } =
    useCollection<CartItem>(cartQuery);

  const orderDocRef = useMemoFirebase(
    () =>
      firestore && cartId && isCustomOrder
        ? doc(firestore, "customOrders", cartId)
        : null,
    [firestore, cartId, isCustomOrder],
  );
  const { data: order, isLoading: isOrderLoading } = useDoc<Order>(orderDocRef);

  const userDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, "users", user.uid) : null),
    [firestore, user],
  );
  const { data: userData } = useDoc<User>(userDocRef);

  const discountDocRef = useMemoFirebase(
    () =>
      firestore && discountId ? doc(firestore, "discounts", discountId) : null,
    [firestore, discountId],
  );
  const { data: discountData, isLoading: isDiscountLoading } =
    useDoc<Discount>(discountDocRef);

  useEffect(() => {
    if (discountData) {
      setAppliedDiscount(discountData);
    }
  }, [discountData]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ShippingAddress>({
    resolver: zodResolver(shippingAddressSchema),
  });

  useEffect(() => {
    if (firestore && cartId) {
      const checkOrder = async () => {
        const orderDoc = await getDoc(doc(firestore, "customOrders", cartId));
        if (orderDoc.exists()) {
          setIsCustomOrder(true);
        }
      };
      checkOrder();
    }
  }, [firestore, cartId]);

  useEffect(() => {
    if (userData?.address) {
      const addressParts = userData.address.split(", ");
      if (addressParts.length >= 4) {
        setValue("addressLine1", addressParts[0]);
        setValue("city", addressParts[1]);
        setValue("state", addressParts[2]);
        setValue("postalCode", addressParts[3].split(" ")[1]);
        setValue("country", addressParts[3].split(" ")[0]);
      } else {
        setValue("addressLine1", userData.address);
      }
    }
  }, [userData, setValue]);

  const currentOrderItems = isCustomOrder ? order?.items : cartItems;
  const subtotal =
    currentOrderItems?.reduce(
      (acc, item) => acc + (item.price ?? 0) * item.quantity,
      0,
    ) ?? 0;

  let discountAmount = 0;
  if (appliedDiscount) {
    if (appliedDiscount.type === "percentage") {
      discountAmount = subtotal * (appliedDiscount.value / 100);
    } else {
      // fixed_amount
      discountAmount = appliedDiscount.value;
    }
  }
  discountAmount = Math.min(subtotal, discountAmount);

  const discountedSubtotal = subtotal - discountAmount;
  const serviceCharge = discountedSubtotal * SERVICE_CHARGE_PERCENTAGE;
  const total = discountedSubtotal + serviceCharge;

  const onSubmit = async (data: ShippingAddress) => {
    setIsSubmitting(true);
    if (!user || !firestore || !cartItems || cartItems.length === 0) {
      toast({
        variant: "destructive",
        title: "An error occurred.",
        description: "User or cart not found.",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      await runTransaction(firestore, async (transaction) => {
        if (isCustomOrder && order) {
          const orderRef = doc(firestore, "customOrders", order.id!);
          transaction.update(orderRef, {
            shippingAddress: data,
            status: "Processing",
            updatedAt: serverTimestamp(),
          });
        } else {
          const newOrderRef = doc(collection(firestore, "customOrders"));
          const newOrder: Omit<Order, "id"> = {
            userId: user.uid,
            status: "Processing",
            items: cartItems.map((item) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              unitOfMeasure: "units",
            })),
            subtotal: subtotal,
            serviceCharge,
            shippingCost: 0,
            total: total,
            shippingAddress: data,
            createdAt: serverTimestamp() as any,
            updatedAt: serverTimestamp() as any,
            cartId: cartId,
            discountId: appliedDiscount?.id,
            discountAmount: discountAmount,
            discountCode: appliedDiscount?.code,
          };

          transaction.set(newOrderRef, newOrder);

          // Clear the cart
          cartItems.forEach((item) => {
            const itemRef = doc(firestore, `users/${user.uid}/cart`, item.id);
            transaction.delete(itemRef);
          });

          // Increment discount usage
          if (appliedDiscount && discountDocRef) {
            transaction.update(discountDocRef, { timesUsed: increment(1) });
          }
          router.push(`/dashboard/orders/${newOrderRef.id}`);
        }
      });

      toast({
        title: "Address Submitted!",
        description:
          "Your order is being processed. Admin will add shipping costs shortly.",
      });
      if (isCustomOrder) {
        router.push(`/dashboard/orders/${order!.id}`);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error.message,
      });
      setIsSubmitting(false);
    }
  };

  const isLoading = isCartLoading || isOrderLoading || isDiscountLoading;

  return (
    <>
      <PageHeader title="Checkout" />
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
                <CardDescription>
                  Enter the address where you want to receive your order.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  id="shipping-form"
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="addressLine1">Address Line 1</Label>
                    <Textarea id="addressLine1" {...register("addressLine1")} />
                    {errors.addressLine1 && (
                      <p className="text-sm text-destructive">
                        {errors.addressLine1.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addressLine2">
                      Address Line 2 (Optional)
                    </Label>
                    <Input id="addressLine2" {...register("addressLine2")} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" {...register("city")} />
                      {errors.city && (
                        <p className="text-sm text-destructive">
                          {errors.city.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State / Province</Label>
                      <Input id="state" {...register("state")} />
                      {errors.state && (
                        <p className="text-sm text-destructive">
                          {errors.state.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input id="postalCode" {...register("postalCode")} />
                      {errors.postalCode && (
                        <p className="text-sm text-destructive">
                          {errors.postalCode.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input id="country" {...register("country")} />
                      {errors.country && (
                        <p className="text-sm text-destructive">
                          {errors.country.message}
                        </p>
                      )}
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span
                    className={
                      appliedDiscount
                        ? "line-through text-muted-foreground"
                        : "font-medium"
                    }
                  >
                    ₦{subtotal.toFixed(2)}
                  </span>
                </div>
                {appliedDiscount && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({appliedDiscount.code})</span>
                    <span className="font-medium">
                      - ₦{discountAmount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Service Charge (6%)</span>
                  <span>₦{serviceCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>Calculated by admin</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-4">
                  <span>Total (before shipping)</span>
                  <span>₦{total.toFixed(2)}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  form="shipping-form"
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Submit for Shipping Cost
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutPageContent />
    </Suspense>
  );
}
