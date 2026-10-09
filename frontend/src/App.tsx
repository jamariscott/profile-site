import { lazy, Suspense, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";

import Home from "./pages/Home";

// Every page except Home loads as its own file, so the first visit only
// downloads what it shows. Shared profile links (/u/name) load Profile's file.
const pages = {
  Writing: () => import("./pages/Writing"),
  WritingPost: () => import("./pages/WritingPost"),
  Videos: () => import("./pages/Videos"),
  Discover: () => import("./pages/Discover"),
  Search: () => import("./pages/Search"),
  Login: () => import("./pages/Login"),
  Register: () => import("./pages/Register"),
  Profile: () => import("./pages/Profile"),
  NotFound: () => import("./pages/NotFound"),
  Account: () => import("./pages/Account"),
  Admin: () => import("./pages/Admin"),
};

const Writing = lazy(pages.Writing);
const WritingPost = lazy(pages.WritingPost);
const Videos = lazy(pages.Videos);
const Discover = lazy(pages.Discover);
const Search = lazy(pages.Search);
const Login = lazy(pages.Login);
const Register = lazy(pages.Register);
const Profile = lazy(pages.Profile);
const NotFound = lazy(pages.NotFound);
const Account = lazy(pages.Account);
// Admin pulls in the TipTap editor, so it is never fetched ahead of time.
const Admin = lazy(pages.Admin);

// Once the first page is up and the browser is idle, fetch the public pages
// in the background so moving between them is instant.
const PREFETCH = [pages.Discover, pages.Profile, pages.Writing, pages.WritingPost, pages.Videos, pages.Register, pages.Login, pages.Search];

export default function App() {
  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 2000));
    const handle = idle(() => PREFETCH.forEach((load) => load().catch(() => {})));
    return () => (window.cancelIdleCallback ?? window.clearTimeout)(handle);
  }, []);

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
      <Analytics />
    </>
  );
}
