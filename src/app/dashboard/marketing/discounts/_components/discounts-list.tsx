"use client";

import {
  collection,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { useFirestore } from "@/firebase";
import { Discount } from "@/lib/types/discount";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function DiscountsList() {
  const firestore = useFirestore();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;

    const discountsCollection = collection(firestore, "discounts");
    const unsubscribe = onSnapshot(
      discountsCollection,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const newDiscounts = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Discount,
        );
        setDiscounts(newDiscounts);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [firestore]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (discounts.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">No Discounts Found</h2>
        <p className="text-muted-foreground mt-2">
          Create your first discount code to get started.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Code</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Value</TableHead>
          <TableHead>Used</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {discounts.map((discount) => (
          <TableRow key={discount.id}>
            <TableCell>{discount.code}</TableCell>
            <TableCell>{discount.description ?? "N/A"}</TableCell>
            <TableCell>
              <Badge variant={discount.isActive ? "default" : "destructive"}>
                {discount.isActive ? "Active" : "Inactive"}
              </Badge>
            </TableCell>
            <TableCell>{discount.type}</TableCell>
            <TableCell>
              {discount.type === "percentage"
                ? `${discount.value}%`
                : `$${discount.value}`}
            </TableCell>
            <TableCell>{`${discount.timesUsed} / ${discount.usageLimit ?? "∞"}`}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/dashboard/marketing/discounts/${discount.id}/edit`}
                    >
                      Edit
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
