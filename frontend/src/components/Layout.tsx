import type { ReactNode } from "react";
import Nav from "./Nav";

type Props = {
  children: ReactNode;
};

export default function Layout({ children }: Props) {
  return (
    <main className="min-h-screen bg-bg text-text">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="rounded-card border border-line bg-surface p-8 shadow-card">
          <header className="flex items-center justify-between">
            <Nav />
          </header>

          <div className="mt-12 space-y-14">{children}</div>
        </div>
      </div>
    </main>
  );
}
