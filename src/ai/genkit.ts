import { genkit, cors } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";

export const ai = genkit({
  plugins: [
    googleAI(),
    cors({
      origin: "http://localhost:9007",
    }),
  ],
  model: "googleai/gemini-2.5-flash",
});
