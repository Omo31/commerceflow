"use client";
import Link from "next/link";
import { Loader2 } from "lucide-react";
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
import {
  initiateEmailSignIn,
  initiateGoogleSignIn,
} from "@/firebase/non-blocking-login";

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.16c1.56 0 2.95.54 4.04 1.58l3.15-3.15C17.45 1.99 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    <path d="M1 1h22v22H1z" fill="none"/>
  </svg>
);


export default function LoginPage() {
  const { register, handleSubmit } = useForm();
  const router = useRouter();
  const app = useFirebaseApp();
  const { user } = useAuthState();
  const [loading, setLoading] = React.useState<null | "email" | "google">(
    null
  );

  if (user) {
    router.push("/dashboard");
    return null;
  }

  const handleLogin = async (data: any) => {
    if (!app) return;
    setLoading("email");
    const auth = getAuth(app);

    initiateEmailSignIn(auth, data.email, data.password, {
      onSuccess: () => {
        router.push("/dashboard");
      },
      onFinally: () => {
        setLoading(null);
      },
    });
  };

  const handleGoogleSignIn = async () => {
    if (!app) return;
    setLoading("google");
    const auth = getAuth(app);

    initiateGoogleSignIn(auth, {
      onSuccess: () => {
        router.push("/dashboard");
      },
      onFinally: () => {
        setLoading(null);
      },
    });
  };
  
  const isLoading = loading !== null;

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
                disabled={isLoading}
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
                disabled={isLoading}
                {...register("password")}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {loading === 'email' ? <Loader2 className="h-5 w-5 animate-spin" /> : "Login"}
            </Button>
          </form>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              {loading === 'google' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <GoogleIcon className="mr-2 h-4 w-4" />
              )}
              Google
            </Button>
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
