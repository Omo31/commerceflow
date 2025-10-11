"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { getAuth, updateProfile } from "firebase/auth";
import { doc, setDoc, getDocs, collection } from "firebase/firestore";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "@/components/logo";
import { Checkbox } from "@/components/ui/checkbox";
import { Apple, Shell, Loader2 } from "lucide-react";
import { useFirebaseApp, useFirestore } from "@/firebase";
import type { User as AppUser } from "@/lib/types";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { initiateEmailSignUp } from "@/firebase/non-blocking-login";

const avatarImages = PlaceHolderImages.filter((p) =>
  p.id.startsWith("avatar-"),
);

function SignupPageContent() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const router = useRouter();
  const app = useFirebaseApp();
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const campaignSource = searchParams.get("campaign");
  const [loading, setLoading] = React.useState(false);

  const capitalizeWords = (string: string) => {
    if (!string) return "";
    return string.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const handleSignup = async (data: any) => {
    if (!firestore || !app) return;
    setLoading(true);
    const auth = getAuth(app);

    initiateEmailSignUp(auth, data.email, data.password, {
      onSuccess: async (user) => {
        try {
          const randomAvatar =
            avatarImages[Math.floor(Math.random() * avatarImages.length)];

          const firstName = capitalizeWords(data.firstName);
          const lastName = capitalizeWords(data.lastName);
          const displayName = `${firstName} ${lastName}`;
          await updateProfile(user, {
            displayName: displayName,
            photoURL: randomAvatar.imageUrl,
          });

          const newUser: Omit<AppUser, "id" | "role"> = {
            firstName: firstName,
            lastName: lastName,
            email: user.email!,
            phoneNumber: data.phoneNumber || "",
            avatar: randomAvatar.imageUrl,
            createdAt: new Date().toISOString(),
            ...(campaignSource && { campaignSource }),
            status: "disabled",
          };

          await setDoc(doc(firestore, "users", user.uid), newUser);

          router.push("/dashboard");
        } catch (error) {
          // Errors in this block will be caught by the global error handler
        }
      },
      onFinally: () => {
        setLoading(false);
      },
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary">
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader className="text-center">
          <Link href="/" className="inline-block mx-auto mb-4">
            <Logo />
          </Link>
          <CardTitle className="text-2xl font-headline">
            Create an Account
          </CardTitle>
          <CardDescription>
            Enter your information to create a new account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleSignup)} className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  required
                  {...register("firstName")}
                  className="capitalize"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  required
                  {...register("lastName")}
                  className="capitalize"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                {...register("email")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+1 234 567 890"
                {...register("phoneNumber")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...register("password", { minLength: 6 })}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  Password must be at least 6 characters.
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <Checkbox id="terms" required />
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Accept terms and conditions
              </label>
            </div>

            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Create account"
              )}
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" type="button">
                <Shell className="mr-2 h-4 w-4" />
                Google
              </Button>
              <Button variant="outline" type="button">
                <Apple className="mr-2 h-4 w-4" />
                Apple
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Login
            </Link>
            {" | "}
            <Link href="/" className="underline">
              Go Back
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignupPage() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <SignupPageContent />
    </React.Suspense>
  );
}
