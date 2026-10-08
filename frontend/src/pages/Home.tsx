import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";
import { API_BASE } from "../lib/config";
import { useAuth } from "../lib/auth";
import { THEMES } from "../lib/themes";
import { formatDate } from "../lib/format";
import * as m from "motion/react-m";
import { spring } from "../lib/motion";

interface Member {
  username: string;
  display_name: string;
  theme: string | null;
}

interface WritingPost {
  slug: string;
  title: string;
  date: string;
  summary: string;
}

const PROFESSION_LABEL: Record<string, string> = Object.fromEntries(THEMES.map((t) => [t.id, t.label]));

// What each profession's page actually includes (mirrors PROFESSION_PRESETS in Account.tsx).
const PROFESSIONS = [
  { id: "music", name: "Musicians", gets: "Tracks, releases and upcoming shows, with players that work right on the page." },
  { id: "photographer", name: "Photographers", gets: "A full-screen gallery that puts your images first." },
  { id: "developer", name: "Engineers", gets: "Projects with status, and links to your code and products." },
  { id: "creator", name: "Creators", gets: "Your videos from YouTube and other platforms, in one place." },
  { id: "writer", name: "Writers", gets: "Posts you write right on your page, set for reading." },
];

// Lineup-poster rows: headliner first, then alternating widths and weights.
const ROW_STYLES = [
  "text-[clamp(2.4rem,5vw,4rem)] font-black [font-stretch:62%] leading-[0.9]",
  "text-[clamp(1.25rem,2.4vw,1.9rem)] font-bold [font-stretch:118%] leading-none tracking-tight",
  "text-[clamp(1.9rem,3.8vw,3rem)] font-extrabold [font-stretch:68%] leading-[0.92]",
  "text-[clamp(1.15rem,2.1vw,1.65rem)] font-semibold [font-stretch:108%] leading-tight",
];

const USERNAME_ALLOWED = /[^a-z0-9_.-]/g;

type Availability = "idle" | "short" | "checking" | "available" | "taken" | "error";

function useAvailability(username: string): Availability {
  const [state, setState] = useState<Availability>("idle");
  useEffect(() => {
    if (!username) return setState("idle");
    if (username.length < 3) return setState("short");
    setState("checking");
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`${API_BASE}/api/profiles/${encodeURIComponent(username)}`, { signal: ctrl.signal })
        .then((res) => setState(res.status === 404 ? "available" : res.ok || res.status === 403 ? "taken" : "error"))
        .catch((e) => {
          if (e.name !== "AbortError") setState("error");
        });
    }, 350);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [username]);
  return state;
}

const AVAILABILITY_TEXT: Record<Availability, string> = {
  idle: "Free to join. Your page is public by default, and you can make it private any time.",
  short: "Usernames need at least 3 characters.",
  checking: "Checking…",
  available: "That name is free. It's yours if you claim it now.",
  taken: "That name is taken. Try another, or add a word to it.",
  error: "Couldn't check that name right now. You can still continue.",
};

function ClaimForm({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const hintId = useId();
  const status = useAvailability(value);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (value.length < 3 || status === "taken") {
      inputRef.current?.focus();
      return;
    }
    navigate(`/register?username=${encodeURIComponent(value)}`);
  };

  const tone =
    status === "available" ? "text-success" : status === "taken" || status === "short" ? "text-danger" : "text-muted";

  return (
    <form onSubmit={submit} className="mt-8 max-w-xl">
      <label htmlFor="claim-username" className="text-sm font-semibold text-text">
        Pick your page's address
      </label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <div className="flex min-w-0 flex-1 items-center rounded-btn border-2 border-text bg-surface focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-text">
          <span className="select-none whitespace-nowrap pl-3 text-sm text-muted sm:pl-4 sm:text-base">timezoftoday.com/u/</span>
          <input
            ref={inputRef}
            id="claim-username"
            name="username"
            value={value}
            onChange={(e) => onChange(e.target.value.toLowerCase().replace(USERNAME_ALLOWED, "").slice(0, 30))}
            placeholder="yourname"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            aria-describedby={hintId}
            aria-invalid={status === "taken" || status === "short"}
            className="min-w-0 flex-1 bg-transparent py-3 pr-3 font-semibold text-text placeholder:font-normal placeholder:text-subtle focus:outline-none focus-visible:outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-btn bg-accent px-6 py-3.5 font-semibold text-accent-contrast transition-colors hover:bg-accent-hover"
        >
          Claim your page
        </button>
      </div>
      <p id={hintId} aria-live="polite" className={`mt-2 text-sm ${tone}`}>
        {AVAILABILITY_TEXT[status]}
      </p>
    </form>
  );
}

function LineupPoster({ members, yourName }: { members: Member[] | null; yourName: string }) {
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  // Five names keeps "your name here" above the fold. Skip anything that looks
  // like an email (some display names fall back to one), and put people who
  // picked a profession first.
  const shown = (members ?? [])
    .filter((m) => !m.display_name.includes("@"))
    .sort((a, b) => Number(!!b.theme) - Number(!!a.theme))
    .slice(0, 5);

  return (
    <figure
      aria-label="Newest pages on Timez of Today"
      className="on-ink relative overflow-hidden rounded-card bg-text p-6 text-bg sm:p-8"
    >
      <div className="flex items-baseline justify-between gap-4 border-b border-bg/25 pb-3 text-sm font-semibold">
        <span>Newest pages</span>
        <span className="text-bg/75">{today}</span>
      </div>

      <ol className="mt-5 space-y-2 [overflow-wrap:anywhere]">
        {members === null &&
          [0, 1, 2, 3].map((i) => (
            <li key={i} aria-hidden className="h-10 animate-pulse rounded bg-bg/15" style={{ width: `${85 - i * 15}%` }} />
          ))}

        {members !== null && shown.length === 0 &&
          PROFESSIONS.map((p, i) => (
            <li key={p.id} className={`font-heading ${ROW_STYLES[i % ROW_STYLES.length]}`}>
              {p.name}
            </li>
          ))}

        {shown.map((m, i) => (
          <li key={m.username} className="flex flex-wrap items-baseline gap-x-3">
            <Link
              to={`/u/${m.username}`}
              className={`font-heading decoration-highlight decoration-4 underline-offset-4 hover:underline ${ROW_STYLES[i % ROW_STYLES.length]}`}
            >
              {m.display_name}
            </Link>
            {m.theme && PROFESSION_LABEL[m.theme] && (
              <span className="text-sm font-medium text-bg/70">{PROFESSION_LABEL[m.theme]}</span>
            )}
          </li>
        ))}

        <li className="pt-2">
          {/* Your name joins the lineup: when you start typing, it springs in
              (the key changes once, so later keystrokes don't re-animate). */}
          <span
            className={`inline-block max-w-full overflow-hidden rounded-[0.35rem] bg-highlight px-3 py-1 align-bottom font-heading text-on-highlight ${ROW_STYLES[2]}`}
          >
            <m.span
              key={yourName ? "named" : "placeholder"}
              className="inline-block"
              initial={yourName ? { y: 18, opacity: 0, scale: 0.92 } : false}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={spring}
            >
              {yourName || "Your name here"}
            </m.span>
          </span>
        </li>
      </ol>

      <figcaption className="mt-6 border-t border-bg/25 pt-3 text-sm">
        <Link to="/discover" className="font-semibold underline decoration-highlight decoration-2 underline-offset-4">
          See everyone on Discover
        </Link>
      </figcaption>
    </figure>
  );
}

export default function Home() {
  const session = useAuth();
  const [claim, setClaim] = useState("");
  const [members, setMembers] = useState<Member[] | null>(null);
  const [articles, setArticles] = useState<WritingPost[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/discover`)
      .then((r) => r.json())
      .then((d) => setMembers(Array.isArray(d) ? d : []))
      .catch(() => setMembers([]));
    fetch(`${API_BASE}/api/writing`)
      .then((r) => r.json())
      .then((d) => setArticles(Array.isArray(d) ? d.slice(0, 3) : []))
      .catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-bg text-text">
      <SiteNav />

      <main id="main">
        {/* Hero: the claim, visible on first load. */}
        <section className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-10 px-4 pb-16 pt-10 sm:px-6 md:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          <div className="min-w-0 lg:pt-6">
            <h1 className="font-heading text-[clamp(2.75rem,7vw,5.25rem)] font-black leading-[0.92] tracking-tight [font-stretch:80%] [text-wrap:balance]">
              Show the world what you do.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted">
              One page for your music, photos, projects or writing. Your links, your shows and your latest work, all at one
              address.
            </p>
            {session ? (
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to={`/u/${session.user.username}`}
                  className="rounded-btn bg-accent px-6 py-3.5 font-semibold text-accent-contrast transition-colors hover:bg-accent-hover"
                >
                  Go to your page
                </Link>
                <Link to="/account" className="rounded-btn border-2 border-text px-6 py-3 font-semibold text-text hover:bg-surface-2">
                  Edit your page
                </Link>
              </div>
            ) : (
              <ClaimForm value={claim} onChange={setClaim} />
            )}
          </div>

          <LineupPoster members={members} yourName={session ? session.user.username : claim} />
        </section>

        {/* What each profession's page includes. */}
        <section aria-labelledby="professions" className="border-t border-line">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 id="professions" className="font-heading text-3xl font-extrabold tracking-tight [font-stretch:85%] sm:text-4xl">
              Built around what you do
            </h2>
            <p className="mt-3 max-w-xl text-muted">
              Pick your profession and your page comes set up with the right sections. Every page also gets your links and
              a share button.
            </p>
            <ul className="mt-10 divide-y divide-line border-y border-line">
              {PROFESSIONS.map((p) => (
                <li key={p.id}>
                  <Link
                    to={`/discover?profession=${p.id}`}
                    className="group grid gap-1 py-5 sm:grid-cols-[minmax(12rem,16rem)_1fr_auto] sm:items-baseline sm:gap-8"
                  >
                    <span className="font-heading text-2xl font-extrabold tracking-tight [font-stretch:75%] group-hover:underline group-hover:decoration-highlight group-hover:decoration-4 group-hover:underline-offset-4 sm:text-3xl">
                      {p.name}
                    </span>
                    <span className="text-muted">{p.gets}</span>
                    <span className="text-sm font-semibold text-text">See {p.name.toLowerCase()}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* A real sequence, so it's numbered. */}
        <section aria-labelledby="how" className="bg-surface-2/60">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 id="how" className="font-heading text-3xl font-extrabold tracking-tight [font-stretch:85%] sm:text-4xl">
              Live in three steps
            </h2>
            <ol className="mt-10 grid gap-8 md:grid-cols-3">
              {[
                { t: "Claim your name", d: "Create a free account. Your page lives at timezoftoday.com/u/yourname." },
                { t: "Pick what you do", d: "Choose your profession and your page gets the sections that fit it." },
                { t: "Add your work and share", d: "Add tracks, photos, projects or posts, then share one link everywhere." },
              ].map((s, i) => (
                <li key={s.t} className="flex gap-4">
                  <span
                    aria-hidden
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-highlight font-heading text-lg font-black text-on-highlight"
                  >
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold">{s.t}</h3>
                    <p className="mt-1 text-muted">{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>
            {!session && (
              <Link
                to="/register"
                className="mt-10 inline-flex rounded-btn bg-accent px-6 py-3.5 font-semibold text-accent-contrast transition-colors hover:bg-accent-hover"
              >
                Claim your page
              </Link>
            )}
          </div>
        </section>

        {articles.length > 0 && (
          <section aria-labelledby="latest-writing" className="border-t border-line">
            <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <h2 id="latest-writing" className="font-heading text-3xl font-extrabold tracking-tight [font-stretch:85%]">
                  Latest writing
                </h2>
                <Link to="/writing" className="font-semibold underline decoration-highlight decoration-2 underline-offset-4">
                  All writing
                </Link>
              </div>
              <ul className="mt-8 grid gap-8 md:grid-cols-3">
                {articles.map((a) => (
                  <li key={a.slug}>
                    <Link to={`/writing/${a.slug}`} className="group block">
                      <time dateTime={a.date} className="text-sm text-subtle">
                        {formatDate(a.date)}
                      </time>
                      <h3 className="mt-1 text-xl font-bold leading-snug group-hover:underline group-hover:decoration-highlight group-hover:decoration-2 group-hover:underline-offset-4">
                        {a.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-muted">{a.summary}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
