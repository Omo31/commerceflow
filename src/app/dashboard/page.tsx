"use client";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  DollarSign,
  PackagePlus,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { cn, getStatusStyles } from "@/lib/utils";
import {
  useAuth,
  useFirestore,
  useCollection,
  useMemoFirebase,
} from "@/firebase";
import { collection, query, where, orderBy, limit } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
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
  const { data: userOrders, isLoading: isLoadingOrders } =
    useCollection<Order>(ordersQuery);

  const recentOrdersQuery = useMemoFirebase(
    () =>
      firestore && user
        ? query(
            collection(firestore, "customOrders"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc"),
            limit(5),
          )
        : null,
    [firestore, user],
  );
  const { data: recentUserOrders, isLoading: isLoadingRecentOrders } =
    useCollection<Order>(recentOrdersQuery);

  const totalSpent =
    userOrders?.reduce((acc, order) => acc + (order.total ?? 0), 0) ?? 0;
  const completedOrders =
    userOrders?.filter((o) => o.status === "Completed").length ?? 0;
  const pendingOrders =
    userOrders?.filter((o) =>
      ["Pending Review", "Pricing", "Pending Acceptance"].includes(o.status),
    ).length ?? 0;
  const activeOrders =
    userOrders?.filter((o) => ["Processing", "Shipped"].includes(o.status))
      .length ?? 0;

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <PageHeader title="Dashboard">
        <Button asChild>
          <Link href="/dashboard/shop">
            <PackagePlus className="mr-2 h-4 w-4" />
            Go to Shop
          </Link>
        </Button>
      </PageHeader>
      <section className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        {isLoadingOrders ? (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-1/2" />
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-1/3 mt-1" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-1/2" />
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-1/3 mt-1" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-1/2" />
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-1/3 mt-1" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-1/2" />
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-1/3 mt-1" />
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Spent
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₦{totalSpent.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all orders
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Completed Orders
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+{completedOrders}</div>
                <p className="text-xs text-muted-foreground">
                  Total completed orders
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Orders
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+{pendingOrders}</div>
                <p className="text-xs text-muted-foreground">
                  Orders awaiting action
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Orders
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+{activeOrders}</div>
                <p className="text-xs text-muted-foreground">
                  Orders currently in progress
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </section>
      <section className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-1">
        <Card>
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>
                An overview of your most recent orders.
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/dashboard/orders">
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingRecentOrders ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <p>Loading recent orders...</p>
                    </TableCell>
                  </TableRow>
                ) : recentUserOrders?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center h-24 text-muted-foreground"
                    >
                      You have no recent orders.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentUserOrders?.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="font-medium">
                          {order.id.substring(0, 7).toUpperCase()}
                        </div>
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
                      <TableCell className="text-right">
                        {order.total > 0 ? `₦${order.total.toFixed(2)}` : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
