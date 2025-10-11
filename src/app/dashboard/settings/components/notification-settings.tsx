"use client";

import { useForm } from "react-hook-form";
import { doc, updateDoc } from "firebase/firestore";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useFirestore } from "@/firebase";
import type { User } from "@/lib/types";
import { useEffect } from "react";

interface NotificationSettingsProps {
  userData: User | null;
}

export function NotificationSettings({ userData }: NotificationSettingsProps) {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      orderUpdates: userData?.notificationPreferences?.orderUpdates ?? true,
      promotions: userData?.notificationPreferences?.promotions ?? true,
    },
  });

  useEffect(() => {
    if (userData?.notificationPreferences) {
      setValue(
        "orderUpdates",
        userData.notificationPreferences.orderUpdates ?? true,
      );
      setValue(
        "promotions",
        userData.notificationPreferences.promotions ?? true,
      );
    }
  }, [userData, setValue]);

  const onPreferencesSubmit = async (data: any) => {
    if (!firestore || !user) return;
    const userDocRef = doc(firestore, "users", user.uid);

    try {
      await updateDoc(userDocRef, { notificationPreferences: data });
      toast({ title: "Notification preferences updated successfully!" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating preferences",
        description: error.message,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Manage your notification preferences.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onPreferencesSubmit)}
          className="space-y-6"
        >
          <div className="flex items-center justify-between p-4 border rounded-md">
            <div>
              <Label htmlFor="order-updates">Order Updates</Label>
              <p className="text-sm text-muted-foreground">
                Receive updates on your order status.
              </p>
            </div>
            <Switch
              id="order-updates"
              {...register("orderUpdates")}
              defaultChecked={userData?.notificationPreferences?.orderUpdates}
            />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-md">
            <div>
              <Label htmlFor="promotions">Promotions & Offers</Label>
              <p className="text-sm text-muted-foreground">
                Receive coupons, promotions, and special offers.
              </p>
            </div>
            <Switch
              id="promotions"
              {...register("promotions")}
              defaultChecked={userData?.notificationPreferences?.promotions}
            />
          </div>

          <Button type="submit">Save Preferences</Button>
        </form>
      </CardContent>
    </Card>
  );
}
