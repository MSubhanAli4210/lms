export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="animate-page-enter max-w-xl text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-700 text-lg font-bold text-white shadow-lg shadow-teal-900/10">
          L
        </div>
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">
          A better way to learn
        </p>
        <h1 className="text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
          LMS
        </h1>

        <p className="mt-5 text-lg leading-8 text-slate-600">
          Learn Without Limits
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="/login" className="rounded-lg bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-teal-900/10 hover:bg-teal-800">
            Sign in
          </a>
          <a href="/register" className="rounded-lg border bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800">
            Create account
          </a>
        </div>
      </div>
    </main>
  );
}