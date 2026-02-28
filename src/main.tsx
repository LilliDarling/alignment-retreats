import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Activate preloaded font stylesheets (loaded as media="print" to avoid render-blocking)
document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][media="print"]').forEach(link => {
  link.media = 'all';
});

createRoot(document.getElementById("root")!).render(<App />);
