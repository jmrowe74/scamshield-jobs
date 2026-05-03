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
  websiteCreatedAt: z
    .string()
    .optional()
    .describe("The creation date of the job posting's website, e.g., '1999-01-01'."),
  googleSearchResults: z
    .array(z.string())
    .optional()
    .describe('Search results relevant to the company legitimacy.'),
  redditSearchResults: z
    .array(z.string())
    .optional()
    .describe('Reddit discussions about legitimacy or scams.'),
});

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

/**
 * Waits for a given number of milliseconds.
 */
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Analyzes a job posting for legitimacy using AI.
 * Automatically retries on rate limit errors with exponential backoff.
 */
export async function scamJobAnalysis(input: any): Promise<any> {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      // We call the prompt directly to reduce overhead in server actions
      const { output } = await scamJobAnalysisPrompt(input);
      
      if (!output) {
        throw new Error('The AI model returned an empty response.');
      }
      
      return output;
    } catch (error: any) {
      const errorMessage = error.message || '';
      console.error(`AI Analysis Attempt ${attempt + 1} failed:`, errorMessage);

      const isRateLimit = 
        errorMessage.includes('429') || 
        errorMessage.includes('RESOURCE_EXHAUSTED') || 
        errorMessage.includes('quota');

      if (isRateLimit && attempt < maxRetries) {
        attempt++;
        const delaySeconds = Math.pow(2, attempt) * 2;
        console.log(`Rate limit hit. Retrying in ${delaySeconds} seconds...`);
        await wait(delaySeconds * 1000);
        continue;
      }

      // Re-throw if it's not a rate limit or we've exhausted retries
      throw new Error(`AI Analysis Error: ${errorMessage || 'An unexpected error occurred.'}`);
    }
  }

  throw new Error('AI Analysis failed after multiple retries due to persistent rate limits.');
}

const scamJobAnalysisPrompt = ai.definePrompt({
  name: 'scamJobAnalysisPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: ScamJobAnalysisInputSchema },
  output: { schema: ScamJobAnalysisOutputSchema },
  system: 'You are an expert fraud investigator. Analyze provided data to reach a verdict on job legitimacy. Be thorough and search for common patterns used by scammers.',
  prompt: `Analyze the following job posting for legitimacy:

Job Title: {{{jobTitle}}}
Company: {{{companyName}}}
Link: {{{jobUrl}}}
Domain Created: {{{websiteCreatedAt}}}

Job Description: 
{{{jobDescription}}}

{{#if googleSearchResults}}
External Intelligence (Google):
{{#each googleSearchResults}}* {{{this}}} {{/each}}
{{/if}}

{{#if redditSearchResults}}
Reddit Findings:
{{#each redditSearchResults}}* {{{this}}} {{/each}}
{{/if}}

Identify red flags such as Telegram/WhatsApp-only interviews or high pay for unskilled work.
Provide a legitimacy score (0-100), classification, and reasoning.`,
});