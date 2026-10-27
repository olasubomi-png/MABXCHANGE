"use client";

export function Greeting() {
  const hour = new Date().getHours();
  let greeting = "Good evening";
  if (hour < 12) greeting = "Good morning";
  else if (hour < 17) greeting = "Good afternoon";

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-[var(--mx-text-muted)]">{greeting}</p>
        <h1 className="mt-0.5 text-xl font-bold tracking-tight text-[var(--mx-text)] sm:text-2xl">
          Welcome back
        </h1>
      </div>
      <div
        className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--mx-primary-soft)] text-sm font-bold text-[var(--mx-primary)] ring-2 ring-white"
        aria-label="Profile"
      >
        U
      </div>
    </div>
  );
}
