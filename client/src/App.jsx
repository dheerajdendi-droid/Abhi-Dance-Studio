import { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Today from "./pages/Today.jsx";
import Lock from "./pages/Lock.jsx";
import Header from "./components/Header.jsx";
import BottomNav from "./components/BottomNav.jsx";
import { useAuthStatus } from "./lib/useAuth.js";

// Today is the screen used live, mid-class — keep it in the main bundle.
// The rest lazy-load on demand so the first paint stays lean on 4G.
const Students = lazy(() => import("./pages/Students.jsx"));
const Money = lazy(() => import("./pages/Money.jsx"));
const Trends = lazy(() => import("./pages/Trends.jsx"));

const TITLES = {
  "/": "Today",
  "/students": "Students",
  "/money": "Money",
  "/trends": "Trends",
};

export default function App() {
  const location = useLocation();
  const title = TITLES[location.pathname] || "Abhi's Dance Studio";
  const { data, isLoading } = useAuthStatus();

  if (isLoading) {
    return <div className="min-h-screen bg-plum-900" />;
  }

  if (!data || !data.authenticated) {
    return <Lock pinSet={!!(data && data.pinSet)} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header title={title} />
      <main className="flex-1 pb-20">
        <Suspense fallback={<p className="p-4 text-plum-400">Loading…</p>}>
          <Routes>
            <Route path="/" element={<Today />} />
            <Route path="/students" element={<Students />} />
            <Route path="/money" element={<Money />} />
            <Route path="/trends" element={<Trends />} />
          </Routes>
        </Suspense>
      </main>
      <BottomNav />
    </div>
  );
}
