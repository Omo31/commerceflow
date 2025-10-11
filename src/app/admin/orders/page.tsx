"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, MoreHorizontal, Check, X } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/page-header";
import type { Order, OrderStatus, User } from "@/lib/types";
import { cn, getStatusStyles } from "@/lib/utils";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import {
  collection,
  query,
  writeBatch,
  doc,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

const ALL_STATUSES: OrderStatus[] = [
  "Pending Review",
  "Pricing",
  "Pending Acceptance",
  "Accepted",
  "Rejected",
  "In Cart",
  "Processing",
  "Ready for Payment",
  "Shipped",
  "Completed",
  "Cancelled",
];

export default function AdminOrdersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  const customOrdersQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, "customOrders")) : null),
    [firestore],
  );
  const {
    data: customOrders,
    isLoading: loadingCustomOrders,
    refresh: refreshOrders,
  } = useCollection<Order>(customOrdersQuery);

  const usersQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, "users")) : null),
    [firestore],
  );
  const { data: users, isLoading: loadingUsers } =
    useCollection<User>(usersQuery);

  const isLoading = loadingCustomOrders || loadingUsers;

  const filteredOrders = useMemo(() => {
    if (!customOrders || !users) return [];
    return customOrders.filter((order) => {
      const user = users.find((u) => u.id === order.userId);
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm
        ? user?.firstName.toLowerCase().includes(searchTermLower) ||
          user?.lastName.toLowerCase().includes(searchTermLower) ||
          user?.email.toLowerCase().includes(searchTermLower) ||
          order.id.toLowerCase().includes(searchTermLower)
        : true;

      const matchesStatus =
        statusFilter !== "all" ? order.status === statusFilter : true;

      return matchesSearch && matchesStatus;
    });
  }, [customOrders, users, searchTerm, statusFilter]);

  const handleSelectAll = (checked: boolean) => {
    setSelectedOrders(checked ? filteredOrders.map((o) => o.id) : []);
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    setSelectedOrders((prev) =>
      checked ? [...prev, orderId] : prev.filter((id) => id !== orderId),
    );
  };

  const handleBulkStatusUpdate = async (status: OrderStatus) => {
    if (!firestore || selectedOrders.length === 0) return;
    const batch = writeBatch(firestore);
    const historyEntry = {
      status,
      timestamp: new Date().toISOString(),
      notified: false,
    }; // Not notifying on bulk update for now

    selectedOrders.forEach((orderId) => {
      const orderRef = doc(firestore, "customOrders", orderId);
      batch.update(orderRef, {
        status,
        updatedAt: serverTimestamp(),
        history: arrayUnion(historyEntry),
      });
    });

    try {
      await batch.commit();
      toast({
        title: `Successfully updated ${selectedOrders.length} orders to "${status}".`,
      });
      setSelectedOrders([]);
      refreshOrders();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Bulk update failed",
        description: error.message,
      });
    }
  };

  const isAllSelected =
    selectedOrders.length > 0 &&
    selectedOrders.length === filteredOrders.length;

  return (
    <>
      <PageHeader title="Manage Orders" />
      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>
            Review and manage all orders placed on the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Search by customer, email or order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow"
            />
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as any)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {ALL_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  disabled={selectedOrders.length === 0}
                >
                  Bulk Actions ({selectedOrders.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Change Status</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {ALL_STATUSES.map((status) => (
                      <DropdownMenuItem
                        key={status}
                        onSelect={() => handleBulkStatusUpdate(status)}
                      >
                        {status}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center h-24 text-muted-foreground"
                  >
                    Loading orders...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                filteredOrders.map((order) => {
                  const user = users?.find((u) => u.id === order.userId);
                  return (
                    <TableRow
                      key={order.id}
                      data-state={
                        selectedOrders.includes(order.id) && "selected"
                      }
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedOrders.includes(order.id)}
                          onCheckedChange={(checked) =>
                            handleSelectOrder(order.id, !!checked)
                          }
                          aria-label={`Select order ${order.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {user?.firstName} {user?.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user?.email}
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
                      <TableCell>{order.items.length}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">Custom Order</Badge>
                      </TableCell>
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
                          <Link href={`/admin/orders/${order.id}`}>
                            View <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              {!isLoading && filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center h-24 text-muted-foreground"
                  >
                    No orders match your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Showing <strong>{filteredOrders.length}</strong> of{" "}
            <strong>{customOrders?.length ?? 0}</strong> orders
          </div>
        </CardFooter>
      </Card>
    </>
  );
}
