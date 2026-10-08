import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthShell, Field, PasswordField, primaryButton } from "../components/AuthFields";
import { LogoMark } from "../components/Logo";
import { apiJson, apiFetch } from "../lib/api";
import { setSession, type AuthSession } from "../lib/auth";
import { THEMES } from "../lib/themes";
import { presetFor } from "../lib/professions";

const PROFESSIONS = THEMES.filter((t) => t.kind === "profession");
// What each profession's page starts with (mirrors PROFESSION_PRESETS).
const STARTS_WITH: Record<string, string> = {
  music: "Tracks, releases and shows",
  developer: "Projects",
  photographer: "A photo gallery",
  creator: "Your videos",
  writer: "Your writing",
};
const USERNAME_ALLOWED = /[^A-Za-z0-9_.-]/g;

export default function Register() {
  const [params] = useSearchParams();
  // Prefilled from the Home page claim field (/register?username=...).
  const [username, setUsername] = useState((params.get("username") || "").replace(USERNAME_ALLOWED, ""));
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [profession, setProfession] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !username || !email || !password) {
      setError("Fill in your name, username, email and password to continue.");
      return;
    }
    if (username.length < 3) {
      setError("Usernames need at least 3 characters.");
      return;
    }
    if (password.length < 8) {
      setError("Passwords need at least 8 characters.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await apiJson<AuthSession>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ first_name: firstName, last_name: lastName, username, email, phone, password }),
      });
      setSession(data);
      // Set up the page for their profession right away so it isn't blank.
      if (profession) {
        await apiFetch("/api/me/profile", {
          method: "PUT",
          body: JSON.stringify({ theme: profession, layout: presetFor(profession) }),
        }).catch(() => {});
      }
      navigate("/account");
    } catch (err: any) {
      setError(err?.message || "Couldn't create your account. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const name = `${firstName} ${lastName}`.trim();
  const professionLabel = PROFESSIONS.find((p) => p.id === profession)?.label;

  return (
    <AuthShell
      aside={
        <div>
          <p className="text-sm font-semibold text-bg/75">Your page</p>
          <div className="mt-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-highlight font-heading text-2xl font-black text-on-highlight">
              {(firstName || username || "Y").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="break-words font-heading text-3xl font-black leading-none tracking-tight [font-stretch:72%]">
                {name || "Your name"}
              </p>
              <p className="mt-1 text-bg/75">{professionLabel ?? "What you do"}</p>
            </div>
          </div>
          <p className="mt-8 break-all rounded-btn bg-bg/10 px-4 py-3 font-semibold">
            timezoftoday.com/u/{username || "yourname"}
          </p>
          {profession && <p className="mt-4 text-bg/80">Starts with: {STARTS_WITH[profession]}, plus your links.</p>}
          <div className="mt-10 flex items-center gap-3 border-t border-bg/20 pt-6 text-sm text-bg/75">
            <LogoMark size={22} />
            Free to join. Public by default, private any time.
          </div>
        </div>
      }
    >
      <h1 className="font-heading text-4xl font-black tracking-tight [font-stretch:80%]">Claim your page</h1>
      <p className="mt-2 text-muted">It's free. You'll be editing your page in under a minute.</p>

      <form onSubmit={submit} noValidate className="mt-8 space-y-5">
        <Field
          id="username"
          label="Username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value.replace(USERNAME_ALLOWED, "").slice(0, 30))}
          hint={
            <>
              Your page: <span className="font-semibold text-text">timezoftoday.com/u/{username || "yourname"}</span>
            </>
          }
          autoFocus={!username}
        />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field
            id="first_name"
            label="First name"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoFocus={!!username}
          />
          <Field id="last_name" label="Last name" autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
        <Field id="email" label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <PasswordField
          id="password"
          label="Password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="At least 8 characters."
        />
        <Field
          id="phone"
          label={
            <>
              Phone <span className="font-normal text-muted">(optional)</span>
            </>
          }
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-text">
            What do you do? <span className="font-normal text-muted">(optional, change any time)</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {PROFESSIONS.map((p) => {
              const active = profession === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setProfession(active ? "" : p.id)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    active ? "border-text bg-text text-bg" : "border-line-strong text-muted hover:text-text"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        {error && (
          <p role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        )}
        <button type="submit" disabled={loading} className={primaryButton}>
          {loading ? "Creating your page…" : "Create my page"}
        </button>
      </form>

      <p className="mt-6 text-sm text-muted">
        Already have a page?{" "}
        <Link to="/login" className="font-semibold text-text underline decoration-highlight decoration-2 underline-offset-4">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
