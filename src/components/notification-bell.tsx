"use client";

import {
  collection,
  doc,
  orderBy,
  query,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { Bell, Circle } from "lucide-react";
import Link from "next/link";

import {
  useAuth,
  useCollection,
  useFirestore,
  useMemoFirebase,
} from "@/firebase";
import type { Notification } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "./ui/scroll-area";

function formatTimeAgo(timestamp: any): string {
  if (!timestamp) return "";
  const now = new Date();
  const date = timestamp.toDate();
  if (!date) return "";
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

export function NotificationBell() {
  const { user } = useAuth();
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
  const { data: notifications } =
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
    const batch = writeBatch(firestore);
    const unreadNotifications = notifications.filter((n) => !n.read);
    unreadNotifications.forEach((notif) => {
      const notifRef = doc(
        firestore,
        `users/${user.uid}/notifications`,
        notif.id,
      );
      batch.update(notifRef, { read: true });
    });
    await batch.commit();
  };

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 justify-center rounded-full p-0"
            >
              {unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="link"
              className="h-auto p-0 text-xs"
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-64">
          {notifications && notifications.length > 0 ? (
            notifications.map((notif) => (
              <DropdownMenuItem
                key={notif.id}
                className="flex items-start gap-2"
                onSelect={(e) => e.preventDefault()}
              >
                {!notif.read && (
                  <Circle className="h-2 w-2 mt-1.5 fill-primary text-primary" />
                )}
                <div className="flex-1 grid gap-1 pr-2">
                  <p className="text-sm font-medium leading-snug">
                    {notif.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimeAgo(notif.timestamp)}
                  </p>
                  <div className="mt-1 flex gap-2">
                    {notif.link && (
                      <Button
                        variant="secondary"
                        size="sm"
                        asChild
                        className="h-7"
                      >
                        <Link href={notif.link}>View</Link>
                      </Button>
                    )}
                    {!notif.read && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7"
                        onClick={() => handleMarkAsRead(notif.id)}
                      >
                        Mark as read
                      </Button>
                    )}
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              You have no notifications.
            </div>
          )}
        </ScrollArea>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/notifications" className="justify-center">
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
