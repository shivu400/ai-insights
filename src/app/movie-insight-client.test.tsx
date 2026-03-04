import { describe, expect, it } from "vitest";
import { analyzeReviews } from "@/lib/sentiment";

describe("analyzeReviews", () => {
  it("classifies clearly positive text as positive", () => {
    const result = analyzeReviews([
      "Amazing, brilliant, fantastic movie. I loved every moment.",
    ]);
    expect(result.label).toBe("positive");
  });

  it("classifies clearly negative text as negative", () => {
    const result = analyzeReviews([
      "Terrible and boring. I hated this movie.",
    ]);
    expect(result.label).toBe("negative");
  });
});

