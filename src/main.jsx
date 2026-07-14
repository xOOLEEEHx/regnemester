import React from "react";
import { createRoot } from "react-dom/client";
import { SpeedInsights } from "@vercel/speed-insights/react";
import App from "./App.jsx";
import ErrorBoundary from "./ErrorBoundary.jsx";
import { initializeErrorMonitoring } from "./errorMonitoring.mjs";
import "./styles.css";

initializeErrorMonitoring();

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
    <SpeedInsights />
  </React.StrictMode>
);
