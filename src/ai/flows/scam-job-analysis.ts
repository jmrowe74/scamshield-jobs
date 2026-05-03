'use server';
/**
 * @fileOverview A Genkit flow for analyzing job postings to determine their legitimacy.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ScamJobAnalysisInputSchema = z.object({
  jobTitle: z.string().describe('The title of the job posting.'),
  jobDescription: z.string().describe('The full description of the job posting.'),
  companyName: z.string().describe('The name of the company offering the job.'),
  jobUrl: z.string().describe('The URL of the job posting.'),
  websiteCreationDate: z
    .string()
    .describe("The creation date of the job posting's website, e.g., '1999-01-01'."),
  googleSearchResults: z
    .array(z.string())
    .describe('Search results relevant to the company legitimacy.'),
  redditSearchResults: z
    .array(z.string())
    .describe('Reddit discussions about legitimacy or scams.'),
});
export type ScamJobAnalysisInput = z.infer<typeof ScamJobAnalysisInputSchema>;

const ScamJobAnalysisOutputSchema = z.object({
  legitimacyScore: z
    .number()
    .min(0)
    .max(100)
    .describe('A score from 0 to 100, where 0 is a definite scam.'),
  classification: z
    .enum(['scam', 'legitimate', 'suspicious'])
    .describe("Verdict: 'scam', 'legitimate', or 'suspicious'."),
  confidence: z
    .number()
    .min(0)
    .max(100)
    .describe('Confidence level in this classification.'),
  reasoning: z.string().describe('Detailed explanation of factors and red flags.'),
});
export type ScamJobAnalysisOutput = z.infer<typeof ScamJobAnalysisOutputSchema>;

/**
 * Waits for a given number of milliseconds.
 */
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Analyzes a job posting for legitimacy using AI.
 * Automatically retries on 429 rate limit errors with exponential backoff.
 */
export async function scamJobAnalysis(input: ScamJobAnalysisInput): Promise<ScamJobAnalysisOutput> {
  const maxRetries = 4;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      return await scamJobAnalysisFlow(input);
    } catch (error: any) {
      const errorMessage = error.message || '';
      const isRateLimit = errorMessage.includes('429') || 
                         errorMessage.includes('RESOURCE_EXHAUSTED') || 
                         errorMessage.includes('Too Many Requests');

      // Handle 429 Rate Limit - retry with exponential backoff
      if (isRateLimit) {
        attempt++;
        if (attempt <= maxRetries) {
          // Exponential backoff: 10s, 20s, 40s, 80s...
          const delaySeconds = Math.pow(2, attempt - 1) * 10; 
          console.log(`Rate limit hit. Retrying in ${delaySeconds} seconds... (Attempt ${attempt}/${maxRetries})`);
          await wait(delaySeconds * 1000);
          continue;
        }
        throw new Error(
          `AI Rate Limit: The free tier of Gemini is currently overloaded. Please wait a minute and try again.`
        );
      }

      // Handle 404 Model Not Found
      if (errorMessage.includes('404')) {
        throw new Error(
          `AI Model Error: "gemini-2.0-flash-lite" is not accessible. This may be a regional restriction.`
        );
      }

      // Handle 401/403 Auth Issues
      if (errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('API_KEY')) {
        throw new Error(
          'AI Auth Error: Your GOOGLE_GENAI_API_KEY is invalid or unauthorized.'
        );
      }

      throw new Error(errorMessage || 'An unexpected error occurred during AI analysis.');
    }
  }

  throw new Error('AI Analysis failed after maximum retries due to rate limits.');
}

const scamJobAnalysisPrompt = ai.definePrompt({
  name: 'scamJobAnalysisPrompt',
  model: 'googleai/gemini-2.0-flash-lite',
  input: { schema: ScamJobAnalysisInputSchema },
  output: { schema: ScamJobAnalysisOutputSchema },
  system: 'You are an expert fraud investigator. Analyze provided data to reach a verdict on job legitimacy.',
  prompt: `Analyze the following job posting for legitimacy:

Job: {{{jobTitle}}} at {{{companyName}}}
URL: {{{jobUrl}}}
Site Created: {{{websiteCreationDate}}}

Description: 
{{{jobDescription}}}

Cross-Reference:
Google: {{#each googleSearchResults}}- {{{this}}} {{/each}}
Reddit: {{#each redditSearchResults}}- {{{this}}} {{/each}}

Analyze for red flags like unusually high pay, messaging-only interviews, or very new domains. Provide a score (0-100), classification, and reasoning.`,
});

const scamJobAnalysisFlow = ai.defineFlow(
  {
    name: 'scamJobAnalysisFlow',
    inputSchema: ScamJobAnalysisInputSchema,
    outputSchema: ScamJobAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await scamJobAnalysisPrompt(input);
    if (!output) {
      throw new Error('The AI model failed to produce a valid analysis.');
    }
    return output;
  }
);
