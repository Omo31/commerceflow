"use client";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { getAuth } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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
import { useFirebaseApp } from "@/firebase";
import { useAuthState } from "@/firebase/auth/use-auth-state";
import { initiateEmailSignIn } from "@/firebase/non-blocking-login";

export default function LoginPage() {
  const { register, handleSubmit } = useForm();
  const router = useRouter();
  const app = useFirebaseApp();
  const { user } = useAuthState();
  const [loading, setLoading] = React.useState(false);

  if (user) {
    router.push("/dashboard");
    return null;
  }

  const handleLogin = async (data: any) => {
    if (!app) return;
    setLoading(true);
    const auth = getAuth(app);

    initiateEmailSignIn(auth, data.email, data.password, {
      onSuccess: () => {
        router.push("/dashboard");
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
          <CardTitle className="text-2xl font-headline">Welcome Back</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleLogin)} className="grid gap-4">
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
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="ml-auto inline-block text-sm underline"
                >
                  Forgot your password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                {...register("password")}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Login"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="underline">
              Sign up
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
