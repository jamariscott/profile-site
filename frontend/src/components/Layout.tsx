import type { ReactNode } from "react";
import Nav from "./Nav";

type Props = {
  children: ReactNode;
};

export default function Layout({ children }: Props) {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <header className="flex items-center justify-between">
            <Nav />
          </header>

          <div className="mt-12 space-y-14">{children}</div>
        </div>
      </div>
    </main>
  );
}
