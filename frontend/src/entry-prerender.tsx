// Build-time render of the home page to HTML (see scripts/prerender.mjs).
// The result ships inside index.html, so the headline and the claim form
// paint before any JavaScript runs; main.tsx then hydrates it. The tree must
// match main.tsx exactly (App included) or hydration falls back to a full
// re-render. Nothing may touch window or storage during render.
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { LazyMotion, MotionConfig, domMax } from "motion/react";
import App from "./App";
import { LayoutProvider } from "./theme/LayoutProvider";
import { DarkModeProvider } from "./theme/DarkModeProvider";
import { ToastProvider } from "./components/ToastProvider";

export function render(): string {
  return renderToString(
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domMax} strict>
        <StaticRouter location="/">
          <LayoutProvider>
            <DarkModeProvider>
              <ToastProvider>
                <App />
              </ToastProvider>
            </DarkModeProvider>
          </LayoutProvider>
        </StaticRouter>
      </LazyMotion>
    </MotionConfig>,
  );
}
