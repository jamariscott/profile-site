import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthShell, Field, PasswordField, primaryButton } from "../components/AuthFields";
import { LogoMark } from "../components/Logo";
import { apiJson } from "../lib/api";
import { setSession, type AuthSession } from "../lib/auth";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError("Enter your username or email, and your password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await apiJson<AuthSession>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password }),
      });
      setSession(data);
      const next = params.get("next");
      // Only follow in-site paths, never another origin.
      navigate(next && next.startsWith("/") && !next.startsWith("//") ? next : "/");
    } catch (err: any) {
      setError(err?.message || "Couldn't log you in. Check your details and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      aside={
        <div className="flex min-h-[22rem] flex-col">
          <LogoMark size={56} />
          <p className="mt-8 font-heading text-5xl font-black leading-[0.95] tracking-tight [font-stretch:72%]">
            Your page is waiting.
          </p>
          <p className="mt-4 max-w-sm text-bg/80">Pick up where you left off: add your latest work, update your links, share it.</p>
        </div>
      }
    >
      <h1 className="font-heading text-4xl font-black tracking-tight [font-stretch:80%]">Log in</h1>
      <p className="mt-2 text-muted">Welcome back.</p>

      <form onSubmit={submit} noValidate className="mt-8 space-y-5">
        <Field
          id="identifier"
          label="Username or email"
          autoComplete="username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          autoFocus
        />
        <PasswordField
          id="password"
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && (
          <p role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        )}
        <button type="submit" disabled={loading} className={primaryButton}>
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-sm text-muted">
        New here?{" "}
        <Link to="/register" className="font-semibold text-text underline decoration-highlight decoration-2 underline-offset-4">
          Claim your page
        </Link>
      </p>
    </AuthShell>
  );
}
