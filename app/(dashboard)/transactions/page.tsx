import { TransactionsPageClient } from "@/components/transactions/transactions-page-client";
import { AccessDenied } from "@/components/auth/access-denied";
import { hasPagePermission } from "@/lib/auth/server-access";

export default async function TransactionsPage() {
  if (!(await hasPagePermission("VIEW_TRANSACTIONS"))) {
    return (
      <AccessDenied description="You do not have permission to view transactions." />
    );
  }
  return <TransactionsPageClient />;
}
