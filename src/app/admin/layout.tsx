export const dynamic = "force-dynamic";

import { AppShell } from "@/components/app-shell";
import { adminNavItems } from "@/lib/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-secondary min-h-screen">
      <AppShell navItems={adminNavItems}>{children}</AppShell>
    </div>
  );
}
