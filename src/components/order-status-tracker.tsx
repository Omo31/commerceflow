"use client";

import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";
import {
  FileSignature,
  Hourglass,
  CircleDollarSign,
  PackageCheck,
  CheckCircle2,
  ShoppingCart,
} from "lucide-react";
import React from "react";

type Step = {
  name: string;
  statuses: OrderStatus[];
  icon: React.ElementType;
};

export const steps: Step[] = [
  {
    name: "Quote Requested",
    statuses: ["Pending Review", "Pricing"],
    icon: FileSignature,
  },
  {
    name: "Quote",
    statuses: ["Pending Acceptance", "Rejected", "Accepted", "Cancelled"],
    icon: Hourglass,
  },
  {
    name: "Processing",
    statuses: ["Processing", "In Cart"],
    icon: ShoppingCart,
  },
  {
    name: "Payment Due",
    statuses: ["Ready for Payment"],
    icon: CircleDollarSign,
  },
  { name: "Completed", statuses: ["Shipped", "Completed"], icon: PackageCheck },
];

const getStepIndex = (currentStatus: OrderStatus): number => {
  const index = steps.findIndex((step) =>
    step.statuses.includes(currentStatus),
  );
  if (currentStatus === "Rejected" || currentStatus === "Cancelled") {
    return index;
  }
  let activeIndex = -1;
  for (let i = 0; i < steps.length; i++) {
    if (steps[i].statuses.includes(currentStatus)) {
      activeIndex = i;
      break;
    }
  }
  return activeIndex;
};

export function OrderStatusTracker({
  currentStatus,
}: {
  currentStatus: OrderStatus;
}) {
  const currentStepIndex = getStepIndex(currentStatus);
  const isRejected =
    currentStatus === "Rejected" || currentStatus === "Cancelled";

  return (
    <div className="p-4 rounded-lg bg-card border">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = !isRejected && index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isActive = isCompleted || isCurrent;
          const Icon = step.icon;

          return (
            <React.Fragment key={step.name}>
              <div className="flex flex-col items-center text-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2",
                    isActive
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-muted border-border text-muted-foreground",
                    isCurrent && !isRejected && "animate-pulse",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <p
                  className={cn(
                    "mt-2 text-xs font-semibold",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {step.name}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-1 rounded-full",
                    isCompleted ? "bg-primary" : "bg-border",
                  )}
                ></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
