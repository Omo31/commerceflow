"use client";

import { collection, doc, orderBy, query, updateDoc } from "firebase/firestore";
import { Bell, Circle } from "lucide-react";
import Link from "next/link";
import {
  useAuthState,
  useCollection,
  useFirestore,
  useMemoFirebase,
} from "@/firebase";

import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Notification } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function formatTimeAgo(timestamp: any): string {
  if (!timestamp) return "";
  const now = new Date();
  const date = timestamp.toDate();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
}

export default function NotificationsPage() {
  const { user } = useAuthState();
  const firestore = useFirestore();

  const notificationsQuery = useMemoFirebase(
    () =>
      user
        ? query(
            collection(firestore, `users/${user.uid}/notifications`),
            orderBy("timestamp", "desc"),
          )
        : null,
    [user, firestore],
  );
  const { data: notifications, isLoading } =
    useCollection<Notification>(notificationsQuery);

  const handleMarkAsRead = async (notificationId: string) => {
    if (!user || !firestore) return;
    const notifRef = doc(
      firestore,
      `users/${user.uid}/notifications`,
      notificationId,
    );
    await updateDoc(notifRef, { read: true });
  };

  const handleMarkAllAsRead = async () => {
    if (!user || !firestore || !notifications) return;
    const unreadNotifications = notifications.filter((n) => !n.read);
    for (const notif of unreadNotifications) {
      const notifRef = doc(
        firestore,
        `users/${user.uid}/notifications`,
        notif.id,
      );
      await updateDoc(notifRef, { read: true });
    }
  };

  const hasUnread = notifications?.some((n) => !n.read);

  return (
    <>
      <PageHeader title="Notifications">
        <Button
          onClick={handleMarkAllAsRead}
          disabled={!hasUnread || isLoading}
        >
          Mark all as read
        </Button>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Your Notifications</CardTitle>
          <CardDescription>
            Updates on your orders and other important information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && <p>Loading notifications...</p>}
          {!isLoading && notifications?.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center py-12 text-muted-foreground">
              <Bell className="h-16 w-16" />
              <h3 className="mt-4 text-xl font-semibold">
                No notifications yet
              </h3>
              <p className="mt-2">
                Check back here for updates on your orders.
              </p>
            </div>
          )}
          {!isLoading &&
            notifications &&
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "flex items-start gap-4 rounded-lg p-4 transition-colors",
                  notification.read
                    ? "bg-transparent"
                    : "bg-blue-50 dark:bg-blue-900/20",
                )}
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback>
                    <Bell className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="grid gap-1 flex-1">
                  <p className="text-sm font-medium">{notification.message}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatTimeAgo(notification.timestamp)}
                  </p>
                  <div className="mt-2">
                    {notification.link && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={notification.link}>View Details</Link>
                      </Button>
                    )}
                  </div>
                </div>
                {!notification.read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <Circle className="h-3 w-3 fill-primary text-primary" />
                    <span className="sr-only">Mark as read</span>
                  </Button>
                )}
              </div>
            ))}
        </CardContent>
      </Card>
    </>
  );
}
