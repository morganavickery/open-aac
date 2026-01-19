import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { registerSW } from "virtual:pwa-register";
import "./styles/tailwind.css";
import "./styles/basic.css";

createRoot(document.getElementById("root")!).render(<App />);
registerSW({ immediate: true });
