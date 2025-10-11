"use client";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import type { Order, OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  useAuth,
  useFirestore,
  useCollection,
  useMemoFirebase,
} from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { PlusCircle, ArrowRight } from "lucide-react";
import { steps } from "@/components/order-status-tracker";

const statusStyles: { [key: string]: string } = {
  "Quote Requested":
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
  Quote:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
  Processing:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  "Payment Due":
    "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
  Completed:
    "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
};

const getStatusStyles = (status: OrderStatus): string => {
  if (status === "Rejected" || status === "Cancelled") {
    return statusStyles["rejected"];
  }

  const step = steps.find((s) => s.statuses.includes(status));
  return step
    ? statusStyles[step.name] || statusStyles["default"]
    : statusStyles["default"];
};

export default function OrdersPage() {
  const { user } = useAuth();
  const firestore = useFirestore();

  const ordersQuery = useMemoFirebase(
    () =>
      firestore && user
        ? query(
            collection(firestore, "customOrders"),
            where("userId", "==", user.uid),
          )
        : null,
    [firestore, user],
  );
  const { data: orders, isLoading } = useCollection<Order>(ordersQuery);

  const getOrderType = (order: Order) => {
    return order.cartId ? "Shop Order" : "Custom Order";
  };

  return (
    <>
      <PageHeader title="My Orders">
        <Button asChild>
          <Link href="/dashboard/orders/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Custom Order
          </Link>
        </Button>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>
            A list of all your custom and standard shop orders on CommerceFlow.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Loading your orders...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                orders?.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.id.substring(0, 7).toUpperCase()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          getOrderType(order) === "Custom Order"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {getOrderType(order)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "border-none",
                          getStatusStyles(order.status),
                        )}
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{order.items.length}</TableCell>
                    <TableCell className="text-right">
                      {order.total > 0
                        ? `₦${order.total.toFixed(2)}`
                        : "Pending Price"}
                    </TableCell>
                    <TableCell className="text-right">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/orders/${order.id}`}>
                          View <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              {!isLoading && orders?.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center h-48 text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-4">
                      <p>You haven&apos;t placed any orders yet.</p>
                      <Button asChild>
                        <Link href="/dashboard/orders/new">
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Create a New Order
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Showing <strong>1-{orders?.length ?? 0}</strong> of{" "}
            <strong>{orders?.length ?? 0}</strong> orders
          </div>
        </CardFooter>
      </Card>
    </>
  );
}
