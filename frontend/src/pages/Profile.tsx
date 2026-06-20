import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";
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

  if (status === "loading") {
    return (
      <div className="bg-bg min-h-screen flex flex-col">
        <SiteNav />
        <div className="max-w-3xl mx-auto px-6 py-16 text-muted flex-1 w-full">Loading profile…</div>
        <SiteFooter />
      </div>
    );
  }

  if (status === "notfound") {
    return (
      <div className="bg-bg min-h-screen flex flex-col">
        <SiteNav />
        <div className="max-w-3xl mx-auto px-6 py-16 flex-1 w-full">
          <h1 className="text-3xl font-bold text-text mb-2">Profile not found</h1>
          <p className="text-muted">No profile exists at this address.</p>
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (status === "private") {
    return (
      <div className="bg-bg min-h-screen flex flex-col">
        <SiteNav />
        <div className="max-w-3xl mx-auto px-6 py-16 flex-1 w-full">
          <h1 className="text-3xl font-bold text-text mb-2">This profile is private</h1>
          <p className="text-muted">The owner hasn't made this profile public.</p>
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (!profile) return null;

  // The profile owner's own theme is scoped to just their content — the
  // surrounding nav/footer stay on the site's universal layout + dark/light
  // mode (so the toggle keeps working everywhere, not just outside profiles).
  const profileTheme = profile.theme && isThemeId(profile.theme) ? profile.theme : undefined;

  return (
    <div className="bg-bg min-h-screen flex flex-col">
      <SiteNav />
      <div data-theme={profileTheme} className="max-w-3xl mx-auto px-6 py-12 flex-1 w-full">
        <ProfileView profile={profile} />
      </div>
      <SiteFooter />
    </div>
  );
}
