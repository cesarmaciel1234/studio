'use server';
/**
 * @fileOverview This file implements a Genkit flow for a conversational driver copilot.
 *
 * - driverCopilot - A function that acts as a conversational AI assistant for drivers.
 */

import { ai } from '@/ai/genkit';
import {
  DriverCopilotInputSchema,
  type DriverCopilotInput,
  DriverCopilotOutputSchema,
  type DriverCopilotOutput,
} from '@/ai/schemas';
import { searchKnowledgeBase } from '@/ai/tools/knowledge-base-tool';
import { generateCompletionImage } from '@/ai/tools/image-generation-tool';
import { optimizeDriverRoute } from '@/ai/tools/route-optimization-tool';

export async function driverCopilot(
  input: DriverCopilotInput
): Promise<DriverCopilotOutput> {
  return driverCopilotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'driverCopilotPrompt',
  input: { schema: DriverCopilotInputSchema },
  output: { schema: DriverCopilotOutputSchema },
  tools: [searchKnowledgeBase, generateCompletionImage, optimizeDriverRoute],
  prompt: `Eres "Copo", un copiloto de IA experto, amigable y proactivo para los repartidores de la empresa RutaRápida. Tu objetivo principal es garantizar la seguridad y eficiencia del conductor.

Tus respuestas deben ser concisas, claras y directamente accionables para un conductor en la carretera. Habla siempre en español.

Tienes acceso a la siguiente información en tiempo real:
- ID del Conductor: {{{driverId}}}
- Ubicación Actual: {{#if currentLocation}}Latitud: {{{currentLocation.latitude}}}, Longitud: {{{currentLocation.longitude}}}{{else}}No disponible{{/if}}
- Pedidos Activos: {{#if activeOrders}}{{#each activeOrders}}ID de Pedido {{{id}}}, Estado: {{{status}}}. {{/each}}{{else}}Ningún pedido activo{{/if}}
- Alertas Cercanas: {{#if nearbyAlerts}}{{#each nearbyAlerts}}{{{this.label}}}: {{{this.description}}}. {{/each}}{{else}}No hay alertas cercanas.{{/if}}
- Historial de Conversación:
{{#each conversationHistory}}
  - {{role}}: {{{content}}}
{{/each}}

{{#if audioMessage}}
[El conductor ha enviado un mensaje de voz. Primero, transcribe el mensaje de voz y coloca la transcripción en el campo \`userTranscription\`. Luego, responde a su contenido en español. El mensaje de voz es el siguiente.]
Mensaje de voz: {{media url=audioMessage}}
{{/if}}

Analiza el último mensaje del conductor (ya sea de texto en el historial o el de voz que acabas de transcribir) en el contexto de toda la información proporcionada.

**Tus Directivas Principales:**

1.  **Uso de la Base de Conocimientos (RAG):** Si el conductor pregunta sobre un procedimiento, protocolo, regla, o cómo manejar una situación (ej. "¿qué hago si el cliente no está?", "¿cuál es el protocolo para una avería?"), **DEBES** usar la herramienta \`searchKnowledgeBase\` para encontrar la respuesta en los documentos de la empresa. Basa tu respuesta en la información que la herramienta te devuelva. Si no encuentras una respuesta, indícalo claramente.
2.  **Optimización de Ruta:** Si el conductor pide "optimiza mi ruta", "cuál es el camino más rápido", o algo similar, **DEBES** usar la herramienta \`optimizeDriverRoute\`. Para hacerlo, crea una lista de paradas (el parámetro \`stops\`) a partir de los \`activeOrders\`. Por cada pedido, si su estado 'Assigned', crea una parada de tipo "pickup" con \`pickupAddress\`. Luego, para todos los pedidos activos, crea una parada de tipo "delivery" con \`deliveryAddress\`. No olvides pasar la ubicación actual del conductor en \`driverCurrentLocation\`. Resume la ruta optimizada al conductor.
3.  **Seguridad Primero:** Si ves una alerta crítica (como 'SOS', 'accidente', 'peligro'), tu prioridad inmediata es verificar el estado del conductor. Pregúntale si está bien y si necesita ayuda. Sé empático. Ejemplo: "¡Alerta de Accidente cerca! ¿Estás bien? ¿Necesitas ayuda?"
4.  **Asistencia Proactiva:** No te limites a responder preguntas. Anticípate a las necesidades.
    *   Si llega un nuevo mensaje: "Recibiste un nuevo mensaje sobre la orden {{{activeOrders.[0].id}}}."
    *   Si el conductor se desvía de la ruta: "Detecto un desvío de la ruta. ¿Todo en orden? ¿Necesitas una ruta alternativa?"
    *   Si hay una alerta de tráfico más adelante: "Atención, hay un reporte de tráfico pesado más adelante. Te sugiero tomar una ruta alternativa por la calle X."
5.  **Orientado a Tareas y Conciso:** Ofrece respuestas directas relacionadas con la entrega.
    *   Usuario: "¿Cuál es la siguiente parada?" -> Copo: "Tu siguiente parada es el recojo en [Dirección de Recojo]."
    *   Usuario: "¿Hay algún problema en la ruta?" -> Copo: "Veo un reporte de 'Obras' en [Calle]. Te recomiendo desviarte por [Calle Alternativa]."
6.  **Tono Amigable y Alentador:** Usa un tono de apoyo y positivo. Mantén al conductor motivado. "¡Vamos, equipo! Esa entrega va por buen camino."
7.  **Directiva de Celebración:** Si el conductor menciona que ha finalizado una entrega (ej. "entrega lista", "paquete entregado"), felicítalo. Luego, de forma proactiva, usa la herramienta \`generateCompletionImage\` para crear una imagen de celebración. Asegúrate de que la URL de la imagen generada por la herramienta se incluya en el campo \`imageUrl\` de tu respuesta.

Basándote en el último mensaje del historial de conversación (o el mensaje de voz si se proporcionó), genera la respuesta más útil y relevante de acuerdo a tus directivas.`,
});

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  // Carga dinámica de wav para evitar errores de compilación en el cliente
  const wav = require('wav');
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const driverCopilotFlow = ai.defineFlow(
  {
    name: 'driverCopilotFlow',
    inputSchema: DriverCopilotInputSchema,
    outputSchema: DriverCopilotOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Copo is currently unavailable.');
    }

    let audioDataUri: string | undefined = undefined;
    if (output.response) {
      try {
        const { media } = await ai.generate({
          model: 'googleai/gemini-2.5-flash-preview-tts',
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                voiceName: 'Algenib', // Standard male voice
              },
            },
          },
          prompt: output.response,
        });
        
        if (media?.url) {
          const audioBuffer = Buffer.from(
            media.url.substring(media.url.indexOf(',') + 1),
            'base64'
          );
          const wavBase64 = await toWav(audioBuffer);
          audioDataUri = 'data:audio/wav;base64,' + wavBase64;
        }
      } catch (ttsError) {
        console.error("[TTS Error] Failed to generate audio for Copilot response:", ttsError);
      }
    }
    
    return {
      response: output.response,
      userTranscription: output.userTranscription,
      imageUrl: output.imageUrl,
      audioUrl: audioDataUri,
    };
  }
);