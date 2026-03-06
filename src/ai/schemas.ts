import { z } from 'genkit';

// Schemas for driver-route-optimization-flow.ts
const LocationSchema = z.object({
  latitude: z.number().describe('The latitude of the location.'),
  longitude: z.number().describe('The longitude of the location.'),
});

const StopSchema = z.object({
  address: z.string().describe('The full address of the stop.'),
  type: z.enum(['pickup', 'delivery']).describe('The type of stop (pickup or delivery).'),
  timeWindowStart: z.string().optional().describe('Optional start time of the delivery/pickup window (ISO 8601 format).'),
  timeWindowEnd: z.string().optional().describe('Optional end time of the delivery/pickup window (ISO 8601 format).'),
  orderId: z.string().describe('The ID of the order associated with this stop.'),
});

export const DriverRouteOptimizationInputSchema = z.object({
  driverCurrentLocation: LocationSchema.describe('The current geographic location of the driver.'),
  stops: z.array(StopSchema).describe('An array of all assigned delivery and pickup stops.'),
  currentTrafficConditions: z.string().optional().describe('Optional description of current traffic conditions (e.g., "heavy traffic on main roads").'),
});
export type DriverRouteOptimizationInput = z.infer<typeof DriverRouteOptimizationInputSchema>;

const OptimizedStopSchema = z.object({
  address: z.string().describe('The full address of the stop.'),
  type: z.enum(['pickup', 'delivery']).describe('The type of stop (pickup or delivery).'),
  orderId: z.string().describe('The ID of the order associated with this stop.'),
  estimatedArrivalTime: z.string().optional().describe('The estimated arrival time at this stop (ISO 8601 format).'),
  estimatedTravelDurationFromPrevious: z.number().optional().describe('Estimated travel duration from the previous stop in minutes.'),
});

export const DriverRouteOptimizationOutputSchema = z.object({
  optimizedRoute: z.array(OptimizedStopSchema).describe('An ordered list of stops representing the most efficient route.'),
  totalEstimatedDuration: z.number().describe('The total estimated duration of the entire optimized route in minutes.'),
  totalEstimatedDistance: z.number().describe('The total estimated distance of the entire optimized route in kilometers.'),
  routeInstructions: z.array(z.string()).describe('Step-by-step navigation instructions for the optimized route.'),
});
export type DriverRouteOptimizationOutput = z.infer<typeof DriverRouteOptimizationOutputSchema>;


// Schemas for business-insights-flow.ts
const OrderSchema = z.object({
  id: z.string(),
  status: z.string(),
  driverId: z.string().optional(),
  offeredPrice: z.number().optional(),
  actualDeliveryTime: z.string().optional(),
  estimatedDeliveryTime: z.string().optional(),
  createdAt: z.string(),
  pickupAddress: z.string().optional().describe('The address for picking up the order package.'),
  deliveryAddress: z.string().optional(),
});

const DriverSchema = z.object({
  id: z.string(),
  firstName: z.string().optional(),
  rating: z.number().optional(),
  totalDeliveries: z.number().optional(),
  availabilityStatus: z.string().optional(),
});

export const BusinessMessageSchema = z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
});
export type BusinessMessage = z.infer<typeof BusinessMessageSchema>;


export const BusinessInsightInputSchema = z.object({
  orders: z.array(OrderSchema).describe('A list of all orders for the period.'),
  drivers: z.array(DriverSchema).describe('A list of all available drivers.'),
  currentDate: z.string().describe('The current date for context.'),
  conversationHistory: z.array(BusinessMessageSchema).describe('The history of the conversation between the manager and the AI.'),
  audioMessage: z.string().optional().describe("The user's voice message as an audio data URI (e.g., 'data:audio/webm;base64,...').")
});
export type BusinessInsightInput = z.infer<typeof BusinessInsightInputSchema>;

export const BusinessInsightOutputSchema = z.object({
  response: z.string().describe("The AI business analyst's next response in the conversation."),
  userTranscription: z.string().optional().describe("The transcription of the user's audio message, if one was provided."),
  audioUrl: z.string().optional().describe("A data URI for the generated audio response to be played automatically."),
});
export type BusinessInsightOutput = z.infer<typeof BusinessInsightOutputSchema>;


// Schemas for driver-copilot-flow.ts
const CopilotMessageSchema = z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
    imageUrl: z.string().optional().describe("An optional data URI for a generated image to display in the chat."),
});
export type CopilotMessage = z.infer<typeof CopilotMessageSchema>;

export const DriverCopilotInputSchema = z.object({
  driverId: z.string().describe('The unique ID of the driver.'),
  currentLocation: LocationSchema.optional().describe("The driver's current real-time GPS location."),
  activeOrders: z.array(OrderSchema).optional().describe('A list of the current active orders the driver is handling.'),
  nearbyAlerts: z.array(z.any()).optional().describe('An array of any nearby traffic, safety, or police alerts.'),
  conversationHistory: z.array(CopilotMessageSchema).describe('The history of the conversation between the driver and the copilot.'),
  audioMessage: z.string().optional().describe("The user's voice message as an audio data URI (e.g., 'data:audio/webm;base64,...').")
});
export type DriverCopilotInput = z.infer<typeof DriverCopilotInputSchema>;

export const DriverCopilotOutputSchema = z.object({
  response: z.string().describe("The AI copilot's next response in the conversation."),
  userTranscription: z.string().optional().describe("The transcription of the user's audio message, if one was provided."),
  imageUrl: z.string().optional().describe("A data URI for a generated image to be displayed to the user."),
  audioUrl: z.string().optional().describe("A data URI for the generated audio response to be played automatically."),
});
export type DriverCopilotOutput = z.infer<typeof DriverCopilotOutputSchema>;
