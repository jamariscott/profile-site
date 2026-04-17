import type { ReactNode } from "react";

type CardProps = {
  title: string;
  children: ReactNode;
  meta?: string;
};

export default function Card({ title, children, meta }: CardProps) {
  return (
    <div
      className="rounded-lg border border-gray-200 p-5 bg-gray-50 transition hover:border-gray-300
                 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
    >
      <h4 className="font-medium">
        {title}
      </h4>

      <div className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-neutral-400">
        {children}
      </div>

      {meta && (
        <div className="mt-3 text-xs uppercase tracking-wide text-gray-400 dark:text-neutral-500">
          {meta}
        </div>
      )}
    </div>
  );
}
