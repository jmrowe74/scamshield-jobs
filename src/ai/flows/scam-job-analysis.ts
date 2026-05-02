'use server';
/**
 * @fileOverview A Genkit flow for analyzing job postings to determine their legitimacy.
 *
 * - scamJobAnalysis - A function that handles the job scam analysis process.
 * - ScamJobAnalysisInput - The input type for the scamJobAnalysis function.
 * - ScamJobAnalysisOutput - The return type for the scamJobAnalysis function.
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
    .describe(
      "The creation date of the job posting's website obtained from a WHOIS lookup, e.g., '1999-01-01'."
    ),
  googleSearchResults: z
    .array(z.string())
    .describe('Top search results from Google for the company name, relevant to its legitimacy.'),
  redditSearchResults: z
    .array(z.string())
    .describe('Top search results from Reddit for the company name, looking for discussions about legitimacy or scams.'),
});
export type ScamJobAnalysisInput = z.infer<typeof ScamJobAnalysisInputSchema>;

const ScamJobAnalysisOutputSchema = z.object({
  legitimacyScore: z
    .number()
    .min(0)
    .max(100)
    .describe('A score from 0 to 100, where 100 is completely legitimate and 0 is a definite scam.'),
  classification: z
    .enum(['scam', 'legitimate', 'suspicious'])
    .describe("The classification of the job posting: 'scam', 'legitimate', or 'suspicious'."),
  confidence: z
    .number()
    .min(0)
    .max(100)
    .describe('The AI confidence level in this classification, from 0 to 100.'),
  reasoning: z.string().describe('A detailed explanation for the legitimacy score and classification, highlighting key factors and red flags.'),
});
export type ScamJobAnalysisOutput = z.infer<typeof ScamJobAnalysisOutputSchema>;

export async function scamJobAnalysis(input: ScamJobAnalysisInput): Promise<ScamJobAnalysisOutput> {
  try {
    const result = await scamJobAnalysisFlow(input);
    return result;
  } catch (error: any) {
    console.error('Genkit Flow Error:', error);
    // Provide more helpful feedback for common API errors
    if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('400')) {
      throw new Error('AI Configuration Error: Please ensure your Google AI API Key is correctly configured in the project settings.');
    }
    if (error.message?.includes('404')) {
      throw new Error('AI Model Error: The requested AI model was not found. Please try again later or check the model configuration.');
    }
    throw new Error(error.message || 'An unexpected error occurred during AI analysis.');
  }
}

const scamJobAnalysisPrompt = ai.definePrompt({
  name: 'scamJobAnalysisPrompt',
  input: { schema: ScamJobAnalysisInputSchema },
  output: { schema: ScamJobAnalysisOutputSchema },
  prompt: `You are an expert in identifying fraudulent job postings. Your task is to analyze the provided job details, company information, website creation date, and search results to determine the legitimacy of a job posting. 

Provide a legitimacy score from 0-100 (100 being legitimate), a classification ('scam', 'legitimate', or 'suspicious'), a confidence score (0-100) representing how sure you are of this verdict, and a detailed reasoning.

Job Title: {{{jobTitle}}}
Job Description: {{{jobDescription}}}
Company Name: {{{companyName}}}
Job URL: {{{jobUrl}}}

Website Creation Date (from WHOIS): {{{websiteCreationDate}}}

Google Search Results for "{{{companyName}}}":
{{#if googleSearchResults}}
  {{#each googleSearchResults}}
- {{{this}}}
  {{/each}}
{{else}}
  No Google search results found.
{{/if}}

Reddit Search Results for "{{{companyName}}}":
{{#if redditSearchResults}}
  {{#each redditSearchResults}}
- {{{this}}}
  {{/each}}
{{else}}
  No Reddit search results found.
{{/if}}

Based on all the information above, determine the legitimacy of this job posting. Focus on inconsistencies, lack of information, suspicious website creation dates (especially very recent ones for established companies), negative reviews, or any other red flags from the search results. Provide your analysis in the specified JSON format.`,
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
      throw new Error('Failed to get output from AI model.');
    }
    return output;
  }
);
