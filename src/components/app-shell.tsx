"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { getAuth, signOut } from "firebase/auth";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Logo from "@/components/logo";
import type { NavItem } from "@/lib/navigation";
import { iconMap } from "@/lib/navigation";
import {
  Home,
  LogOut,
  ShoppingCart,
  Loader2,
  MessageSquare,
  X,
} from "lucide-react";
import { useFirebaseApp, useAuthState } from "@/firebase";
import { NotificationBell } from "./notification-bell";
import { useFirebaseError } from "@/firebase/use-firebase-error";
import { SupportChat } from "./SupportChat";

type AppShellProps = {
  navItems: NavItem[];
  children: React.ReactNode;
};

export function AppShell({ navItems, children }: AppShellProps) {
  useFirebaseError();

  const pathname = usePathname();
  const { user, loading } = useAuthState();
  console.log("user", user);
  console.log("loading", loading);
  const app = useFirebaseApp();
  const router = useRouter();
  const [isChatOpen, setIsChatOpen] = React.useState(false);

  const handleLogout = async () => {
    if (!app) return;
    const auth = getAuth(app);
    await signOut(auth);
    router.push("/login");
  };

  const getInitials = (displayName: string | null | undefined) => {
    if (!displayName) return "";
    const names = displayName.split(" ");
    if (names.length === 0) return "";
    if (names.length === 1) return names[0][0].toUpperCase();
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  };

  // Render a loading state while auth is being checked
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Logo />
            <span className="text-lg font-semibold font-headline">
              CommerceFlow
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => {
              const isActive = item.match
                ? new RegExp(item.match).test(pathname)
                : pathname.startsWith(item.href);
              const Icon = iconMap[item.icon];
              return (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                    >
                      <div>
                        <Icon />
                        <span>{item.label}</span>
                      </div>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/">
                <SidebarMenuButton asChild tooltip="Back to Home">
                  <div>
                    <Home />
                    <span>Home</span>
                  </div>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <SidebarTrigger className="sm:hidden" />
          <div />
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <NotificationBell />
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/dashboard/cart">
                    <ShoppingCart className="h-5 w-5" />
                    <span className="sr-only">Shopping Cart</span>
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="overflow-hidden rounded-full"
                    >
                      <Avatar>
                        <AvatarImage
                          src={user?.photoURL ?? undefined}
                          alt={user?.displayName ?? ""}
                        />
                        <AvatarFallback>
                          {getInitials(user?.displayName) ??
                            user?.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={"/dashboard/settings"}>Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button asChild>
                <Link href="/login">Login</Link>
              </Button>
            )}
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            size="icon"
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="rounded-full shadow-lg"
          >
            {isChatOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <MessageSquare className="h-6 w-6" />
            )}
          </Button>
        </div>
        {isChatOpen && (
          <div className="fixed bottom-20 right-4 z-50 w-80">
            <SupportChat onClose={() => setIsChatOpen(false)} />
          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
