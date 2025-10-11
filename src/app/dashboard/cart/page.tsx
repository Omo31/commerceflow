"use client";

import { ShoppingCart, Trash2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import {
  useAuth,
  useFirestore,
  useCollection,
  useMemoFirebase,
} from "@/firebase";
import type { CartItem } from "@/lib/types";
import {
  collection,
  doc,
  deleteDoc,
  updateDoc,
  writeBatch,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Discount } from "@/lib/types/discount";

const SERVICE_CHARGE_PERCENTAGE = 0.06;

export default function CartPage() {
  const { user, isUserLoading } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [couponCode, setCouponCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const cartQuery = useMemoFirebase(
    () =>
      firestore && user
        ? collection(firestore, `users/${user.uid}/cart`)
        : null,
    [firestore, user],
  );
  const { data: cartItems, isLoading } = useCollection<CartItem>(cartQuery);

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (!user || !firestore || newQuantity < 1) return;
    const itemRef = doc(firestore, `users/${user.uid}/cart`, itemId);
    await updateDoc(itemRef, { quantity: newQuantity });
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!user || !firestore) return;
    const itemRef = doc(firestore, `users/${user.uid}/cart`, itemId);
    await deleteDoc(itemRef);
  };

  const handleCancelOrder = async () => {
    if (!user || !firestore || !cartItems) return;
    const batch = writeBatch(firestore);

    let customOrderId: string | null = null;
    let isCustomOrderInCart = false;

    cartItems.forEach((item) => {
      const itemRef = doc(firestore, `users/${user.uid}/cart`, item.id);
      batch.delete(itemRef);
      if (item.isCustomOrder) {
        isCustomOrderInCart = true;
        customOrderId = item.productId;
      }
    });

    // If it was a custom order, revert its status
    if (isCustomOrderInCart && customOrderId) {
      const orderRef = doc(firestore, "customOrders", customOrderId);
      batch.update(orderRef, { status: "Accepted" });
    }

    try {
      await batch.commit();
      toast({
        title: "Cart Cleared",
        description: "Your shopping cart has been emptied.",
      });
      if (isCustomOrderInCart) {
        router.push("/dashboard/orders");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not clear the cart.",
      });
    }
  };

  const isCustomOrderInCart = cartItems?.some((item) => item.isCustomOrder);

  const subtotal =
    cartItems?.reduce((acc, item) => acc + item.price * item.quantity, 0) ?? 0;

  const handleApplyCoupon = async () => {
    if (!firestore || !couponCode) return;
    setCouponError(null);
    setAppliedDiscount(null);

    const discountsRef = collection(firestore, "discounts");
    const q = query(
      discountsRef,
      where("code", "==", couponCode.toUpperCase()),
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      setCouponError("Invalid coupon code.");
      return;
    }

    const discountDoc = querySnapshot.docs[0];
    const discount = { id: discountDoc.id, ...discountDoc.data() } as Discount;

    if (!discount.isActive) {
      setCouponError("This coupon is no longer active.");
      return;
    }

    if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) {
      setCouponError("This coupon has expired.");
      return;
    }

    if (discount.usageLimit && discount.timesUsed >= discount.usageLimit) {
      setCouponError("This coupon has reached its usage limit.");
      return;
    }

    if (discount.minOrderAmount && subtotal < discount.minOrderAmount) {
      setCouponError(
        `You must spend at least ₦${discount.minOrderAmount.toFixed(2)} to use this coupon.`,
      );
      return;
    }

    setAppliedDiscount(discount);
    toast({
      title: "Coupon Applied!",
      description: `"${discount.code}" was successfully applied.`,
    });
  };

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

  const handleCheckout = () => {
    if (!cartItems || cartItems.length === 0) {
      toast({ variant: "destructive", title: "Your cart is empty." });
      return;
    }
    const cartId = isCustomOrderInCart
      ? cartItems[0].productId
      : cartItems.map((item) => item.id).join("_");

    let checkoutUrl = `/dashboard/checkout?cartId=${cartId}`;
    if (appliedDiscount) {
      checkoutUrl += `&discountId=${appliedDiscount.id}`;
    }

    router.push(checkoutUrl);
  };

  if (isLoading || isUserLoading) {
    return <div>Loading cart...</div>;
  }

  return (
    <>
      <PageHeader title="Shopping Cart" />
      <div className="grid gap-8 lg:grid-cols-3 grid-cols-1">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Your Items</CardTitle>
            </CardHeader>
            <CardContent>
              {cartItems && cartItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="hidden md:table-header-group">
                      <TableRow>
                        <TableHead className="w-[100px]">Product</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead className="text-center">Quantity</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cartItems.map((item) => (
                        <TableRow
                          key={item.id}
                          className="flex flex-wrap md:table-row border-b last:border-b-0 py-4 md:py-0"
                        >
                          <TableCell className="w-full md:w-auto py-2 pr-0 flex justify-center">
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              width={80}
                              height={80}
                              className="rounded-md object-cover"
                            />
                          </TableCell>
                          <TableCell className="w-full md:w-auto py-2 pl-0 md:pl-4 text-center md:text-left">
                            <div className="flex flex-col items-center md:items-start">
                              <p className="font-space-grotesk font-semibold text-base mb-1">
                                {item.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                ₦{item.price.toFixed(2)} each
                              </p>
                              {item.isCustomOrder && (
                                <Badge variant="secondary" className="mt-2">
                                  Custom Item
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="w-1/2 md:w-auto py-2 text-center">
                            <div className="flex flex-col items-center">
                              <span className="text-sm text-muted-foreground md:hidden mb-1">
                                Quantity
                              </span>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleQuantityChange(
                                    item.id,
                                    parseInt(e.target.value),
                                  )
                                }
                                className="w-20 text-center"
                                min={1}
                                disabled={isCustomOrderInCart}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            ₦{(item.price * item.quantity).toFixed(2)}
                          </TableCell>
                          <TableCell className="w-1/2 md:w-auto py-2 text-right pr-0 md:pl-4 flex justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={isCustomOrderInCart}
                              className="hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-12">
                  <ShoppingCart className="h-16 w-16 text-muted-foreground" />
                  <h3 className="mt-4 text-xl font-semibold">
                    Your cart is empty
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    Looks like you haven’t added anything to your cart yet.
                  </p>
                  <Button asChild className="mt-6">
                    <Link href="/dashboard/shop">Start Shopping</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {cartItems && cartItems.length > 0 && (
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>
                  Review your order before proceeding to checkout.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                  <Button onClick={handleApplyCoupon}>Apply</Button>
                </div>
                {couponError && (
                  <p className="text-sm text-destructive mt-2">{couponError}</p>
                )}

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
                  <span className="font-medium">
                    ₦{serviceCharge.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-xl border-t pt-4">
                  <span>Total</span>
                  <span>₦{total.toFixed(2)}</span>
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-2">
                <Button className="w-full" onClick={handleCheckout}>
                  Proceed to Checkout
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleCancelOrder}
                >
                  Cancel Order
                </Button>
              </CardFooter>
            </Card>
            {isCustomOrderInCart && (
              <Alert>
                <AlertTitle>Custom Order</AlertTitle>
                <AlertDescription>
                  To modify items in a custom order, you must cancel this cart
                  and create a new custom order request.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </div>
    </>
  );
}
