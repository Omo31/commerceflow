"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useFirestore } from "@/firebase";
import type { User, ShippingAddress } from "@/lib/types";
import { PlusCircle, Trash2, Pencil, Home, Loader2 } from "lucide-react";

interface AddressSettingsProps {
  userData: User | null;
}

export function AddressSettings({ userData }: AddressSettingsProps) {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ShippingAddress>();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<ShippingAddress | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<ShippingAddress | null>(null);

  const onAddressSubmit = async (data: ShippingAddress) => {
    if (!firestore || !user) return;
    setIsSaving(true);
    const userDocRef = doc(firestore, "users", user.uid);

    try {
      if (editingAddress) {
        // If we are editing, we need to remove the old one first
        const oldAddress = userData?.addresses?.find(
          (a) =>
            a.addressLine1 === editingAddress.addressLine1 &&
            a.city === editingAddress.city,
        ); // Simple check, might need a unique ID in a real app
        if (oldAddress) {
          await updateDoc(userDocRef, { addresses: arrayRemove(oldAddress) });
        }
      }
      await updateDoc(userDocRef, { addresses: arrayUnion(data) });
      toast({
        title: `Address ${editingAddress ? "updated" : "added"} successfully!`,
      });
      reset();
      setIsFormVisible(false);
      setEditingAddress(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error saving address",
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (address: ShippingAddress) => {
    setEditingAddress(address);
    reset(address);
    setIsFormVisible(true);
  };

  const handleDelete = async (addressToDelete: ShippingAddress) => {
    if (!firestore || !user) return;
    setIsDeleting(addressToDelete);
    const userDocRef = doc(firestore, "users", user.uid);

    try {
      await updateDoc(userDocRef, { addresses: arrayRemove(addressToDelete) });
      toast({ title: "Address deleted successfully." });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting address",
        description: error.message,
      });
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Address Book</CardTitle>
        <CardDescription>Manage your saved shipping addresses.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {userData?.addresses?.map((address, index) => (
            <div
              key={index}
              className="flex items-start justify-between p-4 border rounded-md"
            >
              <div className="space-y-1">
                <p className="font-semibold flex items-center">
                  <Home className="w-4 h-4 mr-2" /> Address {index + 1}
                </p>
                <p className="text-sm">{address.addressLine1}</p>
                {address.addressLine2 && (
                  <p className="text-sm">{address.addressLine2}</p>
                )}
                <p className="text-sm">
                  {address.city}, {address.state} {address.postalCode}
                </p>
                <p className="text-sm">{address.country}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(address)}
                  disabled={isSaving || !!isDeleting}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(address)}
                  disabled={isSaving || !!isDeleting}
                >
                  {isDeleting === address ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 text-destructive" />
                  )}
                </Button>
              </div>
            </div>
          ))}
          {!userData?.addresses?.length && (
            <p className="text-sm text-muted-foreground">
              You have no saved addresses.
            </p>
          )}
        </div>

        {isFormVisible ? (
          <form
            onSubmit={handleSubmit(onAddressSubmit)}
            className="space-y-4 p-4 border rounded-md"
          >
            <h3 className="font-semibold">
              {editingAddress ? "Edit Address" : "Add a New Address"}
            </h3>
            <div className="space-y-2">
              <Label htmlFor="addressLine1">Address Line 1</Label>
              <Input
                id="addressLine1"
                {...register("addressLine1", {
                  required: "This field is required",
                })}
              />
              {errors.addressLine1 && (
                <p className="text-sm text-destructive">
                  {errors.addressLine1.message as string}
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  {...register("city", { required: "This field is required" })}
                />
                {errors.city && (
                  <p className="text-sm text-destructive">
                    {errors.city.message as string}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  {...register("state", { required: "This field is required" })}
                />
                {errors.state && (
                  <p className="text-sm text-destructive">
                    {errors.state.message as string}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  {...register("postalCode", {
                    required: "This field is required",
                  })}
                />
                {errors.postalCode && (
                  <p className="text-sm text-destructive">
                    {errors.postalCode.message as string}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  {...register("country", {
                    required: "This field is required",
                  })}
                />
                {errors.country && (
                  <p className="text-sm text-destructive">
                    {errors.country.message as string}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isSaving || !!isDeleting}>
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {editingAddress ? "Update Address" : "Save Address"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsFormVisible(false);
                  setEditingAddress(null);
                  reset();
                }}
                disabled={isSaving || !!isDeleting}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button
            variant="outline"
            onClick={() => {
              setIsFormVisible(true);
              setEditingAddress(null);
              reset();
            }}
            disabled={isSaving || !!isDeleting}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Address
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
