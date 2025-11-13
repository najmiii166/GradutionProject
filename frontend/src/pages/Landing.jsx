// src/pages/Landing.jsx
import Brand from "../components/Brand";
import Button from "../components/Button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white">
      {/* Top gradient glow */}
      <div className="pointer-events-none absolute inset-x-0 -top-40 -z-10 flex justify-center opacity-60">
        <div className="h-72 w-72 rounded-full bg-blue-500 blur-3xl" />
      </div>

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Brand className="text-white" />
        <nav className="flex items-center gap-4 text-sm">
          <a href="/login" className="text-slate-200 hover:text-white">
            Login
          </a>
          <a
            href="/register/student"
            className="hidden rounded-full border border-slate-600 px-4 py-1.5 text-slate-100 hover:border-blue-500 hover:text-blue-100 sm:inline-flex"
          >
            Get started
          </a>
        </nav>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-12 px-6 pb-16 pt-4 lg:flex-row lg:items-center">
        {/* Left: hero copy */}
        <section className="flex-1 space-y-6">
          <p className="inline-flex items-center rounded-full bg-slate-800/70 px-3 py-1 text-xs font-medium text-slate-200 ring-1 ring-slate-700">
            🎓 For Universities · Students · Mentors
          </p>
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            Turn{" "}
            <span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
              classroom knowledge
            </span>{" "}
            into real mentorship.
          </h1>
          <p className="max-w-xl text-sm text-slate-300 sm:text-base">
            MentorLink connects students with verified lecturers and scholars
            for one-on-one guidance, structured sessions, and long-term support—
            all in one simple platform.
          </p>

          {/* CTAs */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="sm:w-auto w-full">
              <Button
                onClick={() => (window.location.href = "/register/student")}
                className="bg-blue-600 hover:bg-blue-500"
              >
                Get started as a student
              </Button>
            </div>
            <button
              onClick={() => (window.location.href = "/register/mentor")}
              className="inline-flex w-full items-center justify-center rounded-xl border border-slate-600 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-blue-400 hover:bg-slate-900/40 sm:w-auto"
            >
              Become a mentor
            </button>
          </div>

          {/* Stats */}
          <div className="mt-4 grid max-w-md grid-cols-2 gap-4 text-sm text-slate-300 sm:grid-cols-3">
            <div>
              <p className="text-lg font-semibold text-white">1:1</p>
              <p className="text-xs text-slate-400">Mentor–student sessions</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-white">Verified</p>
              <p className="text-xs text-slate-400">Accounts & ID checks</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-white">Credits</p>
              <p className="text-xs text-slate-400">Badges for mentors</p>
            </div>
          </div>
        </section>

        {/* Right: feature cards */}
        <section className="mt-6 flex-1 lg:mt-0">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-900/80 p-4 shadow-lg ring-1 ring-slate-800">
              <h3 className="mb-1 text-sm font-semibold text-white">
                🎯 Smart matching
              </h3>
              <p className="text-xs text-slate-300">
                Students find mentors by area of study, faculty, availability,
                and rating.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900/80 p-4 shadow-lg ring-1 ring-slate-800">
              <h3 className="mb-1 text-sm font-semibold text-white">
                📅 Structured sessions
              </h3>
              <p className="text-xs text-slate-300">
                Built-in scheduling, limits on daily students, and clear
                session history.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900/80 p-4 shadow-lg ring-1 ring-slate-800">
              <h3 className="mb-1 text-sm font-semibold text-white">
                ⭐ Ratings & credits
              </h3>
              <p className="text-xs text-slate-300">
                Students rate mentors. Mentors earn credits and Bronze/Silver/Gold badges.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900/80 p-4 shadow-lg ring-1 ring-slate-800">
              <h3 className="mb-1 text-sm font-semibold text-white">
                🛡️ Admin oversight
              </h3>
              <p className="text-xs text-slate-300">
                Admins approve accounts, monitor activity, and keep everything safe.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800/80">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-4 text-xs text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} MentorLink. All rights reserved.</p>
          <p>
            Built for students, mentors & universities to create real academic impact.
          </p>
        </div>
      </footer>
    </div>
  );
}
