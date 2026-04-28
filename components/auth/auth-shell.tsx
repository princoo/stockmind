import type { ReactNode } from "react";

type AuthShellProps = Readonly<{
  title: string;
  children: ReactNode;
  footer: ReactNode;
}>;

export function AuthShell({ title, children, footer }: AuthShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-transparent px-4 py-10">
      <div className="w-full max-w-[400px]">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#0058be] shadow-[0_8px_20px_rgba(0,88,190,0.25)]">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-5 w-5 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 8h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" />
              <path d="M9 8V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              <path d="M9 12h6" />
            </svg>
          </div>
          <h1 className="text-[36px] font-semibold leading-tight text-[#151c27]">
            StockMind
          </h1>
          <p className="mt-1 text-sm text-[#575e70]">Enterprise Inventory</p>
        </div>

        <section className="ui-glass px-6 py-8">
          <h2 className="mb-6 text-[30px] font-semibold leading-[1.2] text-[#151c27]">
            {title}
          </h2>
          {children}
        </section>

        <div className="mt-6 text-center text-[13px] leading-[18px] text-[#575e70]">
          {footer}
        </div>
      </div>
    </main>
  );
}
