import React from "react";
import { reportTechnicalError } from "./errorMonitoring.mjs";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    reportTechnicalError(error, {
      category: "react_render_error",
      stack: `${error?.stack || ""}\n${info?.componentStack || ""}`,
    });
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px", textAlign: "center" }}>
        <section>
          <h1>Noe gikk galt</h1>
          <p>Last inn siden på nytt. Hvis feilen fortsetter, kan en voksen prøve igjen senere.</p>
          <button type="button" onClick={() => window.location.reload()}>Last inn på nytt</button>
        </section>
      </main>
    );
  }
}
