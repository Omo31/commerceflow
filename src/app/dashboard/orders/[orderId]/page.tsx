"use client";
import { notFound, useRouter } from "next/navigation";
import {
  doc,
  updateDoc,
  writeBatch,
  collection,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import {
  ArrowLeft,
  ShoppingCart,
  Check,
  X,
  Ban,
  Pencil,
  FileText,
  Loader2,
  PackageCheck,
  FileSignature,
  CircleDollarSign,
  Hourglass,
} from "lucide-react";
import Link from "next/link";

import {
  useAuth,
  useFirestore,
  useDoc,
  useMemoFirebase,
  useCollection,
} from "@/firebase";
import type { Order, Invoice, OrderStatus, User } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createNotification } from "@/lib/notifications";
import { useState } from "react";
import { ChatInterface } from "@/components/chat-interface";
import { OrderStatusTracker } from "@/components/order-status-tracker";
import { ShippingAddressForm } from "@/app/dashboard/orders/components/ShippingAddressForm";
import { PaystackButton } from "@/components/paystack-button";

export default function UserOrderDetailPage({
  params,
}: {
  params: { orderId: string };
}) {
  const { orderId } = params;
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const orderDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, "customOrders", orderId) : null),
    [firestore, orderId],
  );
  const { data: order, isLoading: isOrderLoading } = useDoc<Order>(orderDocRef);

  const adminsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, "users"), where("role", "==", "admin"))
        : null,
    [firestore],
  );
  const { data: admins } = useCollection<User>(adminsQuery);

  const handleQuoteResponse = async (accepted: boolean) => {
    if (!orderDocRef || !order || !firestore || !admins) return;
    const newStatus = accepted ? "Processing" : "Rejected";
    try {
      await updateDoc(orderDocRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      if (accepted) {
        toast({
          title: "Quote Accepted!",
          description: "Please provide your shipping address below.",
        });
        const notificationPromises = admins.map((admin) =>
          createNotification(
            firestore,
            admin.id,
            `Quote for order #${order.id.substring(0, 7)} has been accepted.`,
            `/admin/orders/${order.id}`,
          ),
        );
        await Promise.all(notificationPromises);
      } else {
        toast({
          title: "Quote Rejected",
          description: "You have rejected the quote for this order.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleEditOrder = () => {
    if (!order) return;
    const orderItems = JSON.stringify(order.items);
    router.push(
      `/dashboard/orders/new?orderId=${orderId}&items=${encodeURIComponent(orderItems)}`,
    );
  };

  if (isOrderLoading) {
    return <div>Loading...</div>;
  }

  if (!order) {
    return notFound();
  }

  const isQuotePending = order.status === "Pending Acceptance";
  const isReadyForPayment = order.status === "Ready for Payment";

  const renderActionFooter = () => {
    if (order.status === "Pending Review" || order.status === "Pricing") {
      return (
        <CardFooter>
          <Alert>
            <Hourglass className="h-4 w-4" />
            <AlertTitle>Quote in Progress</AlertTitle>
            <AlertDescription>
              Our team is currently reviewing your order and preparing a quote.
              We will notify you once it&apos;s ready.
            </AlertDescription>
          </Alert>
        </CardFooter>
      );
    }
    if (isQuotePending) {
      return (
        <CardFooter className="flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Admin has sent a quote. Please review and respond.
          </p>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={handleEditOrder}
              aria-label="Edit this order"
            >
              <Pencil className="mr-2 h-4 w-4" /> Edit Order
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleQuoteResponse(false)}
              aria-label="Reject this quote"
            >
              <X className="mr-2 h-4 w-4" /> Reject Quote
            </Button>
            <Button
              onClick={() => handleQuoteResponse(true)}
              aria-label="Accept this quote"
            >
              <Check className="mr-2 h-4 w-4" /> Accept Quote
            </Button>
          </div>
        </CardFooter>
      );
    }
    if (isReadyForPayment) {
      return (
        <CardFooter className="flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Your order is finalized and ready for payment.
          </p>
          {user?.email && (
            <PaystackButton order={order} userEmail={user.email} />
          )}
        </CardFooter>
      );
    }
    if (order.status === "Rejected") {
      return (
        <CardFooter>
          <Alert variant="destructive">
            <Ban className="h-4 w-4" />
            <AlertTitle>Quote Rejected</AlertTitle>
            <AlertDescription>
              You have rejected this quote. You can create a new custom order if
              you&apos;d like to make changes.
            </AlertDescription>
          </Alert>
        </CardFooter>
      );
    }
    if (order.status === "Completed" || order.status === "Shipped") {
      return (
        <CardFooter>
          <Alert className="border-green-500 text-green-700">
            <PackageCheck className="h-4 w-4 text-green-600" />
            <AlertTitle>Order Completed</AlertTitle>
            <AlertDescription>
              This order has been paid for and is complete. Thank you for your
              purchase!
            </AlertDescription>
          </Alert>
        </CardFooter>
      );
    }
    return null;
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-4">
        <Link href="/dashboard/orders">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
          </Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Order #{order.id.substring(0, 7)}</CardTitle>
              <CardDescription>
                Placed on{" "}
                {new Date(order.createdAt.seconds * 1000).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="text-right">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        ${item.price?.toFixed(2) ?? "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        ${(item.price * item.quantity).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            {renderActionFooter()}
          </Card>
          {order.status === "Processing" && user && (
            <ShippingAddressForm orderId={orderId} userId={user.uid} />
          )}
        </div>
        <div className="space-y-6">
          <OrderStatusTracker status={order.status} />
          <ChatInterface orderId={orderId} />
        </div>
      </div>
    </div>
  );
}
