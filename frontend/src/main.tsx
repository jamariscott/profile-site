import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { LazyMotion, MotionConfig } from "motion/react";
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

// Motion: features load after first paint; "user" turns off movement for
// visitors who ask their system for reduced motion (fades still run).
const loadMotionFeatures = () => import("./lib/motionFeatures").then((m) => m.default);

const app = (
  <React.StrictMode>
    <MotionConfig reducedMotion="user">
      <LazyMotion features={loadMotionFeatures} strict>
        <BrowserRouter>
          <LayoutProvider>
            <DarkModeProvider>
              <ToastProvider>
                <App />
              </ToastProvider>
            </DarkModeProvider>
          </LayoutProvider>
        </BrowserRouter>
      </LazyMotion>
    </MotionConfig>
  </React.StrictMode>
);

const root = document.getElementById("root")!;
// The home page ships prebuilt in index.html (scripts/prerender.mjs): take
// over that HTML instead of redrawing it. Every other route gets the empty
// shell (app.html), and any stray prebuilt HTML there is cleared first.
if (root.hasChildNodes() && window.location.pathname === "/") {
  ReactDOM.hydrateRoot(root, app);
} else {
  root.replaceChildren();
  ReactDOM.createRoot(root).render(app);
}
