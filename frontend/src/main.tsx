import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { LayoutProvider } from "./theme/LayoutProvider";
import { DarkModeProvider } from "./theme/DarkModeProvider";
import { ToastProvider } from "./components/ToastProvider";
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
