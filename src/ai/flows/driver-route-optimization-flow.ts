'use server';
/**
 * @fileOverview This file implements a Genkit flow for optimizing driver delivery routes.
 *
 * - driverRouteOptimization: A function that optimizes a delivery route for a driver.
 */

import { ai } from '@/ai/genkit';
import {
  DriverRouteOptimizationInputSchema,
  type DriverRouteOptimizationInput,
  DriverRouteOptimizationOutputSchema,
  type DriverRouteOptimizationOutput,
} from '@/ai/schemas';

export async function driverRouteOptimization(
  input: DriverRouteOptimizationInput
): Promise<DriverRouteOptimizationOutput> {
  return driverRouteOptimizationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'driverRouteOptimizationPrompt',
  input: { schema: DriverRouteOptimizationInputSchema },
  output: { schema: DriverRouteOptimizationOutputSchema },
  prompt: `You are an expert route optimization assistant for delivery drivers. Your goal is to provide the most efficient and time-saving route for a driver, considering all given stops, current traffic conditions, and any specified time windows.

Here is the driver's current location:
Latitude: {{{driverCurrentLocation.latitude}}}
Longitude: {{{driverCurrentLocation.longitude}}}

Here are the stops the driver needs to make:
{{#each stops}}
- Stop {{math @index "+ 1"}}:
  Address: {{{address}}}
  Type: {{{type}}}
  Order ID: {{{orderId}}}
  {{#if timeWindowStart}}Time Window Start: {{{timeWindowStart}}}{{/if}}
  {{#if timeWindowEnd}}Time Window End: {{{timeWindowEnd}}}{{/if}}
{{/each}}

{{#if currentTrafficConditions}}
Current Traffic Conditions: {{{currentTrafficConditions}}}
{{/if}}

Carefully analyze all stops, their types (pickup or delivery), and any time window constraints. Prioritize meeting time windows and minimizing total travel time and distance.

Generate the optimized route as an ordered list of stops. For each stop in the optimized route, include its address, type, order ID, estimated arrival time, and estimated travel duration from the previous stop.
Provide the total estimated duration of the entire route in minutes and the total estimated distance in kilometers. Finally, provide clear, step-by-step navigation instructions for the optimized route.`,
});

const driverRouteOptimizationFlow = ai.defineFlow(
  {
    name: 'driverRouteOptimizationFlow',
    inputSchema: DriverRouteOptimizationInputSchema,
    outputSchema: DriverRouteOptimizationOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate optimized route.');
    }
    return output;
  }
);
