import { NextRequest, NextResponse } from "next/server";
import { analyzeReviews } from "@/lib/sentiment";

type OmdbMovie = {
  Title: string;
  Year: string;
  Poster: string;
  Plot: string;
  imdbRating: string;
  imdbID: string;
  Genre?: string;
  Director?: string;
  Actors?: string;
};

type TmdbReview = {
  author: string;
  content: string;
  url: string;
};

type MovieResponse = {
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
    /** When true, insight is derived from plot text only (no review API). */
    source?: "reviews" | "plot";
  };
};

async function fetchOmdbMovie(imdbId: string): Promise<OmdbMovie> {
  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey) {
    throw new Error("OMDB_API_KEY is not configured");
  }

  const res = await fetch(
    `https://www.omdbapi.com/?apikey=${apiKey}&i=${encodeURIComponent(imdbId)}&plot=full`,
  );

  if (!res.ok) {
    throw new Error("Failed to fetch movie metadata from OMDb");
  }

  const data = (await res.json()) as OmdbMovie & { Response?: string; Error?: string };

  if (data.Response === "False") {
    throw new Error(data.Error || "Movie not found");
  }

  return data;
}

async function fetchOmdbMovieByTitle(titleQuery: string): Promise<OmdbMovie> {
  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey) {
    throw new Error("OMDB_API_KEY is not configured");
  }

  const res = await fetch(
    `https://www.omdbapi.com/?apikey=${apiKey}&t=${encodeURIComponent(titleQuery)}&plot=full`,
  );

  if (!res.ok) {
    throw new Error("Failed to fetch movie metadata from OMDb");
  }

  const data = (await res.json()) as OmdbMovie & {
    Response?: string;
    Error?: string;
  };

  if (data.Response === "False") {
    throw new Error(data.Error || "Movie not found");
  }

  return data;
}

async function fetchTmdbReviews(imdbId: string): Promise<TmdbReview[]> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    // If TMDB is not configured, we can still return movie metadata and
    // simply omit audience reviews.
    return [];
  }

  // Step 1: get TMDB id from IMDb id
  const externalRes = await fetch(
    `https://api.themoviedb.org/3/find/${encodeURIComponent(imdbId)}?api_key=${apiKey}&external_source=imdb_id`,
  );

  if (!externalRes.ok) {
    // If TMDB lookup fails (rate limits, invalid key, etc.), fall back
    // gracefully by returning no reviews instead of failing the whole flow.
    return [];
  }

  const externalJson = (await externalRes.json()) as {
    movie_results?: { id: number }[];
  };

  const tmdbId = externalJson.movie_results?.[0]?.id;
  if (!tmdbId) {
    // No TMDB mapping for this IMDb id – just continue without reviews.
    return [];
  }

  // Step 2: fetch reviews for TMDB movie
  const reviewsRes = await fetch(
    `https://api.themoviedb.org/3/movie/${tmdbId}/reviews?api_key=${apiKey}&language=en-US`,
  );

  if (!reviewsRes.ok) {
    // If fetching reviews fails, skip them instead of throwing.
    return [];
  }

  const reviewsJson = (await reviewsRes.json()) as { results?: TmdbReview[] };
  return reviewsJson.results ?? [];
}

// Basic local summary builder functions have been removed.
// The Vercel AI SDK now fully generates the dynamic sentiment summary.

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ imdbId: string }> },
) {
  const { imdbId } = await params;
  const rawQuery = imdbId?.trim();

  if (!rawQuery) {
    return NextResponse.json(
      { error: "Please provide a movie title or IMDb ID." },
      { status: 400 },
    );
  }

  try {
    const looksLikeImdbId = /^tt\d+$/.test(rawQuery);

    const movie = looksLikeImdbId
      ? await fetchOmdbMovie(rawQuery)
      : await fetchOmdbMovieByTitle(rawQuery);

    const tmdbReviews = await fetchTmdbReviews(movie.imdbID);

    const trimmedReviews = tmdbReviews
      .map((r) => ({
        ...r,
        content: r.content.trim(),
      }))
      .filter((r) => r.content.length > 0)
      .slice(0, 25);

    // Use reviews if available; otherwise run sentiment on the plot (free, no extra API).
    const textsForSentiment =
      trimmedReviews.length > 0
        ? trimmedReviews.map((r) => r.content)
        : movie.Plot && movie.Plot !== "N/A"
          ? [movie.Plot]
          : [];

    const source: "reviews" | "plot" =
      trimmedReviews.length > 0 ? "reviews" : "plot";

    const sentiment = await analyzeReviews(textsForSentiment, source);
    const summary = sentiment.summary;

    const response: MovieResponse = {
      movie: {
        title: movie.Title,
        year: movie.Year,
        poster: movie.Poster,
        plot: movie.Plot,
        rating: movie.imdbRating,
        genres: movie.Genre,
        director: movie.Director,
        cast: movie.Actors ? movie.Actors.split(",").map((a) => a.trim()) : [],
      },
      reviews: trimmedReviews.map((r, index) => {
        const reviewSentiment = sentiment.reviews[index];
        return {
          author: r.author,
          content: r.content,
          url: r.url,
          score: reviewSentiment?.score ?? 0,
          comparative: reviewSentiment?.comparative ?? 0,
        };
      }),
      sentiment: {
        label: sentiment.label,
        overallScore: sentiment.overallScore,
        overallComparative: sentiment.overallComparative,
        summary,
        topPositiveWords: sentiment.topPositiveWords,
        topNegativeWords: sentiment.topNegativeWords,
        source,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

