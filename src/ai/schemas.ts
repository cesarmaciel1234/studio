import { z } from 'genkit';

/**
 * Esquema para un mensaje individual en el historial de chat.
 */
export const CapoMessageSchema = z.object({
  role: z.enum(['user', 'model']).describe('El rol del emisor del mensaje.'),
  text: z.string().describe('El contenido textual del mensaje.'),
});

/**
 * Esquema de entrada para el asistente Capo.
 */
export const DriverCapoInputSchema = z.object({
  driverId: z.string().describe('ID único del conductor.'),
  driverName: z.string().describe('Nombre del conductor.'),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string().optional(),
  }).describe('Ubicación actual del conductor.'),
  activeOrders: z.array(z.object({
    id: z.string(),
    status: z.string(),
    destination: z.string(),
  })).describe('Lista de pedidos activos asignados.'),
  chatHistory: z.array(CapoMessageSchema).describe('Historial de la conversación actual.'),
  userInput: z.string().describe('El mensaje o comando de voz del usuario.'),
});

/**
 * Esquema de salida para el asistente Capo.
 */
export const DriverCapoOutputSchema = z.object({
  responseText: z.string().describe('La respuesta textual de Capo.'),
  transcription: z.string().optional().describe('Transcripción si la entrada fue por voz.'),
  audioUrl: z.string().optional().describe('URL del audio generado (TTS) para la respuesta.'),
  imageUrl: z.string().optional().describe('URL de una imagen generada si es relevante.'),
});

export type DriverCapoInput = z.infer<typeof DriverCapoInputSchema>;
export type DriverCapoOutput = z.infer<typeof DriverCapoOutputSchema>;
export type CapoMessage = z.infer<typeof CapoMessageSchema>;
