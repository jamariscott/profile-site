import type { ReactNode } from "react";
import { Check } from "lucide-react";
import type { ProfileStyle } from "./ProfileFrame";
import { inputClass } from "./AuthFields";

// Curated accents: each works as a button fill in light and dark (ProfileFrame
// picks white or ink text for whichever reads better on it).
const ACCENTS = [
  { hex: "#ff8a3d", name: "Tangerine" },
  { hex: "#e5484d", name: "Red" },
  { hex: "#ec4899", name: "Magenta" },
  { hex: "#8b5cf6", name: "Violet" },
  { hex: "#3b82f6", name: "Blue" },
  { hex: "#14b8a6", name: "Teal" },
  { hex: "#22c55e", name: "Green" },
  { hex: "#eab308", name: "Gold" },
];

const FONTS: { id: NonNullable<ProfileStyle["font"]>; name: string; family: string }[] = [
  { id: "sans", name: "Clean", family: 'Inter, system-ui, sans-serif' },
  { id: "serif", name: "Editorial", family: 'Georgia, "Times New Roman", serif' },
  { id: "grotesk", name: "Poster", family: '"Archivo Variable", Archivo, sans-serif' },
  { id: "mono", name: "Technical", family: 'ui-monospace, Menlo, Consolas, monospace' },
];

function Group({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="border-t border-line pt-6 first:border-t-0 first:pt-0">
      <legend className="font-heading text-lg font-bold">{title}</legend>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      <div className="mt-4">{children}</div>
    </fieldset>
  );
}

/** A selectable picture card. `aria-pressed` tells screen readers which one is on. */
function Choice({ active, onClick, label, children }: { active: boolean; onClick: () => void; label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className={`group relative flex flex-col items-stretch gap-2 rounded-card border-2 p-2 text-left transition-colors ${
        active ? "border-text" : "border-line hover:border-line-strong"
      }`}
    >
      <span className="block overflow-hidden rounded-[0.5rem] bg-surface-2">{children}</span>
      <span className="flex items-center justify-between px-1 text-sm font-semibold">
        {label}
        {active && <Check size={16} aria-hidden />}
      </span>
    </button>
  );
}

/** Tiny wireframes of each header style. */
function HeaderSketch({ kind }: { kind: "classic" | "bigname" | "cover" }) {
  const ink = "rgb(var(--c-line-strong))";
  return (
    <svg viewBox="0 0 120 72" className="h-auto w-full" aria-hidden>
      {kind === "cover" && <rect x="8" y="6" width="104" height="26" rx="4" fill={ink} opacity=".6" />}
      {kind === "bigname" ? (
        <>
          <circle cx="16" cy="14" r="6" fill={ink} />
          <rect x="8" y="26" width="104" height="18" rx="3" fill={ink} />
          <rect x="8" y="50" width="60" height="5" rx="2.5" fill={ink} opacity=".7" />
        </>
      ) : (
        <>
          <circle cx={kind === "cover" ? 22 : 18} cy={kind === "cover" ? 34 : 18} r={kind === "cover" ? 10 : 9} fill={ink} stroke="rgb(var(--c-surface-2))" strokeWidth="2" />
          <rect x="8" y={kind === "cover" ? 50 : 34} width="56" height="8" rx="3" fill={ink} />
          <rect x="8" y={kind === "cover" ? 62 : 46} width="40" height="5" rx="2.5" fill={ink} opacity=".7" />
        </>
      )}
    </svg>
  );
}

export default function AppearanceEditor({
  style,
  onChange,
}: {
  style: ProfileStyle;
  onChange: (next: ProfileStyle) => void;
}) {
  const set = <K extends keyof ProfileStyle>(key: K, value: ProfileStyle[K] | undefined) => {
    const next = { ...style };
    if (value === undefined || value === "") delete next[key];
    else next[key] = value;
    onChange(next);
  };
  const header = style.header ?? "classic";

  return (
    <div className="space-y-8">
      <Group title="Header" hint="How your name and photo open the page.">
        <div className="grid grid-cols-3 gap-3">
          {(["classic", "bigname", "cover"] as const).map((k) => (
            <Choice key={k} active={header === k} onClick={() => set("header", k === "classic" ? undefined : k)} label={{ classic: "Classic", bigname: "Big name", cover: "Cover image" }[k]}>
              <HeaderSketch kind={k} />
            </Choice>
          ))}
        </div>
        {header === "cover" && (
          <div className="mt-4">
            <label htmlFor="cover-url" className="mb-1.5 block text-sm font-semibold">
              Cover image link
            </label>
            <input
              id="cover-url"
              type="url"
              inputMode="url"
              placeholder="https://…"
              value={style.cover_url ?? ""}
              onChange={(e) => set("cover_url", e.target.value.trim() || undefined)}
              className={inputClass}
            />
            <p className="mt-1.5 text-sm text-muted">Paste a link to a wide image (about 3 times wider than tall). Without one, the cover uses your accent color.</p>
          </div>
        )}
      </Group>

      <Group title="Accent color" hint="Used for buttons, your status dot and highlights.">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => set("accent", undefined)}
            aria-pressed={!style.accent}
            className={`h-11 rounded-full border-2 px-4 text-sm font-semibold ${!style.accent ? "border-text" : "border-line hover:border-line-strong"}`}
          >
            Theme color
          </button>
          {ACCENTS.map((a) => {
            const active = style.accent === a.hex;
            return (
              <button
                key={a.hex}
                type="button"
                onClick={() => set("accent", a.hex)}
                aria-pressed={active}
                aria-label={a.name}
                title={a.name}
                className={`flex h-11 w-11 items-center justify-center rounded-full ring-offset-2 ring-offset-bg ${active ? "ring-2 ring-text" : ""}`}
                style={{ background: a.hex }}
              >
                {active && <Check size={18} aria-hidden className="text-white drop-shadow" />}
              </button>
            );
          })}
        </div>
      </Group>

      <Group title="Light or dark">
        <div className="grid grid-cols-3 gap-3">
          {([
            [undefined, "Theme default", "linear-gradient(90deg, rgb(var(--c-surface)) 50%, rgb(var(--c-text)) 50%)"],
            ["light", "Light", "#fafaf8"],
            ["dark", "Dark", "#16161a"],
          ] as const).map(([mode, label, bg]) => (
            <Choice key={label} active={style.mode === mode} onClick={() => set("mode", mode)} label={label}>
              <span className="block h-14 border border-line" style={{ background: bg }} />
            </Choice>
          ))}
        </div>
      </Group>

      <Group title="Heading font">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {FONTS.map((f) => (
            <Choice key={f.id} active={(style.font ?? undefined) === f.id} onClick={() => set("font", style.font === f.id ? undefined : f.id)} label={f.name}>
              <span className="block py-3 text-center text-3xl font-bold text-text" style={{ fontFamily: f.family }}>
                Aa
              </span>
            </Choice>
          ))}
        </div>
        <p className="mt-2 text-sm text-muted">Pick one again to go back to your theme's font.</p>
      </Group>

      <Group title="Button shape">
        <div className="grid grid-cols-3 gap-3">
          {([
            ["rounded", "Rounded", "0.625rem"],
            ["pill", "Pill", "9999px"],
            ["square", "Square", "0.125rem"],
          ] as const).map(([id, label, radius]) => (
            <Choice key={id} active={style.buttons === id} onClick={() => set("buttons", style.buttons === id ? undefined : id)} label={label}>
              <span className="flex h-14 items-center justify-center">
                <span className="bg-accent px-4 py-1.5 text-xs font-semibold text-accent-contrast" style={{ borderRadius: radius }}>
                  Tickets
                </span>
              </span>
            </Choice>
          ))}
        </div>
      </Group>
    </div>
  );
}
