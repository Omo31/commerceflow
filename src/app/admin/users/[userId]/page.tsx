"use client";
import { useState, useEffect, useMemo } from "react";
import { notFound, useRouter } from "next/navigation";
import {
  doc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  arrayUnion,
} from "firebase/firestore";
import {
  ArrowLeft,
  MoreVertical,
  UserX,
  UserCheck,
  Trash2,
  ShieldCheck,
  Mail,
  Send,
  DollarSign,
  ShoppingCart,
  Tag,
  Edit,
  X,
} from "lucide-react";
import Link from "next/link";

import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import type { User, Order, ShippingAddress } from "@/lib/types";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { getStatusStyles } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function UserDetailPage({
  params,
}: {
  params: { userId: string };
}) {
  const { userId } = params;
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [note, setNote] = useState("");
  const [tag, setTag] = useState("");

  const userDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, "users", userId) : null),
    [firestore, userId],
  );
  const {
    data: user,
    isLoading: isUserLoading,
    refresh: refreshUser,
  } = useDoc<User>(userDocRef);

  useEffect(() => {
    if (firestore && userId) {
      const fetchOrders = async () => {
        setIsLoadingOrders(true);
        const ordersQuery = query(
          collection(firestore, "customOrders"),
          where("userId", "==", userId),
        );
        const snapshot = await getDocs(ordersQuery);
        const orders = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Order,
        );
        setUserOrders(
          orders.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          ),
        );
        setIsLoadingOrders(false);
      };
      fetchOrders();
    }
  }, [firestore, userId]);

  const handleStatusToggle = async () => {
    if (!userDocRef || !user) return;
    const newStatus = user.status === "active" ? "disabled" : "active";
    try {
      await updateDoc(userDocRef, { status: newStatus });
      toast({ title: `User has been ${newStatus}.` });
      refreshUser();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating status",
        description: error.message,
      });
    }
  };

  const handleAddNote = async () => {
    if (!userDocRef || !note) return;
    try {
      await updateDoc(userDocRef, {
        notes: arrayUnion(`[${new Date().toLocaleString()}] ${note}`),
      });
      setNote("");
      toast({ title: "Note added successfully" });
      refreshUser();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error adding note",
        description: error.message,
      });
    }
  };

  const handleAddTag = async () => {
    if (!userDocRef || !tag) return;
    try {
      await updateDoc(userDocRef, { tags: arrayUnion(tag.trim()) });
      setTag("");
      toast({ title: "Tag added" });
      refreshUser();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error adding tag",
        description: error.message,
      });
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!userDocRef || !user?.tags) return;
    try {
      const updatedTags = user.tags.filter((t) => t !== tagToRemove);
      await updateDoc(userDocRef, { tags: updatedTags });
      toast({ title: "Tag removed" });
      refreshUser();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error removing tag",
        description: error.message,
      });
    }
  };

  if (isUserLoading) {
    return <div>Loading user details...</div>;
  }

  if (!user) {
    return notFound();
  }

  const userLTV = userOrders.reduce(
    (acc, order) => acc + (order.status === "Completed" ? order.total : 0),
    0,
  );
  const userInitial = (user.firstName?.[0] || "") + (user.lastName?.[0] || "");

  return (
    <>
      <PageHeader title="User Profile" />
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Order History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingOrders && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        Loading orders...
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoadingOrders && userOrders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No orders found for this user.
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoadingOrders &&
                    userOrders.slice(0, 5).map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono">
                          {order.id.substring(0, 7)}...
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getStatusStyles(order.status)}
                          >
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          ₦{order.total.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/admin/orders/${order.id}`}>View</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Internal Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                {(user.notes || []).map((n, index) => (
                  <p key={index} className="border-b pb-1">
                    {n}
                  </p>
                ))}
                {(!user.notes || user.notes.length === 0) && (
                  <p>No notes yet.</p>
                )}
              </div>
              <div className="mt-4 space-y-2">
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a private note for your team..."
                />
                <Button size="sm" onClick={handleAddNote} disabled={!note}>
                  <Send className="mr-2 h-4 w-4" />
                  Add Note
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="items-center flex-row">
              <Avatar className="h-16 w-16 mr-4">
                <AvatarImage
                  src={user.avatar}
                  alt={`${user.firstName} ${user.lastName}`}
                />
                <AvatarFallback>{userInitial}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">
                  {user.firstName} {user.lastName}
                </CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Badge
                variant={user.status === "active" ? "default" : "destructive"}
              >
                {user.status}
              </Badge>
              <Badge variant="secondary">{user.role}</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={handleStatusToggle}>
                {user.status === "active" ? (
                  <UserX className="mr-2 h-4 w-4" />
                ) : (
                  <UserCheck className="mr-2 h-4 w-4" />
                )}
                {user.status === "active" ? "Disable" : "Enable"}
              </Button>
              <Button variant="outline">
                <Mail className="mr-2 h-4 w-4" /> Reset Password
              </Button>
              <Button variant="destructive" className="col-span-2">
                <Trash2 className="mr-2 h-4 w-4" /> Delete User
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-muted-foreground">
                  <DollarSign className="h-5 w-5 mr-2" />{" "}
                  <span className="font-medium">Lifetime Value</span>
                </div>
                <span className="font-bold text-lg">₦{userLTV.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-muted-foreground">
                  <ShoppingCart className="h-5 w-5 mr-2" />{" "}
                  <span className="font-medium">Total Orders</span>
                </div>
                <span className="font-bold text-lg">{userOrders.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {user.tags?.map((t) => (
                  <Badge key={t} variant="secondary">
                    {t}
                    <button
                      onClick={() => handleRemoveTag(t)}
                      className="ml-2 rounded-full hover:bg-destructive/20 p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {(!user.tags || user.tags.length === 0) && (
                  <p className="text-sm text-muted-foreground">No tags yet.</p>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <Input
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="Add a tag..."
                />
                <Button onClick={handleAddTag} disabled={!tag}>
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
