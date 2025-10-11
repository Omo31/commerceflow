import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function MarketingPage() {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Marketing & Promotions</CardTitle>
          <CardDescription>
            Manage your discounts, promotions, and marketing campaigns.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Discounts</CardTitle>
            <CardDescription>
              Create and manage coupon codes for your customers.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/dashboard/marketing/discounts">
              Manage Discounts <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
      </Card>
    </div>
  );
}
