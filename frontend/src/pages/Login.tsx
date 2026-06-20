import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import PageNav from "../components/PageNav";
import { apiJson } from "../lib/api";
import { setSession, type AuthSession } from "../lib/auth";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError("Enter your username/email and password.");
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
      navigate(next || "/");
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-bg min-h-screen">
      <PageNav />
      <div className="max-w-md mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-text mb-6">Log in</h1>
        <form onSubmit={submit} className="space-y-4">
          <input
            type="text"
            placeholder="Username or email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="border border-line bg-surface text-text p-3 w-full rounded-btn"
            autoFocus
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-line bg-surface text-text p-3 w-full rounded-btn"
          />
          {error && <p className="text-danger text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-accent text-accent-contrast px-6 py-3 rounded-btn w-full font-medium disabled:opacity-50"
          >
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>
        <p className="text-sm text-muted mt-6">
          Don't have an account?{" "}
          <Link to="/register" className="text-accent hover:text-accent-hover font-medium">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
