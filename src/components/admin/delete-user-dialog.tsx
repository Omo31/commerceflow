"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { User } from "@/lib/types";
import { useFunctions } from "@/firebase";
import { httpsCallable } from "firebase/functions";
import { toast } from "sonner";

interface DeleteUserDialogProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdate: () => void; // Changed from onUserDelete
}

export function DeleteUserDialog({
  user,
  isOpen,
  onClose,
  onUserUpdate,
}: DeleteUserDialogProps) {
  const functions = useFunctions();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!functions || !user) return;

    setIsDeleting(true);
    const deleteUserFunction = httpsCallable(functions, "deleteUser");

    try {
      const result = await deleteUserFunction({ uid: user.id });
      console.log("Delete user result:", result.data);
      toast.success("User successfully deleted.");
      onUserUpdate(); // Refresh the user list
      onClose();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      // Use toast to show error notification
      toast.error(error.message || "An unknown error occurred.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm User Deletion</DialogTitle>
          <DialogDescription>
            Are you sure you want to permanently delete{" "}
            <span className="font-bold">
              {user.firstName} {user.lastName}
            </span>
            ? This will remove their authentication, all associated data, and
            cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
