import { ReactNode } from "react";

type SectionProps = {
  title?: string;
  eyebrow?: string;
  children: ReactNode;
};

export default function Section({ title, eyebrow, children }: SectionProps) {
  return (
    <section>
      {eyebrow && (
        <h2 className="text-sm font-medium tracking-widest uppercase text-gray-500 dark:text-neutral-500">
          {eyebrow}
        </h2>
      )}

      {title && (
        <h3 className="mt-2 text-lg font-medium">
          {title}
        </h3>
      )}

      <div className="mt-6">
        {children}
      </div>
    </section>
  );
}
