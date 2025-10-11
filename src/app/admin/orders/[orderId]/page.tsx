"use client";
import { useState, useEffect } from "react";
import { notFound, useRouter } from "next/navigation";
import {
  doc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";
import { ArrowLeft, Copy, X, Check, Send, Ship } from "lucide-react";
import Link from "next/link";

import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import type { Order, User, OrderStatus, OrderHistory } from "@/lib/types";
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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { createNotification } from "@/lib/notifications";
import { ChatInterface } from "@/components/chat-interface";
import { getStatusStyles } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import {
  Timeline,
  TimelineItem,
  TimelineContent,
} from "@/components/ui/timeline";

const SERVICE_CHARGE_PERCENTAGE = 0.06; // 6%

type PageProps = {
  params: { orderId: string };
};

export default function OrderDetailPage({ params }: PageProps) {
  const { orderId } = params;
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const orderDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, "customOrders", orderId) : null),
    [firestore, orderId],
  );
  const {
    data: order,
    isLoading: isOrderLoading,
    refresh: refreshOrder,
  } = useDoc<Order>(orderDocRef);

  const userDocRef = useMemoFirebase(
    () => (firestore && order ? doc(firestore, "users", order.userId) : null),
    [firestore, order],
  );
  const { data: user, isLoading: isUserLoading } = useDoc<User>(userDocRef);

  const [itemPrices, setItemPrices] = useState<Record<number, number>>({});
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingCarrier, setShippingCarrier] = useState("");
  const [privateNote, setPrivateNote] = useState("");

  useEffect(() => {
    if (order) {
      const initialPrices: Record<number, number> = {};
      order.items.forEach((item, index) => {
        initialPrices[index] = item.price ?? 0;
      });
      setItemPrices(initialPrices);
      setShippingCost(order.shippingCost || 0);
      setTrackingNumber(order.trackingNumber || "");
      setShippingCarrier(order.shippingCarrier || "");
    }
  }, [order]);

  const handlePriceChange = (index: number, price: number) => {
    setItemPrices((prev) => ({ ...prev, [index]: price }));
  };

  const updateOrderStatus = async (
    status: OrderStatus,
    notificationMessage: string,
    newHistoryEntry?: Partial<OrderHistory>,
  ) => {
    if (!orderDocRef || !order) return;
    const historyEntry: OrderHistory = {
      status,
      timestamp: new Date().toISOString(),
      notified: !!notificationMessage,
      ...newHistoryEntry,
    };
    try {
      await updateDoc(orderDocRef, {
        status,
        updatedAt: serverTimestamp(),
        history: arrayUnion(historyEntry),
      });
      if (notificationMessage) {
        await createNotification(
          firestore,
          order.userId,
          notificationMessage,
          `/dashboard/orders/${order.id}`,
        );
      }
      toast({ title: `Order status updated to ${status}` });
      refreshOrder(); // Re-fetch order data to reflect status change
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating status",
        description: error.message,
      });
    }
  };

  const handleSavePrices = async () => {
    if (!orderDocRef || !order) return;

    const updatedItems = order.items.map((item, index) => ({
      ...item,
      price: itemPrices[index] || 0,
    }));

    const subtotal = updatedItems.reduce(
      (acc, item) => acc + (item.price ?? 0) * item.quantity,
      0,
    );
    const serviceCharge = subtotal * SERVICE_CHARGE_PERCENTAGE;
    const total = subtotal + serviceCharge + (order.shippingCost || 0);
    const historyEntry: OrderHistory = {
      status: "Pending Acceptance",
      timestamp: new Date().toISOString(),
      notified: true,
    };

    try {
      await updateDoc(orderDocRef, {
        items: updatedItems,
        subtotal: subtotal,
        serviceCharge: serviceCharge,
        total: total,
        status: "Pending Acceptance",
        updatedAt: serverTimestamp(),
        history: arrayUnion(historyEntry),
      });
      await createNotification(
        firestore,
        order.userId,
        `Your quote for order #${order.id.substring(0, 7)} is ready for review.`,
        `/dashboard/orders/${order.id}`,
      );
      toast({ title: "Prices updated and quote sent to user!" });
      refreshOrder();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating prices",
        description: error.message,
      });
    }
  };

  const handleSaveShipping = async () => {
    if (!orderDocRef || !order) return;

    const total =
      (order.subtotal || 0) + (order.serviceCharge || 0) + shippingCost;
    const historyEntry: OrderHistory = {
      status: "Ready for Payment",
      timestamp: new Date().toISOString(),
      notified: true,
    };

    try {
      await updateDoc(orderDocRef, {
        shippingCost: shippingCost,
        total: total,
        status: "Ready for Payment",
        updatedAt: serverTimestamp(),
        history: arrayUnion(historyEntry),
      });
      await createNotification(
        firestore,
        order.userId,
        `Shipping cost has been added to your order #${order.id.substring(
          0,
          7,
        )}. It's ready for payment.`,
        `/dashboard/orders/${order.id}`,
      );
      toast({
        title: "Shipping cost added!",
        description: "The user can now proceed to payment.",
      });
      refreshOrder();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error saving shipping cost",
        description: error.message,
      });
    }
  };

  const handleSaveTracking = async () => {
    if (!orderDocRef || !order) return;
    try {
      await updateDoc(orderDocRef, {
        trackingNumber,
        shippingCarrier,
        status: "Shipped",
        updatedAt: serverTimestamp(),
        history: arrayUnion({
          status: "Shipped",
          timestamp: new Date().toISOString(),
          notified: true,
        }),
      });
      await createNotification(
        firestore,
        order.userId,
        `Your order #${order.id.substring(0, 7)} has shipped!`,
        `/dashboard/orders/${order.id}`,
      );
      toast({ title: "Tracking information saved and user notified." });
      refreshOrder();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error saving tracking info",
        description: error.message,
      });
    }
  };

  const handleAddNote = async () => {
    if (!orderDocRef || !privateNote) return;
    try {
      await updateDoc(orderDocRef, {
        privateNotes: arrayUnion(
          `[${new Date().toLocaleString()}] ${privateNote}`,
        ),
      });
      setPrivateNote("");
      toast({ title: "Note added successfully" });
      refreshOrder();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error adding note",
        description: error.message,
      });
    }
  };

  if (isOrderLoading || isUserLoading) {
    return <div>Loading...</div>;
  }

  if (!order) {
    return notFound();
  }

  const canPriceOrder = order.status === "Pricing";
  const canAddShipping = order.status === "Ready for Shipping Cost";
  const canAddTracking = order.status === "Processing"; // Example status

  return (
    <>
      <PageHeader title={`Order ${order.id.substring(0, 7).toUpperCase()}`} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Items & Services</CardTitle>
              <CardDescription>
                {canPriceOrder
                  ? "Input prices for each item/service below and save to send the quote."
                  : "Items and services included in this order."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item/Service</TableHead>
                    <TableHead>Qty/Unit</TableHead>
                    <TableHead className="text-right">
                      {canPriceOrder ? "Price per Unit (₦)" : "Price"}
                    </TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <p className="font-medium">
                          {item.name}{" "}
                          {item.type === "service" && (
                            <span className="font-normal text-muted-foreground">
                              (Service)
                            </span>
                          )}
                        </p>
                        {item.type === "service" && item.description && (
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.quantity} {item.unitOfMeasure}
                      </TableCell>
                      <TableCell className="text-right">
                        {canPriceOrder ? (
                          <Input
                            type="number"
                            value={itemPrices[index] ?? ""}
                            onChange={(e) =>
                              handlePriceChange(
                                index,
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="w-24 ml-auto text-right"
                            placeholder="0.00"
                          />
                        ) : (
                          `₦${(item.price ?? 0).toFixed(2)}`
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        ₦
                        {(
                          (itemPrices[index] ?? item.price ?? 0) * item.quantity
                        ).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            {canPriceOrder && (
              <CardFooter className="justify-end">
                <Button onClick={handleSavePrices}>
                  Save Prices & Send Quote
                </Button>
              </CardFooter>
            )}
          </Card>
          {canAddShipping && order.shippingAddress && (
            <Card>
              <CardHeader>
                <CardTitle>Add Shipping Cost</CardTitle>
                <CardDescription>
                  The user has provided their shipping address. Calculate and
                  add the shipping cost to finalize the total.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="shippingCost">Shipping Cost (₦)</Label>
                  <Input
                    id="shippingCost"
                    type="number"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(Number(e.target.value))}
                    placeholder="Enter shipping cost"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveShipping}>
                  Save Shipping Cost & Finalize
                </Button>
              </CardFooter>
            </Card>
          )}
          {canAddTracking && (
            <Card>
              <CardHeader>
                <CardTitle>Add Shipping Information</CardTitle>
                <CardDescription>
                  Enter the tracking details for the shipment.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="shipping-carrier">Shipping Carrier</Label>
                  <Input
                    id="shipping-carrier"
                    value={shippingCarrier}
                    onChange={(e) => setShippingCarrier(e.target.value)}
                    placeholder="e.g., DHL, GIG Logistics"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tracking-number">Tracking Number</Label>
                  <Input
                    id="tracking-number"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="e.g., 1234567890"
                  />
                </div>
              </CardContent>
              <CardFooter className="justify-end">
                <Button onClick={handleSaveTracking}>
                  <Ship className="mr-2 h-4 w-4" /> Save & Mark as Shipped
                </Button>
              </CardFooter>
            </Card>
          )}
          {order && (
            <ChatInterface orderId={order.id} orderUserId={order.userId} />
          )}
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Order Summary</CardTitle>
              <Badge
                variant="outline"
                className={getStatusStyles(order.status)}
              >
                {order.status}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₦{(order.subtotal ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Service Charge (6%)</span>
                <span>₦{(order.serviceCharge ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>₦{(shippingCost ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>
                  ₦
                  {(
                    (order.subtotal ?? 0) +
                    (order.serviceCharge ?? 0) +
                    shippingCost
                  ).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline>
                {[...(order.history || [])].reverse().map((entry, index) => (
                  <TimelineItem
                    key={index}
                    title={entry.status}
                    time={`${new Date(
                      entry.timestamp,
                    ).toLocaleDateString()} ${new Date(
                      entry.timestamp,
                    ).toLocaleTimeString()}`}
                  >
                    <p className="text-sm text-muted-foreground">
                      {" "}
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </p>
                    {entry.notified && (
                      <p className="text-xs text-muted-foreground">
                        User notified
                      </p>
                    )}
                  </TimelineItem>
                ))}
              </Timeline>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Details</CardTitle>
            </CardHeader>
            <CardContent>
              {user ? (
                <div className="space-y-2 text-sm">
                  <p className="font-medium">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-muted-foreground">{user.email}</p>
                  {order.shippingAddress && (
                    <div className="pt-2 text-muted-foreground border-t mt-2">
                      <p className="font-medium text-foreground mb-1">
                        Shipping Address
                      </p>
                      <p>{order.shippingAddress.addressLine1}</p>
                      {order.shippingAddress.addressLine2 && (
                        <p>{order.shippingAddress.addressLine2}</p>
                      )}
                      <p>
                        {order.shippingAddress.city},{" "}
                        {order.shippingAddress.state}{" "}
                        {order.shippingAddress.postalCode}
                      </p>
                      <p>{order.shippingAddress.country}</p>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => {
                      if (user.email) {
                        navigator.clipboard.writeText(user.email);
                        toast({ title: "Email copied!" });
                      }
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Email
                  </Button>
                </div>
              ) : (
                <p>Loading user details...</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Internal Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                {(order.privateNotes || []).map((note, index) => (
                  <p key={index} className="border-b pb-1">
                    {note}
                  </p>
                ))}
                {(!order.privateNotes || order.privateNotes.length === 0) && (
                  <p>No notes yet.</p>
                )}
              </div>
              <div className="mt-4 space-y-2">
                <Textarea
                  value={privateNote}
                  onChange={(e) => setPrivateNote(e.target.value)}
                  placeholder="Add a private note for your team..."
                />
                <Button
                  size="sm"
                  onClick={handleAddNote}
                  disabled={!privateNote}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Add Note
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/orders">
                {" "}
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders{" "}
              </Link>
            </Button>
            {order.status === "Pending Review" && (
              <Button
                onClick={() =>
                  updateOrderStatus(
                    "Pricing",
                    `Your order #${order.id.substring(0, 7)} is being priced.`,
                  )
                }
              >
                <Check className="mr-2 h-4 w-4" /> Accept & Start Pricing{" "}
              </Button>
            )}
            {order.status === "Pending Review" && (
              <Button
                variant="destructive"
                onClick={() =>
                  updateOrderStatus(
                    "Rejected",
                    `Your order #${order.id.substring(0, 7)} has been rejected.`,
                  )
                }
              >
                <X className="mr-2 h-4 w-4" /> Reject Order
              </Button>
            )}
            {order.status === "Accepted" && (
              <Button
                onClick={() =>
                  updateOrderStatus(
                    "Processing",
                    `Your order #${order.id.substring(0, 7)} is now processing.`,
                  )
                }
              >
                <Check className="mr-2 h-4 w-4" /> Start Processing{" "}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
