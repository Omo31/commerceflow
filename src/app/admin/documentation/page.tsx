"use client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DocumentationPage() {
  return (
    <>
      <PageHeader title="Documentation" />
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">Dashboard</h3>
                <p className="text-muted-foreground">
                  The main dashboard provides an at-a-glance overview of key
                  metrics, including total revenue, new users, and recent
                  orders. It&apos;s the first thing you&apos;ll see when you log
                  in to the admin panel. The dashboard also displays a monthly
                  revenue overview and a list of recent orders.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Users</h3>
                <p className="text-muted-foreground">
                  The users tab allows you to manage all registered users. You
                  can search for users, filter them by status (active/disabled),
                  and perform bulk actions such as enabling, disabling, or
                  deleting users. You can also export a list of users to a CSV
                  file. Individual user details can be viewed and edited by
                  clicking on a user.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Products</h3>
                <p className="text-muted-foreground">
                  In the products tab, you can add, edit, and delete products
                  from your store. You can also manage product categories,
                  inventory, and variants. The products page also features an
                  AI-powered tool to generate product details based on keywords.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Orders</h3>
                <p className="text-muted-foreground">
                  The orders tab is where you manage all customer orders. You
                  can view order details, update order statuses, and process
                  refunds. You can also filter orders by status and search for
                  specific orders. Bulk status updates are also possible.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Marketing</h3>
                <p className="text-muted-foreground">
                  The marketing tab contains tools to help you promote your
                  store. You can generate marketing flyers and create and manage
                  discount codes.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Payments</h3>
                <p className="text-muted-foreground">
                  The payments tab allows you to view all transactions and
                  manage your payment settings. You can view a log of all
                  payment transactions and export the data to a CSV file.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Landing Page</h3>
                <p className="text-muted-foreground">
                  This section allows you to customize the content of your
                  store&apos;s landing page. You can edit the hero section,
                  featured products, services, and footer.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Settings</h3>
                <p className="text-muted-foreground">
                  The settings tab is where you can configure various options
                  for your store, such as accepted units of measure for custom
                  orders.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
