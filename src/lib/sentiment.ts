import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

export type ReviewSentiment = {
  text: string;
  score: number;
  comparative: number;
};

export type AggregateSentiment = {
  overallScore: number;
  overallComparative: number;
  label: "positive" | "mixed" | "negative";
  reviews: ReviewSentiment[];
  topPositiveWords: { word: string; count: number }[];
  topNegativeWords: { word: string; count: number }[];
  summary: string;
};

export async function analyzeReviews(
  texts: string[],
  source: 'reviews' | 'plot'
): Promise<AggregateSentiment> {
  if (texts.length === 0) {
    return {
      label: "mixed",
      summary: "Insufficient data available for analysis.",
      overallScore: 0,
      overallComparative: 0,
      topPositiveWords: [],
      topNegativeWords: [],
      reviews: []
    };
  }

  const isPlot = source === 'plot';
  const prompt = `Analyze the following ${isPlot ? "movie plot summary" : "audience reviews from various sources"}. 
Gather this information and provide a helpful description of how the movie is. Summarize the general consensus, highlight what stands out, and give a clear verdict on the movie's quality based on the given text.

Text Data:
${texts.map((t, i) => `[${i + 1}] ${t.substring(0, 300)}`).join("\n\n")}`;

  try {
    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      prompt,
      schema: z.object({
        label: z
          .enum(["positive", "mixed", "negative"])
          .describe("The overall sentiment classified as positive, mixed, or negative"),
        summary: z
          .string()
          .describe("A highly nuanced 2-4 sentence AI description of the movie gathered from the reviews. It should tell the user how the movie is based on the consensus."),
        overallScore: z
          .number()
          .describe("An aggregate score from 1 to 10 based on the sentiment"),
        overallComparative: z
          .number()
          .describe("A normalized comparative score from -1.0 to 1.0"),
        topPositiveWords: z
          .array(
            z.object({
              word: z.string(),
              count: z.number().describe("The frequency of this theme/word")
            })
          )
          .max(5)
          .describe("Top 5 recurring positive keywords or themes praised by audiences"),
        topNegativeWords: z
          .array(
            z.object({
              word: z.string(),
              count: z.number().describe("The frequency of this theme/word")
            })
          )
          .max(5)
          .describe("Top 5 recurring negative keywords or complaints from audiences")
      }),
    });

    return {
      label: object.label,
      summary: object.summary,
      overallScore: object.overallScore,
      overallComparative: object.overallComparative,
      topPositiveWords: object.topPositiveWords,
      topNegativeWords: object.topNegativeWords,
      reviews: texts.map(t => ({ text: t, score: 0, comparative: 0 }))
    };
  } catch (error) {
    console.error("AI SDK error:", error);
    return {
      label: "mixed",
      summary: "AI sentiment analysis failed. Please ensure the GOOGLE_GENERATIVE_AI_API_KEY environment variable is configured correctly.",
      overallScore: 5,
      overallComparative: 0,
      topPositiveWords: [],
      topNegativeWords: [],
      reviews: texts.map(t => ({ text: t, score: 0, comparative: 0 }))
    };
  }
}
