// Landing page — sera construite à l'étape 5 (Frontend: Landing + connexion Google)
// Pour l'instant, stub de base fonctionnel

export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-dark-bg">
      <h1 className="font-title text-5xl font-bold gradient-text">
        SpinMyLunch
      </h1>
      <p className="font-body text-lg text-slate-400">
        La roulette qui décide pour toi.
      </p>
      <div className="glass rounded-2xl px-8 py-4 neon-border">
        <p className="text-slate-300 text-sm">
          Backend API:{" "}
          <code className="text-primary-400">
            {process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"}
          </code>
        </p>
      </div>
    </main>
  );
}
