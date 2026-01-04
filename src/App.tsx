// src/App.tsx
import BoardEditor from "./components/BoardEditor";
import { useEffect } from "react";
import { seedIfEmpty } from "./services/db";
import "./styles/tailwind.css";

export default function App() {
  useEffect(() => {
    seedIfEmpty();
  }, []);
  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">AAC Starter (PWA)</h1>
        <p className="text-sm text-slate-600">
          Age-neutral, open-source starter for AAC boards.
        </p>
      </header>

      <main>
        <BoardEditor />
      </main>
    </div>
  );
}
