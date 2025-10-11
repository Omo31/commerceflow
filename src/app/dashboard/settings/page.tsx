"use client";

import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { useAuth, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { User } from "@/lib/types";

import { ProfileSettings } from "./components/profile-settings";
import { AddressSettings } from "./components/address-settings";
import { NotificationSettings } from "./components/notification-settings";
import { PasswordSettings } from "./components/password-settings";

export default function SettingsPage() {
  const { user } = useAuth();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, "users", user.uid) : null),
    [firestore, user],
  );
  const { data: userData } = useDoc<User>(userDocRef);

  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Update your personal information and avatar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileSettings userData={userData} />
          </CardContent>
        </Card>

        <AddressSettings userData={userData} />

        <NotificationSettings userData={userData} />

        <PasswordSettings />
      </div>
    </>
  );
}
