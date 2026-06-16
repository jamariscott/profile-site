import { useEffect, useLayoutEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageNav from "../components/PageNav";
import ProfileView, { type PublicProfile } from "../components/ProfileView";
import { apiFetch } from "../lib/api";
import { isThemeId } from "../lib/themes";

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "private" | "notfound">("loading");

  useEffect(() => {
    if (!username) return;
    setStatus("loading");
    apiFetch(`/api/profiles/${encodeURIComponent(username)}`)
      .then(async (res) => {
        if (res.status === 404) { setStatus("notfound"); return; }
        if (res.status === 403) { setStatus("private"); return; }
        if (!res.ok) { setStatus("notfound"); return; }
        const data = await res.json();
        setProfile(data);
        setStatus("ok");
      })
      .catch(() => setStatus("notfound"));
  }, [username]);

  // Apply this profile's own theme to the page; restore the platform theme on leave.
  useLayoutEffect(() => {
    const root = document.documentElement;
    const previous = root.getAttribute("data-theme");
    if (profile?.theme && isThemeId(profile.theme)) {
      root.setAttribute("data-theme", profile.theme);
    }
    return () => {
      if (previous) root.setAttribute("data-theme", previous);
    };
  }, [profile?.theme]);

  if (status === "loading") {
    return (
      <div className="bg-bg min-h-screen">
        <PageNav />
        <div className="max-w-3xl mx-auto px-6 py-16 text-muted">Loading profile…</div>
      </div>
    );
  }

  if (status === "notfound") {
    return (
      <div className="bg-bg min-h-screen">
        <PageNav />
        <div className="max-w-3xl mx-auto px-6 py-16">
          <h1 className="text-3xl font-bold text-text mb-2">Profile not found</h1>
          <p className="text-muted">No profile exists at this address.</p>
        </div>
      </div>
    );
  }

  if (status === "private") {
    return (
      <div className="bg-bg min-h-screen">
        <PageNav />
        <div className="max-w-3xl mx-auto px-6 py-16">
          <h1 className="text-3xl font-bold text-text mb-2">This profile is private</h1>
          <p className="text-muted">The owner hasn't made this profile public.</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="bg-bg min-h-screen">
      <PageNav />
      <div className="max-w-3xl mx-auto px-6 py-12">
        <ProfileView profile={profile} />
      </div>
    </div>
  );
}
