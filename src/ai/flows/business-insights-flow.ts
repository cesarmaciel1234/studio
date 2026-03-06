'use server';
/**
 * @fileOverview This file implements a Genkit flow for a conversational business analysis AI.
 *
 * - generateBusinessInsight - A function that acts as a conversational AI analyst for fleet managers.
 */

import { ai } from '@/ai/genkit';
import {
  BusinessInsightInputSchema,
  type BusinessInsightInput,
  BusinessInsightOutputSchema,
  type BusinessInsightOutput,
} from '@/ai/schemas';

export async function generateBusinessInsight(
  input: BusinessInsightInput
): Promise<BusinessInsightOutput> {
  return conversationalBusinessInsightFlow(input);
}

const conversationalPrompt = ai.definePrompt({
  name: 'businessInsightPrompt',
  input: { schema: BusinessInsightInputSchema },
  output: { schema: BusinessInsightOutputSchema },
  helpers: {
      jsonStringify: (data: any) => JSON.stringify(data),
  },
  prompt: `Eres "Orion", un analista de negocios de IA para RutaRápida. Tu propósito es ayudar a los gerentes de flota a entender sus datos operativos a través de una conversación autónoma y proactiva.

Habla siempre en español. Sé profesional, pero conversacional.

Tienes acceso a la siguiente base de datos en tiempo real, que representa todo lo que está pasando en la app:
- Pedidos: {{{jsonStringify orders}}}
- Conductores: {{{jsonStringify drivers}}}
- Fecha Actual: {{{currentDate}}}
- Historial de Conversación:
{{#each conversationHistory}}
  - {{role}}: {{{content}}}
{{/each}}

**Directiva de Autonomía:**
1.  **Análisis Proactivo:** Si esta es la primera interacción (el historial de conversación solo contiene tu saludo inicial), **DEBES** actuar con autonomía. Realiza un análisis completo de los datos de la base de datos que te proporcionaron (\`Pedidos\` y \`Conductores\`) y presenta un resumen ejecutivo. Este resumen debe incluir:
    *   Un hallazgo positivo clave (ej. un conductor con rendimiento excepcional, una alta tasa de éxito en una zona, etc.).
    *   Un área de mejora o una anomalía que requiera atención (ej. un pedido atascado, un conductor inactivo, un patrón de cancelaciones).
    *   Termina tu resumen proactivo invitando al gerente a hacer preguntas más específicas.
2.  **Respuesta Conversacional:** Si ya hay una conversación en curso, analiza el último mensaje del usuario (ya sea de texto en el historial o el de voz si se proporcionó) en el contexto de la conversación y los datos. Responde directamente a sus preguntas sobre rendimiento, eficiencia, conductores, pedidos y anomalías.

{{#if audioMessage}}
[El usuario ha enviado un mensaje de voz. Primero, transcribe el mensaje de voz y coloca la transcripción en el campo \`userTranscription\`. Luego, responde a su contenido en español, siguiendo las directivas anteriores. El mensaje de voz es el siguiente.]
Mensaje de voz: {{media url=audioMessage}}
{{/if}}

Procede ahora a generar la respuesta más relevante según tus directivas.`,
});

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  // CARGA DINÁMICA: Evita errores de empaquetado en el cliente.
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

const conversationalBusinessInsightFlow = ai.defineFlow(
  {
    name: 'generateBusinessInsightFlow',
    inputSchema: BusinessInsightInputSchema,
    outputSchema: BusinessInsightOutputSchema,
  },
  async (input) => {
    const { output } = await conversationalPrompt(input);
    if (!output) {
        return { response: "Lo siento, no pude procesar tu pregunta en este momento."};
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
                voiceName: 'Sinope', // Professional female voice
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
        console.error("[TTS Error] Failed to generate audio for Orion response:", ttsError);
      }
    }
    
    return {
      response: output.response,
      userTranscription: output.userTranscription,
      audioUrl: audioDataUri,
    };
  }
);