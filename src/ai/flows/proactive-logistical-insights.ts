'use server';
/**
 * @fileOverview This file implements a Genkit flow for providing proactive logistical insights.
 *
 * - proactiveLogisticalInsights - A function that analyzes real-time fleet data and generates actionable notifications or suggestions.
 * - ProactiveLogisticalInsightsInput - The input type for the proactiveLogisticalInsights function.
 * - ProactiveLogisticalInsightsOutput - The return type for the proactiveLogisticalInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProactiveLogisticalInsightsInputSchema = z.object({
  realtimeFleetData: z
    .string()
    .describe(
      'A comprehensive summary of real-time fleet data, including current traffic conditions, driver locations, delivery statuses, scheduled routes, potential delays, and any other relevant logistical information. This data will be analyzed to identify potential issues or optimization opportunities.'
    ),
});
export type ProactiveLogisticalInsightsInput = z.infer<
  typeof ProactiveLogisticalInsightsInputSchema
>;

const ProactiveLogisticalInsightsOutputSchema = z.object({
  hasIssuesOrOptimizations: z
    .boolean()
    .describe(
      'True if the analysis identified any potential issues, delays, or opportunities for optimization; otherwise, false.'
    ),
  insights: z
    .array(z.string())
    .describe(
      'A list of concise, actionable notifications or suggestions based on the analyzed fleet data, such as "Route 123 experiencing heavy traffic, suggest rerouting through Elm Street" or "Driver John is ahead of schedule, consider reassigning delivery 456".'
    ),
});
export type ProactiveLogisticalInsightsOutput = z.infer<
  typeof ProactiveLogisticalInsightsOutputSchema
>;

export async function proactiveLogisticalInsights(
  input: ProactiveLogisticalInsightsInput
): Promise<ProactiveLogisticalInsightsOutput> {
  return proactiveLogisticalInsightsFlow(input);
}

const proactiveLogisticalInsightsPrompt = ai.definePrompt({
  name: 'proactiveLogisticalInsightsPrompt',
  input: {schema: ProactiveLogisticalInsightsInputSchema},
  output: {schema: ProactiveLogisticalInsightsOutputSchema},
  prompt: `You are an AI Copilot named Copo, an intelligent assistant for a fleet manager.
Your task is to analyze real-time fleet data and provide concise, actionable notifications or suggestions for potential issues or optimizations.

Analyze the following real-time fleet data:

Fleet Data Summary:
{{{realtimeFleetData}}}

Based on this data, identify:
1. Any potential issues (e.g., delays, traffic, missed schedules, vehicle breakdowns).
2. Any opportunities for optimization (e.g., rerouting, reassigning tasks, load balancing).

Provide your analysis as a list of actionable insights. Each insight should be a clear, practical suggestion or notification. If no issues or optimizations are found, set hasIssuesOrOptimizations to false and provide an empty list for insights.
`,
});

const proactiveLogisticalInsightsFlow = ai.defineFlow(
  {
    name: 'proactiveLogisticalInsightsFlow',
    inputSchema: ProactiveLogisticalInsightsInputSchema,
    outputSchema: ProactiveLogisticalInsightsOutputSchema,
  },
  async input => {
    const {output} = await proactiveLogisticalInsightsPrompt(input);
    return output!;
  }
);
