"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { File, Loader2 } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collectionGroup, getDocs, query } from "firebase/firestore";
import { useState, useEffect } from "react";
import type { Payment, User } from "@/lib/types";

type EnrichedPayment = Payment & { userName?: string; userEmail?: string };

export default function AdminPaymentsPage() {
  const firestore = useFirestore();
  const [enrichedPayments, setEnrichedPayments] = useState<EnrichedPayment[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);

  const usersQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, "users")) : null),
    [firestore],
  );
  const { data: users } = useCollection<User>(usersQuery);

  useEffect(() => {
    if (!firestore || !users) return;

    const fetchAllPayments = async () => {
      setIsLoading(true);
      const paymentsQuery = query(collectionGroup(firestore, "payments"));
      const paymentsSnapshot = await getDocs(paymentsQuery);

      const allPayments = paymentsSnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as Payment[];

      const enrichedData = allPayments.map((payment) => {
        const user = users.find((u) => u.id === payment.userId);
        return {
          ...payment,
          userName: user
            ? `${user.firstName} ${user.lastName}`
            : "Unknown User",
          userEmail: user ? user.email : "N/A",
        };
      });

      setEnrichedPayments(enrichedData);
      setIsLoading(false);
    };

    fetchAllPayments();
  }, [firestore, users]);

  const handleExportCSV = () => {
    const headers = [
      "Transaction ID",
      "Order ID",
      "Customer Name",
      "Customer Email",
      "Status",
      "Amount",
      "Date",
    ];
    const rows = enrichedPayments.map((p) =>
      [
        p.id,
        p.orderId,
        p.userName,
        p.userEmail,
        p.status,
        p.amount.toFixed(2),
        p.paymentDate ? new Date(p.paymentDate).toISOString() : "N/A",
      ].join(","),
    );

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "payments.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <PageHeader title="Payment Transactions">
        <Button
          onClick={handleExportCSV}
          disabled={isLoading || enrichedPayments.length === 0}
        >
          <File className="mr-2 h-4 w-4" />
          Export to CSV
        </Button>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>All Payments</CardTitle>
          <CardDescription>
            A log of all payment transactions processed through the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="flex justify-center items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Loading payments...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : enrichedPayments.length > 0 ? (
                enrichedPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono">
                      {payment.id.substring(0, 10)}...
                    </TableCell>
                    <TableCell className="font-mono">
                      {payment.orderId.substring(0, 7).toUpperCase()}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{payment.userName}</div>
                      <div className="text-sm text-muted-foreground">
                        {payment.userEmail}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          payment.status === "Success"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      ₦{payment.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {payment.paymentDate
                        ? new Date(payment.paymentDate).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No payment transactions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
