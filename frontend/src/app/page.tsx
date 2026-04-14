import { Header } from "../components/layout/Header";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-7xl items-center justify-center px-4 py-6 sm:px-6">
        <div className="max-w-xl rounded-2xl border border-white/10 bg-white/5 px-8 py-10 text-center shadow-2xl shadow-black/20 backdrop-blur">
          <h1 className="font-display text-3xl font-semibold text-white">
            Moving to Kibana
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            The Dashboard tab opens Kibana in its dashboards page in a separate
            tab so this app stays available. When you come back here, use the
            navigation to switch to Results or Upload.
          </p>
        </div>
      </main>
    </div>
  );
}
