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
 * Automatically retries on 429 rate limit errors.
 */
export async function scamJobAnalysis(input: ScamJobAnalysisInput): Promise<ScamJobAnalysisOutput> {
  const maxRetries = 2;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      return await scamJobAnalysisFlow(input);
    } catch (error: any) {
      const errorMessage = error.message || '';

      // Handle 429 Rate Limit - retry after delay
      if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
        attempt++;
        if (attempt <= maxRetries) {
          const delaySeconds = attempt * 10; 
          console.log(`Rate limit hit. Retrying in ${delaySeconds} seconds... (Attempt ${attempt}/${maxRetries})`);
          await wait(delaySeconds * 1000);
          continue;
        }
        throw new Error(
          `AI Rate Limit Error: Too many requests. Please wait a minute and try again.`
        );
      }

      // Handle 404 Model Not Found
      if (errorMessage.includes('404')) {
        throw new Error(
          `AI Model Error: The model "gemini-2.0-flash-lite" was not found (404). This usually means the model identifier is incorrect or not yet available in your project's region. Try switching to "gemini-1.5-flash" in scam-job-analysis.ts if this persists.`
        );
      }

      // Handle 401/403 Auth Issues
      if (errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('API_KEY')) {
        throw new Error(
          'AI Authentication Error: Your GOOGLE_GENAI_API_KEY is invalid, unauthorized, or hasn\'t propagated yet. If you just added it to .env, please restart your development server.'
        );
      }

      throw new Error(errorMessage || 'An unexpected error occurred during AI analysis.');
    }
  }

  throw new Error('AI Analysis failed after multiple attempts. Please try again later.');
}

const scamJobAnalysisPrompt = ai.definePrompt({
  name: 'scamJobAnalysisPrompt',
  model: 'googleai/gemini-2.0-flash-lite',
  input: { schema: ScamJobAnalysisInputSchema },
  output: { schema: ScamJobAnalysisOutputSchema },
  system: 'You are an expert fraud investigator specializing in job recruitment scams. Analyze provided cross-reference data to reach a verdict.',
  prompt: `Analyze the following job posting details to determine its legitimacy:

Job Title: {{{jobTitle}}}
Job Description: {{{jobDescription}}}
Company Name: {{{companyName}}}
Job URL: {{{jobUrl}}}
Website Creation Date: {{{websiteCreationDate}}}

Cross-Reference Data:
Google Results:
{{#each googleSearchResults}}
- {{{this}}}
{{/each}}

Reddit Discussions:
{{#each redditSearchResults}}
- {{{this}}}
{{/each}}

Analyze red flags such as:
1. High pay for unskilled work.
2. Direct messaging (Telegram, WhatsApp) for interviews.
3. Website domains created very recently (within weeks).
4. Lack of official corporate social presence.

Provide a legitimacy score (0-100), classification, and clear reasoning for your verdict.`,
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
      throw new Error('The AI model failed to produce a valid legitimacy analysis.');
    }
    return output;
  }
);
