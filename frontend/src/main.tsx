import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { LayoutProvider } from "./theme/LayoutProvider";
import { DarkModeProvider } from "./theme/DarkModeProvider";
import { ToastProvider } from "./components/ToastProvider";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
// Platform typeface: Archivo with its width axis (62–125%) for the lineup poster.
import "@fontsource-variable/archivo/wdth.css";
import "./index.css";

// Design trial (redesign preview only): ?palette=a|b|c|d and ?logo=a|b switch the
// platform palette and logo mark. Kept for the tab's session so links keep it.
// Remove once a palette and logo are chosen.
for (const key of ["palette", "logo"]) {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get(key);
    if (fromUrl) sessionStorage.setItem(`tzt_trial_${key}`, fromUrl);
    const value = fromUrl || sessionStorage.getItem(`tzt_trial_${key}`);
    if (value) document.documentElement.setAttribute(`data-${key}`, value);
  } catch {
    /* storage unavailable: trial just doesn't persist */
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <LayoutProvider>
        <DarkModeProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </DarkModeProvider>
      </LayoutProvider>
    </BrowserRouter>
  </React.StrictMode>
);
