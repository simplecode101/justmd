import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

(window as any).__perf.js = performance.now();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

(window as any).__perf.mount = performance.now();
