export default function Header({ title }) {
  return (
    <header className="sticky top-0 z-10 bg-plum-800 text-cream-50 px-4 py-4 pt-[calc(env(safe-area-inset-top)+1rem)] shadow-md">
      <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
    </header>
  );
}
