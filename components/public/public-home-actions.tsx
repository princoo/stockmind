import Link from "next/link";

type PublicHomeActionsProps = Readonly<{
  isAuthenticated: boolean;
  variant?: "hero" | "footer";
}>;

export function PublicHomeActions({
  isAuthenticated,
  variant = "hero",
}: PublicHomeActionsProps) {
  if (variant === "footer") {
    return (
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        {isAuthenticated ? (
          <Link href="/dashboard" className="ui-btn-primary">
            Go to dashboard
          </Link>
        ) : (
          <Link href="/login" className="ui-btn-primary">
            Sign in
          </Link>
        )}
        <Link
          href="/contact"
          className="inline-flex items-center justify-center rounded-xl border border-white/25 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/10"
        >
          Contact sales
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
      {isAuthenticated ? (
        <>
          <Link href="/dashboard" className="ui-btn-primary">
            Go to dashboard
          </Link>
          <Link href="/stockpilot" className="ui-btn-secondary">
            Open StockPilot
          </Link>
        </>
      ) : (
        <>
          <Link href="/login" className="ui-btn-primary">
            Sign in
          </Link>
          <Link href="/contact" className="ui-btn-secondary">
            Book demo
          </Link>
        </>
      )}
    </div>
  );
}
