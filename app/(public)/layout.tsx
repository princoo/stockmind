import type { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { PublicShell } from "@/components/public/public-shell";
import { authOptions } from "@/lib/auth/options";

type PublicLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default async function PublicLayout({ children }: PublicLayoutProps) {
  const session = await getServerSession(authOptions);

  return (
    <PublicShell
      user={
        session?.user
          ? {
              name: session.user.name ?? "Unknown user",
              email: session.user.email ?? "no-email",
              role: session.user.role ?? "STAFF",
            }
          : null
      }
    >
      {children}
    </PublicShell>
  );
}
