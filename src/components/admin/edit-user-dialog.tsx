"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFirestore } from "@/firebase";
import { doc, getDoc, writeBatch } from "firebase/firestore";
import type { User } from "@/lib/types";
import { Label } from "../ui/label";
import { Skeleton } from "../ui/skeleton";

interface EditUserDialogProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdate: () => void;
}

// Define the resources that can have permissions assigned to them
const resources = ["users", "products", "orders", "marketing"];
type PermissionValue = "none" | "read" | "write";
type Permissions = Record<string, PermissionValue>;

export function EditUserDialog({
  user,
  isOpen,
  onClose,
  onUserUpdate,
}: EditUserDialogProps) {
  const [permissions, setPermissions] = useState<Permissions>({});
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore || !isOpen) return;

    const fetchPermissions = async () => {
      setLoading(true);
      const roleDocRef = doc(firestore, "roles_admin", user.id);
      const roleDoc = await getDoc(roleDocRef);

      if (roleDoc.exists()) {
        setPermissions(roleDoc.data() as Permissions);
      } else {
        // If no role document, set all to none
        const defaultPermissions = resources.reduce((acc, resource) => {
          acc[resource] = "none";
          return acc;
        }, {} as Permissions);
        setPermissions(defaultPermissions);
      }
      setLoading(false);
    };

    fetchPermissions();
  }, [firestore, user, isOpen]);

  const handlePermissionChange = (resource: string, value: PermissionValue) => {
    setPermissions((prev) => ({ ...prev, [resource]: value }));
  };

  const handleSaveChanges = async () => {
    if (!firestore) return;

    try {
      const batch = writeBatch(firestore);
      const userDocRef = doc(firestore, "users", user.id);
      const roleDocRef = doc(firestore, "roles_admin", user.id);

      // Determine if there are any meaningful permissions
      const hasPermissions = Object.values(permissions).some(
        (p) => p !== "none",
      );
      const mainRole = permissions.users === "write" ? "admin" : "user";

      // Update the base role on the user object for simple UI display
      batch.update(userDocRef, { role: mainRole });

      if (hasPermissions) {
        // Set/update the document in roles_admin with the granular permissions
        batch.set(roleDocRef, permissions, { merge: true });
      } else {
        // If no permissions, delete the role document
        const roleDoc = await getDoc(roleDocRef); // Check if it exists before deleting
        if (roleDoc.exists()) {
          batch.delete(roleDocRef);
        }
      }

      await batch.commit();
      onUserUpdate(); // This will trigger a re-fetch in the parent component
      onClose();
    } catch (error) {
      console.error("Error updating user permissions:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Permissions</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p className="text-sm text-muted-foreground">
            Editing permissions for{" "}
            <span className="font-medium text-primary">
              {user.firstName} {user.lastName}
            </span>
          </p>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            resources.map((resource) => (
              <div
                key={resource}
                className="grid grid-cols-4 items-center gap-4"
              >
                <Label htmlFor={resource} className="text-right capitalize">
                  {resource}
                </Label>
                <Select
                  id={resource}
                  value={permissions[resource] || "none"}
                  onValueChange={(value) =>
                    handlePermissionChange(resource, value as PermissionValue)
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select permission" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="write">Write</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSaveChanges} disabled={loading}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
