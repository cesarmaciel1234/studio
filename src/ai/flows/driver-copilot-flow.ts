'use server';

import { ai } from '@/ai/genkit';
import { 
  DriverCapoInputSchema, 
  DriverCapoOutputSchema 
} from '@/ai/schemas';
import { z } from 'genkit';

/**
 * Herramienta para buscar en la base de conocimientos de logística.
 */
const searchKnowledgeBase = ai.defineTool(
  {
    name: 'searchKnowledgeBase',
    description: 'Busca información sobre protocolos, rutas frecuentes o ayuda técnica.',
    inputSchema: z.object({ query: z.string() }),
    outputSchema: z.string(),
  },
  async (input) => {
    // Simulación de búsqueda en base de conocimientos
    return `Resultado para "${input.query}": Los protocolos de entrega express sugieren contacto telefónico previo.`;
  }
);

/**
 * Herramienta para optimizar la ruta actual del conductor.
 */
const optimizeDriverRoute = ai.defineTool(
  {
    name: 'optimizeDriverRoute',
    description: 'Calcula y sugiere la mejor ruta basada en el tráfico y pedidos actuales.',
    inputSchema: z.object({ driverId: z.string() }),
    outputSchema: z.object({
      suggestion: z.string(),
      estimatedTimeSaved: z.number(),
    }),
  },
  async (input) => {
    return {
      suggestion: 'Toma la lateral de Av. Reforma para evitar el cierre por obras en el centro.',
      estimatedTimeSaved: 12,
    };
  }
);

/**
 * Prompt principal del sistema para Capo.
 */
const capoPrompt = ai.definePrompt({
  name: 'capoPrompt',
  input: { schema: DriverCapoInputSchema },
  output: { schema: DriverCapoOutputSchema },
  tools: [searchKnowledgeBase, optimizeDriverRoute],
  prompt: `Eres Capo, el asistente inteligente de RutaRápida Pro. 
Tu personalidad es amigable, profesional y extremadamente proactiva.
Tu misión es ayudar a {{driverName}} (ID: {{driverId}}) a completar sus entregas de forma eficiente y segura.

Información actual:
- Ubicación: {{location.lat}}, {{location.lng}} ({{location.address}})
- Pedidos activos: {{#each activeOrders}}- {{id}}: {{status}} hacia {{destination}} {{/each}}

Usa las herramientas disponibles si necesitas optimizar rutas o buscar información técnica.
Responde siempre en español, de forma concisa y directa.

Historial de chat:
{{#each chatHistory}}
{{role}}: {{text}}
{{/each}}

Usuario: {{userInput}}`,
});

/**
 * Flujo principal de Capo.
 */
export const driverCapo = ai.defineFlow(
  {
    name: 'driverCapo',
    inputSchema: DriverCapoInputSchema,
    outputSchema: DriverCapoOutputSchema,
  },
  async (input) => {
    const { output } = await capoPrompt(input);
    
    if (!output) {
      throw new Error('No se pudo generar una respuesta de Capo.');
    }

    // Aquí se podría integrar lógica de TTS si fuera necesario
    // Por ahora devolvemos el objeto de salida estructurado
    return output;
  }
);
