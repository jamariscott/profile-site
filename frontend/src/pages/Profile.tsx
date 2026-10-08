import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { Pencil } from "lucide-react";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";
import ProfileView, { type PublicProfile } from "../components/ProfileView";
import ProfileFrame from "../components/ProfileFrame";
import { LogoMark } from "../components/Logo";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth";

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg text-text">
      <SiteNav />
      {children}
      <SiteFooter />
    </div>
  );
}

function Message({ title, body, claim = "/register" }: { title: string; body: string; claim?: string }) {
  return (
    <Shell>
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-20 sm:px-6">
        <h1 className="font-heading text-4xl font-black tracking-tight [font-stretch:80%]">{title}</h1>
        <p className="mt-3 text-lg text-muted">{body}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/discover" className="rounded-btn border-2 border-text px-5 py-3 font-semibold hover:bg-surface-2">
            Discover people
          </Link>
          <Link to={claim} className="rounded-btn bg-accent px-5 py-3 font-semibold text-accent-contrast hover:bg-accent-hover">
            Claim your page
          </Link>
        </div>
      </main>
    </Shell>
  );
}

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const session = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "private" | "notfound">("loading");

  useEffect(() => {
    if (!username) return;
    setStatus("loading");
    apiFetch(`/api/profiles/${encodeURIComponent(username)}`)
      .then(async (res) => {
        if (res.status === 403) return setStatus("private");
        if (!res.ok) return setStatus("notfound");
        setProfile(await res.json());
        setStatus("ok");
      })
      .catch(() => setStatus("notfound"));
  }, [username]);

  if (status === "notfound") {
    return (
      <Message
        title="No page here yet"
        body={`Nobody has claimed timezoftoday.com/u/${username} yet. It could be yours.`}
        claim={`/register?username=${encodeURIComponent(username ?? "")}`}
      />
    );
  }
  if (status === "private") {
    return <Message title="This page is private" body="Its owner hasn't made it public yet." />;
  }

  if (status === "loading" || !profile) {
    return (
      <Shell>
        <main id="main" className="mx-auto w-full max-w-4xl flex-1 animate-pulse px-4 py-12 sm:px-6" aria-busy="true">
          <div className="h-24 w-24 rounded-full bg-surface-2" />
          <div className="mt-6 h-10 w-2/3 rounded bg-surface-2" />
          <div className="mt-3 h-5 w-1/2 rounded bg-surface-2" />
          <div className="mt-8 flex gap-3">
            <div className="h-12 w-32 rounded-btn bg-surface-2" />
            <div className="h-12 w-32 rounded-btn bg-surface-2" />
          </div>
          <span className="sr-only">Loading page…</span>
        </main>
      </Shell>
    );
  }

  const isOwner = session?.user.username.toLowerCase() === profile.username.toLowerCase();

  return (
    <Shell>
      {/* The member's own theme and customization apply only to their content;
          the platform nav and footer stay in the platform look. */}
      <ProfileFrame theme={profile.theme} style={profile.style} className="flex-1">
        <main id="main" className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 md:py-14">
          {isOwner && (
            <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-btn border border-line bg-surface px-4 py-3 text-sm">
              <span className="text-muted">This is your page. Visitors see it like this.</span>
              <Link to="/account" className="inline-flex items-center gap-2 font-semibold text-text hover:underline">
                <Pencil size={15} aria-hidden />
                Edit your page
              </Link>
            </div>
          )}
          <ProfileView profile={profile} isOwner={isOwner} />
        </main>
      </ProfileFrame>

      {/* Every public page invites its visitors to make their own. */}
      {!session && (
        <aside aria-label="Make your own page" className="border-t border-line bg-surface-2/60">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6">
            <p className="flex items-center gap-3 font-semibold">
              <LogoMark size={26} />
              Want a page like this? It's free.
            </p>
            <Link
              to="/register"
              className="rounded-btn bg-accent px-5 py-3 font-semibold text-accent-contrast transition-colors hover:bg-accent-hover"
            >
              Claim your page
            </Link>
          </div>
        </aside>
      )}
    </Shell>
  );
}
