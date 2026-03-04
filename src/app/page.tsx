import { MovieInsightClient } from "./movie-insight-client";

export default function Home() {
  return (
    <div className="relative flex flex-col flex-1 bg-[#09090b] text-white min-h-screen overflow-hidden isolate">
      {/* Vibrant glowing background orbs */}
      <div className="absolute inset-0 z-[-10] h-full w-full bg-[#050505]">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-fuchsia-600/30 blur-[120px] mix-blend-screen pointer-events-none animate-pulse duration-[8000ms]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[60%] h-[60%] rounded-full bg-cyan-600/20 blur-[150px] mix-blend-screen pointer-events-none animate-pulse duration-[10000ms]" />
        <div className="absolute top-[20%] left-[40%] w-[40%] h-[40%] rounded-full bg-indigo-600/30 blur-[120px] mix-blend-screen pointer-events-none" />
      </div>

      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none z-[-5]" />

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
        <header className="mb-12 animate-fade-in space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl text-balance">
            Movie Insight Engine
          </h1>
          <p className="max-w-2xl text-base text-slate-400 sm:text-lg text-balance">
            Our AI gathers and reads audience reviews from across the web to give you a clear, unbiased description of how the movie actually is—extracting core themes, praises, and critiques in seconds.
          </p>
        </header>

        <MovieInsightClient />
      </main>
    </div>
  );
}
