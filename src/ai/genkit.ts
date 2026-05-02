import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Global Genkit instance configured with the Google AI plugin.
 * The plugin will automatically look for GOOGLE_GENAI_API_KEY or GEMINI_API_KEY in environment variables.
 */
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});
