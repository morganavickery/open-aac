import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { register as registerServiceWorker } from "./registerServiceWorker";
import "./styles/tailwind.css";
import "./styles/basic.css";

createRoot(document.getElementById("root")!).render(<App />);
registerServiceWorker();
