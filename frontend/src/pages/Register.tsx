import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SiteNav from "../components/SiteNav";
import { apiJson } from "../lib/api";
import { setSession, type AuthSession } from "../lib/auth";

export default function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !username || !email || !password) {
      setError("First name, last name, username, email, and password are required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await apiJson<AuthSession>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          username,
          email,
          phone,
          password,
        }),
      });
      setSession(data);
      navigate("/");
    } catch (err: any) {
      setError(err?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-bg min-h-screen">
      <SiteNav />
      <div className="max-w-md mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-text mb-2">Create an account</h1>
        <p className="text-muted text-sm mb-6">Join to comment and access members-only areas.</p>
        <form onSubmit={submit} className="space-y-4">
          <div className="flex gap-3">
            <label htmlFor="first_name" className="sr-only">First name</label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              autoComplete="given-name"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="border border-line bg-surface text-text p-3 w-full rounded-btn"
              autoFocus
            />
            <label htmlFor="last_name" className="sr-only">Last name</label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              autoComplete="family-name"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="border border-line bg-surface text-text p-3 w-full rounded-btn"
            />
          </div>
          <label htmlFor="username" className="sr-only">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            autoComplete="username"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border border-line bg-surface text-text p-3 w-full rounded-btn"
          />
          <label htmlFor="email" className="sr-only">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-line bg-surface text-text p-3 w-full rounded-btn"
          />
          <label htmlFor="phone" className="sr-only">Phone (optional)</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            autoComplete="tel"
            placeholder="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="border border-line bg-surface text-text p-3 w-full rounded-btn"
          />
          <label htmlFor="password" className="sr-only">Password (minimum 8 characters)</label>
          <input
            type="password"
            id="password"
            name="password"
            autoComplete="new-password"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-line bg-surface text-text p-3 w-full rounded-btn"
          />
          {error && <p role="alert" className="text-danger text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-accent text-accent-contrast px-6 py-3 rounded-btn w-full font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>
        <p className="text-sm text-muted mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-accent hover:text-accent-hover font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
