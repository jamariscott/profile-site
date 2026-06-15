import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export default function Card({ title, children, className = "" }: CardProps) {
  return (
    <div className={`bg-surface border border-line rounded-card p-6 shadow-card ${className}`}>
      {title && <h3 className="text-2xl font-semibold mb-3 text-text">{title}</h3>}
      {children}
    </div>
  );
}