
'use server';
import { ai } from '@/ai/genkit';
import { driverRouteOptimization } from '@/ai/flows/driver-route-optimization-flow';
import { DriverRouteOptimizationInputSchema, DriverRouteOptimizationOutputSchema } from '@/ai/schemas';

export const optimizeDriverRoute = ai.defineTool(
  {
    name: 'optimizeDriverRoute',
    description: 'Calcula y optimiza la ruta de entrega de un conductor basándose en su ubicación actual y una lista de paradas. Úsalo cuando el conductor pregunte por la ruta más rápida, cómo optimizar su día o una guía paso a paso para sus entregas.',
    inputSchema: DriverRouteOptimizationInputSchema,
    outputSchema: DriverRouteOptimizationOutputSchema,
  },
  async (input) => {
    // This tool simply acts as a wrapper to make the existing flow tool-callable.
    return await driverRouteOptimization(input);
  }
);
