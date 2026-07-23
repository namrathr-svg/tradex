import { requireAdmin } from "@/lib/auth";
import { adminPasswordSet, isAdminUnlocked } from "@/lib/admin-gate";
import { AdminUnlock } from "@/components/admin/admin-unlock";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Must be an admin account first.
  await requireAdmin();

  // If an admin password is configured, require it once per browser session.
  if (adminPasswordSet() && !(await isAdminUnlocked())) {
    return <AdminUnlock />;
  }

  return <>{children}</>;
}
