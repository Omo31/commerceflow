import {
  LayoutDashboard,
  ShoppingBag,
  Settings,
  Users,
  Palette,
  ShoppingCart,
  Package,
  type LucideIcon,
  FileText,
  CreditCard,
  Bell,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: keyof typeof iconMap; // Use string key instead of component
  match?: string;
};

// Map string keys to actual icon components
export const iconMap = {
  LayoutDashboard,
  ShoppingBag,
  Settings,
  Users,
  Palette,
  ShoppingCart,
  Package,
  FileText,
  CreditCard,
  Bell,
};

export const userNavItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "LayoutDashboard",
    match: "/dashboard$",
  },
  {
    href: "/dashboard/shop",
    label: "Shop",
    icon: "Package",
  },
  {
    href: "/dashboard/orders",
    label: "My Orders",
    icon: "FileText",
    match: "^/dashboard/orders",
  },
  {
    href: "/dashboard/notifications",
    label: "Notifications",
    icon: "Bell",
  },
  {
    href: "/dashboard/cart",
    label: "Shopping Cart",
    icon: "ShoppingCart",
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: "Settings",
  },
];

export const adminNavItems: NavItem[] = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: "LayoutDashboard",
    match: "/admin/dashboard$",
  },
  {
    href: "/admin/orders",
    label: "Manage Orders",
    icon: "ShoppingBag",
    match: "/admin/orders",
  },
  {
    href: "/admin/products",
    label: "Products",
    icon: "Package",
  },
  {
    href: "/admin/landing-page",
    label: "Landing Page",
    icon: "FileText",
  },
  {
    href: "/admin/payments",
    label: "Payments",
    icon: "CreditCard",
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: "Users",
  },
  {
    href: "/admin/marketing",
    label: "Marketing",
    icon: "Palette",
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: "Settings",
  },
  {
    href: "/admin/documentation",
    label: "Documentation",
    icon: "FileText",
  },
];
