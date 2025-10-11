"use server";
/**
 * @fileOverview An AI agent that generates product details based on keywords.
 *
 * - generateProductDetails - A function that generates product name, description, and category.
 * - GenerateProductDetailsInput - The input type for the generateProductDetails function.
 * - GenerateProductDetailsOutput - The return type for the generateProductDetails function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const GenerateProductDetailsInputSchema = z.object({
  keywords: z
    .string()
    .describe("A comma-separated list of keywords describing the product."),
});
export type GenerateProductDetailsInput = z.infer<
  typeof GenerateProductDetailsInputSchema
>;

const GenerateProductDetailsOutputSchema = z.object({
  name: z.string().describe("A creative and marketable name for the product."),
  description: z
    .string()
    .describe(
      "A compelling and persuasive product description of 2-3 sentences.",
    ),
  category: z
    .string()
    .describe(
      "A suitable category for the product (e.g., Apparel, Home Goods, Electronics).",
    ),
});
export type GenerateProductDetailsOutput = z.infer<
  typeof GenerateProductDetailsOutputSchema
>;

const productDetailsPrompt = ai.definePrompt({
  name: "productDetailsPrompt",
  input: { schema: GenerateProductDetailsInputSchema },
  output: { schema: GenerateProductDetailsOutputSchema },
  prompt: `You are an expert copywriter for an e-commerce store. Based on the following keywords, generate a creative product name, a compelling description (2-3 sentences), and a suitable category.

Keywords: {{{keywords}}}

Generate the response in the requested JSON format.`,
});

export async function generateProductDetails(
  input: GenerateProductDetailsInput,
): Promise<GenerateProductDetailsOutput> {
  const { output } = await productDetailsPrompt(input);
  if (!output) {
    throw new Error("Failed to generate product details.");
  }
  return output;
}
