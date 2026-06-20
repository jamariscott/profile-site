import Admin from "./pages/Admin";
import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Writing from "./pages/Writing";
import WritingPost from "./pages/WritingPost";
import Videos from "./pages/Videos";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Account from "./pages/Account";
import Profile from "./pages/Profile";
import AdminThemeSwitcher from "./components/AdminThemeSwitcher";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/writing" element={<Writing />} />
        <Route path="/writing/:slug" element={<WritingPost />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/account" element={<Account />} />
        <Route path="/u/:username" element={<Profile />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
      <AdminThemeSwitcher />
    </>
  );
}
