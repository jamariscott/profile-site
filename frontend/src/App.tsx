import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";

import Home from "./pages/Home";
import Writing from "./pages/Writing";
import WritingPost from "./pages/WritingPost";
import Videos from "./pages/Videos";
import Discover from "./pages/Discover";
import Search from "./pages/Search";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import AdminLayoutSwitcher from "./components/AdminLayoutSwitcher";
import { useSmoothScroll } from "./lib/useSmoothScroll";

// Heaviest, auth-gated pages (Admin pulls in the TipTap editor) — split out of
// the initial bundle so public pages load lighter.
const Admin = lazy(() => import("./pages/Admin"));
const Account = lazy(() => import("./pages/Account"));

export default function App() {
  useSmoothScroll();

  return (
    <>
      <Suspense fallback={<div className="bg-bg min-h-screen" />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/writing" element={<Writing />} />
          <Route path="/writing/:slug" element={<WritingPost />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/search" element={<Search />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/account" element={<Account />} />
          <Route path="/u/:username" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <AdminLayoutSwitcher />
      <Analytics />
    </>
  );
}
