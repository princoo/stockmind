import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-xl rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">StockMind</h1>

        {session?.user ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-zinc-700">
              Signed in as <span className="font-medium">{session.user.email}</span>
            </p>
            <p className="text-sm text-zinc-700">
              Role: <span className="font-medium">{session.user.role ?? "STAFF"}</span>
            </p>
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
              >
                Sign out
              </button>
            </form>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-zinc-700">You are not signed in.</p>
            <Link
              href="/login"
              className="inline-flex rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            >
             Go to login
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
