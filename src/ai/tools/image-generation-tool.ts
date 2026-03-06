/**
 * @fileOverview Implements a Genkit tool for generating celebratory images for drivers.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const generateCompletionImage = ai.defineTool(
  {
    name: 'generateCompletionImage',
    description: 'Genera una imagen de celebración para un conductor que acaba de completar una entrega. Usar cuando el conductor confirme que ha terminado una entrega.',
    inputSchema: z.object({}),
    outputSchema: z.string().describe('The data URI of the generated image.'),
  },
  async () => {
    console.log('[Image Generation Tool] Generating celebration image...');
    
    const { media } = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: 'A fun, celebratory cartoon image for a delivery driver who just successfully completed a delivery. Show a stylized delivery person giving a thumbs-up, with confetti and stars in the background. The style should be cheerful and modern.',
    });
    
    if (!media?.url) {
        throw new Error("Image generation failed to return a media object.");
    }
    
    console.log('[Image Generation Tool] Image generated successfully.');
    return media.url;
  }
);
