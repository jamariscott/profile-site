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
