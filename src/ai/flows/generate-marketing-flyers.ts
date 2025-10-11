"use server";
/**
 * @fileOverview An AI agent that generates marketing flyers based on a given topic and promotional details.
 *
 * - generateMarketingFlyer - A function that generates a marketing flyer.
 * - GenerateMarketingFlyerInput - The input type for the generateMarketingFlyer function.
 * - GenerateMarketingFlyerOutput - The return type for the generateMarketingFlyer function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";
import wav from "wav";

const GenerateMarketingFlyerInputSchema = z.object({
  topic: z
    .string()
    .describe(
      "The main topic or subject of the ad (e.g., a product name, the app name).",
    ),
  keyMessage: z
    .string()
    .describe("The core message or description for the ad."),
  promotionalDetails: z
    .string()
    .describe(
      "Details of any sale, promotion, or special offer (e.g., discount percentage).",
    ),
  targetAudience: z
    .string()
    .describe(
      "The target audience for the flyer (e.g., students, professionals).",
    ),
  brandStyle: z
    .string()
    .describe(
      "The desired brand style for the flyer (e.g., modern, minimalist, playful).",
    ),
});
export type GenerateMarketingFlyerInput = z.infer<
  typeof GenerateMarketingFlyerInputSchema
>;

const GenerateMarketingFlyerOutputSchema = z.object({
  flyerImage: z
    .string()
    .describe("The generated marketing flyer image as a data URI."),
  callToAction: z
    .string()
    .describe("A suggested call to action for the flyer."),
});
export type GenerateMarketingFlyerOutput = z.infer<
  typeof GenerateMarketingFlyerOutputSchema
>;

export async function generateMarketingFlyer(
  input: GenerateMarketingFlyerInput,
): Promise<GenerateMarketingFlyerOutput> {
  return generateMarketingFlyerFlow(input);
}

const flyerPrompt = ai.definePrompt({
  name: "flyerPrompt",
  input: { schema: GenerateMarketingFlyerInputSchema },
  output: { schema: GenerateMarketingFlyerOutputSchema },
  prompt: `You are an expert marketing assistant. You will generate a marketing flyer based on the provided information.

  Ad Topic: {{{topic}}}
  Key Message: {{{keyMessage}}}
  Promotional Details: {{{promotionalDetails}}}
  Target Audience: {{{targetAudience}}}
  Brand Style: {{{brandStyle}}}

  Generate a visually appealing marketing flyer and suggest a call to action that will drive engagement or sales. The flyerImage should be a data URI, and the callToAction should be a short, compelling phrase.
  `,
});

const generateMarketingFlyerFlow = ai.defineFlow(
  {
    name: "generateMarketingFlyerFlow",
    inputSchema: GenerateMarketingFlyerInputSchema,
    outputSchema: GenerateMarketingFlyerOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
      model: "googleai/imagen-4.0-fast-generate-001",
      prompt: `Generate a marketing flyer about ${input.topic}. The key message is "${input.keyMessage}". The style should be ${input.brandStyle} for a ${input.targetAudience} audience. Include the promotional detail: "${input.promotionalDetails}".`,
    });

    const { output } = await flyerPrompt(input);
    return {
      flyerImage: media?.url ?? "No image generated",
      callToAction: output?.callToAction ?? "Learn More!",
    };
  },
);
