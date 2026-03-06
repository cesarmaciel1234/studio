'use server';
/**
 * @fileOverview A Genkit flow for optimizing a driver's route based on stops and traffic.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const RouteStopSchema = z.object({
  address: z.string(),
  type: z.enum(['pickup', 'delivery']),
  orderId: z.string(),
  timeWindowEnd: z.string().optional(),
});

const OptimizedStopSchema = RouteStopSchema.extend({
  estimatedArrivalTime: z.string(),
});

const DriverRouteOptimizationInputSchema = z.object({
  driverCurrentLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  stops: z.array(RouteStopSchema),
  currentTrafficConditions: z.string().optional(),
});

const DriverRouteOptimizationOutputSchema = z.object({
  optimizedRoute: z.array(OptimizedStopSchema),
  totalEstimatedDuration: z.number().describe('Total duration in minutes'),
  totalEstimatedDistance: z.number().describe('Total distance in kilometers'),
  summary: z.string(),
});

export type DriverRouteOptimizationOutput = z.infer<typeof DriverRouteOptimizationOutputSchema>;

export async function driverRouteOptimization(input: z.infer<typeof DriverRouteOptimizationInputSchema>): Promise<DriverRouteOptimizationOutput> {
  return driverRouteOptimizationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'driverRouteOptimizationPrompt',
  input: { schema: DriverRouteOptimizationInputSchema },
  output: { schema: DriverRouteOptimizationOutputSchema },
  prompt: `You are an expert logistics optimizer for RutaRápida Pro.
Analyze the current driver location and the list of stops. 
Optimize the sequence of stops to minimize total travel time and distance, considering any traffic conditions mentioned.

Driver Location: {{driverCurrentLocation.latitude}}, {{driverCurrentLocation.longitude}}
Traffic: {{currentTrafficConditions}}
Stops:
{{#each stops}}
- {{type}} at {{address}} (Order: {{orderId}})
{{/each}}

Provide the optimized route with estimated arrival times for each stop (formatted as ISO strings starting from 'now').
Calculate total duration and distance.`,
});

const driverRouteOptimizationFlow = ai.defineFlow(
  {
    name: 'driverRouteOptimizationFlow',
    inputSchema: DriverRouteOptimizationInputSchema,
    outputSchema: DriverRouteOptimizationOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) throw new Error('Failed to generate optimized route');
    return output;
  }
);
