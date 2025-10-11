import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { OrderStatus } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getStatusStyles = (status: OrderStatus) => {
  switch (status) {
    case "Pending Review":
    case "Pricing":
    case "Pending Acceptance":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300";
    case "In Cart":
    case "Processing":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300";
    case "Shipped":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300";
    case "Completed":
      return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300";
    case "Rejected":
    case "Cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  }
};
