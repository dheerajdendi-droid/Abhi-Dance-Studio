import { NavLink } from "react-router-dom";

const TABS = [
  { to: "/", label: "Today", icon: "🕺" },
  { to: "/students", label: "Students", icon: "🧑‍🤝‍🧑" },
  { to: "/money", label: "Money", icon: "💰" },
  { to: "/trends", label: "Trends", icon: "📈" },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-plum-800 border-t border-plum-900 flex z-20 pb-[env(safe-area-inset-bottom)]">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === "/"}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[56px] text-xs font-medium transition-colors ${
              isActive ? "text-marigold-400" : "text-plum-100/70"
            }`
          }
        >
          <span className="text-xl leading-none">{tab.icon}</span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
