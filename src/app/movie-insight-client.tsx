// Client-side interactive shell for the AI Movie Insight Builder
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, Sparkles, AlertCircle, Quote } from "lucide-react";

export type MovieResult = {
  movie: {
    title: string;
    year: string;
    poster: string;
    plot: string;
    rating: string;
    genres?: string;
    director?: string;
    cast?: string[];
  };
  reviews: {
    author: string;
    content: string;
    url: string;
    score: number;
    comparative: number;
  }[];
  sentiment: {
    label: "positive" | "mixed" | "negative";
    overallScore: number;
    overallComparative: number;
    summary: string;
    topPositiveWords: { word: string; count: number }[];
    topNegativeWords: { word: string; count: number }[];
    /** When "plot", insight is from synopsis only (no review API). */
    source?: "reviews" | "plot";
  };
};

const SENTIMENT_COLORS: Record<MovieResult["sentiment"]["label"], string> = {
  positive:
    "text-emerald-300 ring-1 ring-emerald-500/20 bg-gradient-to-b from-emerald-500/10 to-transparent shadow-[inset_0_1px_1px_rgba(16,185,129,0.2)]",
  mixed:
    "text-amber-200 ring-1 ring-amber-500/20 bg-gradient-to-b from-amber-500/10 to-transparent shadow-[inset_0_1px_1px_rgba(245,158,11,0.2)]",
  negative:
    "text-rose-200 ring-1 ring-rose-500/20 bg-gradient-to-b from-rose-500/10 to-transparent shadow-[inset_0_1px_1px_rgba(244,63,94,0.2)]",
};

const SENTIMENT_LABELS: Record<MovieResult["sentiment"]["label"], string> = {
  positive: "Overall Sentiment: Positive",
  mixed: "Overall Sentiment: Mixed",
  negative: "Overall Sentiment: Negative",
};

type HistoryEntry = {
  imdbId: string;
  title: string;
  timestamp: number;
};

const HISTORY_KEY = "brew-ai-movie-history";

export function MovieInsightClient({
  initialImdbId = "tt0133093",
}: {
  initialImdbId?: string;
}) {
  const [imdbId, setImdbId] = useState(initialImdbId); // The Matrix as a default
  const [data, setData] = useState<MovieResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const isValidQuery = imdbId.trim().length >= 2;

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(HISTORY_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as HistoryEntry[];
      setHistory(parsed);
    } catch {
      // ignore corrupted localStorage
    }
  }, []);

  useEffect(() => {
    if (!initialImdbId) return;
    // Auto-load when used from /movie/[imdbId] deep link.
    void submitForId(initialImdbId, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialImdbId]);

  function persistHistory(next: HistoryEntry[]) {
    setHistory(next);
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  }

  function upsertHistory(entry: HistoryEntry) {
    const filtered = history.filter((h) => h.imdbId !== entry.imdbId);
    const next = [{ ...entry }, ...filtered].slice(0, 6);
    persistHistory(next);
  }

  async function submitForId(query: string, markSubmitted: boolean) {
    if (markSubmitted) {
      setHasSubmitted(true);
    }
    setError(null);

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/movie/${encodeURIComponent(trimmed)}`);

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error || "Failed to fetch movie insights.");
      }

      const json = (await res.json()) as MovieResult;
      setData(json);
      upsertHistory({
        imdbId: trimmed,
        title: json.movie.title,
        timestamp: Date.now(),
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unexpected error occurred.";
      setError(message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidQuery) return;
    await submitForId(imdbId.trim(), true);
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants: import("framer-motion").Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 20 } }
  };

  const posterVariants: import("framer-motion").Variants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 100, damping: 20 } }
  };

  return (
    <section className="flex flex-1 flex-col gap-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] sm:p-8"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-cyan-500/20 text-fuchsia-300 ring-1 ring-fuchsia-500/30 shadow-[inset_0_0_20px_rgba(217,70,239,0.2)]">
              <Search className="h-6 w-6 opacity-90" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                Find a movie
              </h2>
              <p className="max-w-xl text-sm text-slate-300">
                Type a title like <span className="text-white font-semibold">Inception</span> or an IMDb ID like{" "}
                <span className="font-mono text-cyan-300">tt0133093</span>.
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="relative mt-8 flex flex-col gap-4 sm:flex-row sm:items-start"
          aria-label="Search by movie title or IMDb ID"
        >
          <div className="flex-1 space-y-2">
            <div className="group relative">
              <div className="relative flex items-center overflow-hidden rounded-2xl border border-white/10 bg-black/40 px-5 py-4 shadow-inner transition duration-300 focus-within:border-white/30 focus-within:bg-black/60 focus-within:ring-4 focus-within:ring-white/5">
                <input
                  id="imdbId"
                  name="imdbId"
                  value={imdbId}
                  onChange={(e) => setImdbId(e.target.value)}
                  className="flex-1 bg-transparent text-base text-white outline-none placeholder:text-slate-500"
                  placeholder="The Dark Knight or tt0468569..."
                  autoComplete="off"
                  spellCheck="false"
                  aria-invalid={hasSubmitted && !isValidQuery}
                />
              </div>
            </div>
            {hasSubmitted && !isValidQuery && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="text-xs font-medium text-rose-400 flex items-center gap-1.5 px-2 mt-2"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                Please enter at least 2 characters.
              </motion.p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group/btn relative inline-flex h-[58px] items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-fuchsia-600 via-indigo-500 to-cyan-500 px-8 text-sm font-bold text-white shadow-[0_0_40px_-10px_rgba(217,70,239,0.5)] transition-all hover:shadow-[0_0_60px_-15px_rgba(217,70,239,0.7)] hover:-translate-y-0.5 active:translate-y-0 disabled:pointer-events-none disabled:opacity-50"
          >
            <div className="absolute inset-0 -translate-x-[150%] bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover/btn:animate-button-shimmer disabled:hidden" />
            {loading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 relative z-10"
              >
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Analyzing...</span>
              </motion.div>
            ) : (
              <div className="flex items-center gap-2 relative z-10">
                <Sparkles className="h-4 w-4 transition-transform group-hover/btn:scale-110" />
                <span>Generate Insights</span>
              </div>
            )}
          </button>
        </form>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-200 flex items-start gap-3"
            >
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
              <p className="leading-relaxed">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid gap-6 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,2.6fr)]"
          >
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 flex flex-col sm:flex-row gap-6 h-auto sm:h-[280px] backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
              <div className="aspect-[2/3] w-48 bg-white/10 rounded-2xl shrink-0 animate-pulse" />
              <div className="flex-1 space-y-4 py-2">
                <div className="h-8 bg-white/10 rounded-lg w-3/4 animate-pulse" />
                <div className="flex gap-2">
                  <div className="h-6 bg-white/10 rounded-full w-16 animate-pulse" />
                  <div className="h-6 bg-white/10 rounded-full w-20 animate-pulse" />
                </div>
                <div className="space-y-3 pt-6">
                  <div className="h-3 bg-white/10 rounded w-full animate-pulse" />
                  <div className="h-3 bg-white/10 rounded w-full animate-pulse" />
                  <div className="h-3 bg-white/10 rounded w-4/5 animate-pulse" />
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="h-56 rounded-3xl bg-white/5 animate-pulse border border-white/10 backdrop-blur-xl" />
              <div className="h-64 rounded-3xl bg-white/5 animate-pulse border border-white/10 backdrop-blur-xl" />
            </div>
          </motion.div>
        ) : data ? (
          <motion.div
            key="results"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <ResultsGrid result={data} itemVariants={itemVariants} posterVariants={posterVariants} />
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-700/50 bg-slate-900/20 px-6 py-24 text-center"
          >
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-800/50 text-4xl shadow-inner border border-slate-700/50">
              🍿
            </div>
            <h3 className="text-lg font-semibold text-slate-300">Awaiting your search</h3>
            <p className="mt-2 text-sm text-slate-500 max-w-sm">
              Enter a movie above and watch our AI read thousands of audience reviews in real-time.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function ResultsGrid({
  result,
  itemVariants,
  posterVariants
}: {
  result: MovieResult,
  itemVariants: import("framer-motion").Variants,
  posterVariants: import("framer-motion").Variants
}) {
  const { movie, sentiment, reviews } = result;
  const reviewCount = reviews.length;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,2.6fr)]">
      {/* Movie summary card */}
      <motion.article
        variants={itemVariants}
        className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] sm:p-8"
      >
        <div className="relative flex flex-col gap-6 sm:flex-row">
          <motion.div variants={posterVariants} className="mx-auto aspect-[2/3] w-44 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/50 transition duration-500 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] sm:mx-0 sm:w-48">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                movie.poster && movie.poster !== "N/A"
                  ? movie.poster
                  : "https://images.pexels.com/photos/799137/pexels-photo-799137.jpeg?auto=compress&cs=tinysrgb&w=400"
              }
              alt={movie.title}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
            />
          </motion.div>
          <div className="flex-1 space-y-4 min-w-0 flex flex-col justify-center">
            <header>
              <motion.h2 variants={itemVariants} className="text-2xl font-bold tracking-tight text-white sm:text-4xl text-balance">
                {movie.title}
              </motion.h2>
              <motion.div variants={itemVariants} className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-white/10 px-2.5 py-1 font-mono text-xs font-semibold text-white ring-1 ring-inset ring-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                  {movie.year}
                </span>
                {movie.rating && movie.rating !== "N/A" && (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-400/10 px-2.5 py-1 text-xs font-bold text-amber-500 ring-1 ring-inset ring-amber-400/20 shadow-[inset_0_1px_1px_rgba(251,191,36,0.1)]">
                    <Sparkles className="h-3 w-3" />
                    {movie.rating}
                  </span>
                )}
                {movie.genres && (
                  <span className="text-xs font-medium text-slate-300 capitalize bg-white/5 px-2.5 py-1 rounded-md ring-1 ring-inset ring-white/10">{movie.genres}</span>
                )}
              </motion.div>
            </header>

            {movie.director && (
              <motion.p variants={itemVariants} className="text-sm text-slate-300">
                <span className="text-slate-500 font-medium">Directed by</span>{" "}
                <span className="font-semibold text-slate-100">{movie.director}</span>
              </motion.p>
            )}

            {movie.cast && movie.cast.length > 0 && (
              <motion.div variants={itemVariants} className="space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                  Cast
                </p>
                <div className="flex flex-wrap gap-2">
                  {movie.cast.slice(0, 5).map((actor) => (
                    <span
                      key={actor}
                      className="rounded-md bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-300 ring-1 ring-inset ring-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]"
                    >
                      {actor}
                    </span>
                  ))}
                  {movie.cast.length > 5 && (
                    <span className="rounded-md bg-white/5 px-2.5 py-1.5 text-[10px] text-slate-400 font-medium ring-1 ring-inset ring-white/10">
                      +{movie.cast.length - 5}
                    </span>
                  )}
                </div>
              </motion.div>
            )}

            {movie.plot && (
              <motion.p variants={itemVariants} className="mt-4 text-sm leading-relaxed text-slate-400 font-medium">
                {movie.plot}
              </motion.p>
            )}
          </div>
        </div>
      </motion.article>

      {/* Sentiment + reviews column */}
      <div className="space-y-6 flex flex-col">
        <motion.section
          variants={itemVariants}
          className={`group relative overflow-hidden rounded-3xl p-6 sm:p-8 backdrop-blur-xl border border-white/10 transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] bg-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] ${SENTIMENT_COLORS[sentiment.label]}`}
        >
          <div className="relative space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/20 ring-1 ring-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                <Sparkles className="h-5 w-5 opacity-90" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] opacity-60">
                  {sentiment.source === "plot" ? "Plot Analysis" : "Audience Consensus"}
                </p>
                <h3 className="text-lg font-bold tracking-tight">
                  {sentiment.source === "plot"
                    ? SENTIMENT_LABELS[sentiment.label] + " (from synopsis)"
                    : reviewCount === 0
                      ? "Requires Audience Data"
                      : SENTIMENT_LABELS[sentiment.label]}
                </h3>
              </div>
            </div>

            <p className="text-sm sm:text-base leading-relaxed opacity-95 font-medium">
              &quot;{sentiment.summary}&quot;
            </p>

            {(reviewCount > 0 || sentiment.source === "plot") &&
              (sentiment.topPositiveWords.length > 0 || sentiment.topNegativeWords.length > 0) && (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 p-5 rounded-2xl bg-black/20 border border-white/5 shadow-inner">
                  {sentiment.topPositiveWords.length > 0 && (
                    <div>
                      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
                        Themes & Praise
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {sentiment.topPositiveWords.map(({ word }) => (
                          <span key={word} className="rounded-md bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 ring-1 ring-inset ring-emerald-500/20 shadow-[inset_0_1px_1px_rgba(16,185,129,0.1)] capitalize">
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {sentiment.topNegativeWords.length > 0 && (
                    <div>
                      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-rose-400">
                        Critiques
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {sentiment.topNegativeWords.map(({ word }) => (
                          <span key={word} className="rounded-md bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-300 ring-1 ring-inset ring-rose-500/20 shadow-[inset_0_1px_1px_rgba(244,63,94,0.1)] capitalize">
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="group overflow-hidden flex-1 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl flex flex-col shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]">
          <header className="flex items-center gap-3 border-b border-white/5 px-6 py-5 bg-black/20">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
              <Quote className="h-4 w-4 text-slate-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-white">
                Raw Audience Data
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                Analyzed directly from TMDB reviews.
              </p>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
            <div className="space-y-3">
              {reviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 opacity-50">
                  <Quote className="h-8 w-8 mb-3 text-slate-600" />
                  <p className="text-xs font-medium">No exact public reviews mapped.</p>
                </div>
              ) : (
                reviews.slice(0, 6).map((review) => (
                  <article
                    key={review.url}
                    className="relative rounded-2xl bg-black/20 p-5 text-sm ring-1 ring-white/5 transition-all hover:bg-black/40 hover:ring-white/10"
                  >
                    <header className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-white/10 flex items-center justify-center text-[10px] font-bold text-white ring-1 ring-inset ring-white/10">
                          {(review.author || "A")[0].toUpperCase()}
                        </div>
                        <p className="font-semibold text-slate-200 text-xs tracking-tight">
                          {review.author || "Anonymous"}
                        </p>
                      </div>
                      <a
                        href={review.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold uppercase tracking-wider text-sky-400 opacity-50 transition-opacity hover:opacity-100"
                      >
                        Source
                      </a>
                    </header>
                    <p className="line-clamp-4 text-xs leading-relaxed text-slate-400 font-medium">
                      {review.content}
                    </p>
                  </article>
                ))
              )}
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

