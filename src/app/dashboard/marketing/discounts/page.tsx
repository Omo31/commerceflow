import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DiscountsList } from "./_components/discounts-list";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DiscountsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-headline">Discounts</h1>
          <p className="text-muted-foreground">
            Manage your discount codes and promotions.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/marketing/discounts/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Discount
          </Link>
        </Button>
      </div>

      <Suspense fallback={<Skeleton className="w-full h-32" />}>
        <DiscountsList />
      </Suspense>
    </div>
  );
}
