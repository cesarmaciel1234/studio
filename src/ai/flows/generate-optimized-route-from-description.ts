'use server';
/**
 * @fileOverview A Genkit flow for generating an optimized route plan from a natural language description.
 *
 * - generateOptimizedRouteFromDescription - A function that handles the route optimization process from a description.
 * - GenerateOptimizedRouteFromDescriptionInput - The input type for the generateOptimizedRouteFromDescription function.
 * - GenerateOptimizedRouteFromDescriptionOutput - The return type for the generateOptimizedRouteFromDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateOptimizedRouteFromDescriptionInputSchema = z.object({
  description: z
    .string()
    .describe(
      'A natural language description of a delivery route, including start, stops, and any preferences (e.g., "shortest time", "avoid highways").'
    ),
});
export type GenerateOptimizedRouteFromDescriptionInput = z.infer<
  typeof GenerateOptimizedRouteFromDescriptionInputSchema
>;

const OptimizedRouteStopSchema = z.object({
  name: z.string().describe('A descriptive name for the stop (e.g., "Warehouse", "Customer A").'),
  address: z.string().describe('The full address of the stop.'),
  order: z.number().describe('The sequential order of this stop in the optimized route, starting from 1.'),
});

const GenerateOptimizedRouteFromDescriptionOutputSchema = z.object({
  routeSummary: z
    .string()
    .describe('A natural language summary of the generated optimized route.'),
  optimizedStops: z
    .array(OptimizedRouteStopSchema)
    .describe('An ordered list of stops in the optimized route.'),
  preferencesConsidered: z
    .array(z.string())
    .describe('A list of logistical preferences considered during optimization (e.g., "shortest time", "avoid highways").'),
});
export type GenerateOptimizedRouteFromDescriptionOutput = z.infer<
  typeof GenerateOptimizedRouteFromDescriptionOutputSchema
>;

export async function generateOptimizedRouteFromDescription(
  input: GenerateOptimizedRouteFromDescriptionInput
): Promise<GenerateOptimizedRouteFromDescriptionOutput> {
  return generateOptimizedRouteFromDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateOptimizedRouteFromDescriptionPrompt',
  input: {schema: GenerateOptimizedRouteFromDescriptionInputSchema},
  output: {schema: GenerateOptimizedRouteFromDescriptionOutputSchema},
  prompt: `You are an intelligent logistics assistant (Copo) specialized in optimizing delivery routes.
Your task is to take a natural language description of a delivery route, identify the start point, all intermediate stops, and any optimization preferences, and then generate a structured, optimized route plan.

Consider factors like typical traffic patterns, logical sequencing of stops to minimize travel time or distance, and any explicit preferences mentioned in the description.
Do NOT generate actual GPS coordinates or call external routing services. Focus solely on interpreting the natural language request and structuring the conceptual route plan.

Description: {{{description}}}

Generate the optimized route plan as a JSON object, adhering strictly to the provided output schema. Ensure 'order' for stops starts at 1.
`,
});

const generateOptimizedRouteFromDescriptionFlow = ai.defineFlow(
  {
    name: 'generateOptimizedRouteFromDescriptionFlow',
    inputSchema: GenerateOptimizedRouteFromDescriptionInputSchema,
    outputSchema: GenerateOptimizedRouteFromDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
