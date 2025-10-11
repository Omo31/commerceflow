"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useFirestore, useUser, useStorage } from "@/firebase";
import type { User } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";

interface ProfileSettingsProps {
  userData: User | null;
}

export function ProfileSettings({ userData }: ProfileSettingsProps) {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm();
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(userData?.avatar || "");

  useEffect(() => {
    if (userData) {
      setValue("firstName", userData.firstName);
      setValue("lastName", userData.lastName);
      setValue("phoneNumber", userData.phoneNumber);
      setAvatarUrl(userData.avatar || "");
    }
  }, [userData, setValue]);

  const capitalizeFirstLetter = (string: string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!event.target.files || !user || !auth || !storage) return;
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const storageRef = ref(storage, `avatars/${user.uid}/${file.name}`);

    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setAvatarUrl(downloadURL);

      const userDocRef = doc(firestore, "users", user.uid);
      await updateDoc(userDocRef, { avatar: downloadURL });

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: downloadURL });
      }

      toast({ title: "Avatar updated successfully!" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error uploading avatar",
        description: error.message,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onProfileSubmit = async (data: any) => {
    if (!firestore || !user || !auth) return;
    const userDocRef = doc(firestore, "users", user.uid);

    const firstName = capitalizeFirstLetter(data.firstName);
    const lastName = capitalizeFirstLetter(data.lastName);

    try {
      const updatedData = {
        firstName: firstName,
        lastName: lastName,
        phoneNumber: data.phoneNumber,
      };
      await updateDoc(userDocRef, updatedData);

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: `${firstName} ${lastName}`,
        });
      }

      toast({ title: "Profile updated successfully!" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating profile",
        description: error.message,
      });
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onProfileSubmit)}>
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={avatarUrl} alt={userData?.firstName} />
          <AvatarFallback>
            {userData?.firstName?.[0]}
            {userData?.lastName?.[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-2">
          <Input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
            disabled={isUploading || isSubmitting}
          />
          <Label htmlFor="avatar-upload" className="cursor-pointer">
            <Button asChild disabled={isUploading || isSubmitting}>
              <span>
                {isUploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}{" "}
                Change Avatar
              </span>
            </Button>
          </Label>
          <p className="text-xs text-muted-foreground">
            JPG, GIF or PNG. 1MB max.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            {...register("firstName", { required: "First name is required" })}
          />
          {errors.firstName && (
            <p className="text-sm text-destructive">
              {errors.firstName.message as string}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            {...register("lastName", { required: "Last name is required" })}
          />
          {errors.lastName && (
            <p className="text-sm text-destructive">
              {errors.lastName.message as string}
            </p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={userData?.email || ""} disabled />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phoneNumber">Phone Number</Label>
        <Input id="phoneNumber" type="tel" {...register("phoneNumber")} />
      </div>
      <Button type="submit" disabled={isUploading || isSubmitting}>
        {isSubmitting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        Save Changes
      </Button>
    </form>
  );
}
