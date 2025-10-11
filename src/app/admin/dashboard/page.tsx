"use client";
import { Activity, CreditCard, DollarSign, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { collection, query, orderBy, limit, doc } from "firebase/firestore";
import React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { useDoc } from "@/firebase/firestore/use-doc";
import type { Order, User } from "@/lib/types";

export default function AdminDashboardPage() {
  const firestore = useFirestore();

  // Efficiently fetch live statistics from the summary document
  const summaryDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, "stats", "summary") : null),
    [firestore],
  );
  const { data: summaryData } = useDoc<{
    totalUsers: number;
    totalOrders: number;
  }>(summaryDocRef);

  // Keep existing queries for data not in the summary doc yet, like revenue and recent orders.
  const usersQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, "users")) : null),
    [firestore],
  );
  const { data: users } = useCollection<User>(usersQuery);

  const ordersQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, "customOrders")) : null),
    [firestore],
  );
  const { data: orders } = useCollection<Order>(ordersQuery);

  const recentOrdersQuery = useMemoFirebase(
    () =>
      firestore
        ? query(
            collection(firestore, "customOrders"),
            orderBy("createdAt", "desc"),
            limit(5),
          )
        : null,
    [firestore],
  );
  const { data: recentOrders } = useCollection<Order>(recentOrdersQuery);

  const totalRevenue =
    orders?.reduce((acc, order) => acc + (order.total ?? 0), 0) ?? 0;
  const pendingOrdersCount =
    orders?.filter((o) => o.status === "Pending Review").length ?? 0;

  const monthlyRevenue = React.useMemo(() => {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const monthlyData = monthNames.map((name) => ({ name, total: 0 }));

    orders?.forEach((order) => {
      if (order.createdAt && order.total) {
        const orderDate = new Date(order.createdAt);
        if (!isNaN(orderDate.getTime())) {
          const monthIndex = orderDate.getMonth();
          monthlyData[monthIndex].total += order.total;
        }
      }
    });

    return monthlyData;
  }, [orders]);

  return (
    <>
      <PageHeader title="Dashboard" />
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Based on all orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              +{summaryData?.totalUsers ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Total users on the platform
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              +{summaryData?.totalOrders ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">Total orders placed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Orders
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{pendingOrdersCount}</div>
            <p className="text-xs text-muted-foreground">
              Orders needing review
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={monthlyRevenue}>
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `₦${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    borderColor: "hsl(var(--border))",
                  }}
                />
                <Bar
                  dataKey="total"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>
              You have {pendingOrdersCount} pending orders.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-8">
            {recentOrders?.map((order) => {
              const user = users?.find((u) => u.id === order.userId);
              return (
                <div className="flex items-center gap-4" key={order.id}>
                  <Avatar className="hidden h-9 w-9 sm:flex">
                    <AvatarImage src={user?.avatar} alt="Avatar" />
                    <AvatarFallback>
                      {user?.firstName?.charAt(0)}
                      {user?.lastName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid gap-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {user?.email ?? "No email"}
                    </p>
                  </div>
                  <div className="ml-auto font-medium">
                    {order.total > 0 ? `₦${order.total.toFixed(2)}` : "Pending"}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
