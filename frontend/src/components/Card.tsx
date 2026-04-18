import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export default function Card({ title, children, className = "" }: CardProps) {
  return (
    <div className={`bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm ${className}`}>
      {title && <h3 className="text-2xl font-semibold mb-3 text-zinc-900">{title}</h3>}
      {children}
    </div>
  );
}