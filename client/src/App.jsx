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
  const { data, isLoading, isError, refetch, isFetching } = useAuthStatus();

  if (isLoading) {
    return <div className="min-h-screen bg-plum-900" />;
  }

  // If the server/database can't be reached, say so — never fall through to
  // the "set up a PIN" screen, which would look like a PIN problem.
  if (isError) {
    return (
      <div className="min-h-screen bg-plum-900 flex flex-col items-center justify-center px-6 text-center text-white">
        <h1 className="font-display text-2xl font-semibold">Can't reach the server</h1>
        <p className="mt-2 text-plum-100 max-w-xs">
          This is not a PIN problem. The app's server or database isn't responding. Please try again shortly.
        </p>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="mt-6 min-h-[44px] px-6 rounded-xl bg-white text-plum-800 font-medium"
        >
          {isFetching ? "Trying…" : "Try again"}
        </button>
      </div>
    );
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
