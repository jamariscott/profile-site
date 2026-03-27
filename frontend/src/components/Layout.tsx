import type { ReactNode } from "react";
import Nav from "./Nav";

type Props = {
  children: ReactNode;
};

export default function Layout({ children }: Props) {
  return (
    <main className="min-h-screen bg-neutral-50 text-gray-900 dark:bg-neutral-950 dark:text-neutral-100">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="rounded-2xl border border-neutral-200 bg-white/80 p-8 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/60">
          <header className="flex items-center justify-between">
            <Nav />
          </header>

          <div className="mt-12 space-y-14">{children}</div>
        </div>
      </div>
    </main>
  );
}
