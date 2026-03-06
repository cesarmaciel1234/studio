/**
 * @fileOverview This file contains the internal knowledge base for RutaRápida.
 * This data is used by the RAG (Retrieval-Augmented Generation) system to answer driver questions.
 */

export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  keywords: string[];
}

export const knowledgeBase: KnowledgeArticle[] = [
  {
    id: 'protocol-no-customer',
    title: 'Protocolo: Cliente Ausente',
    content: 'Si el cliente no se encuentra en el domicilio, el conductor debe seguir estos pasos: 1. Intentar contactar al cliente por teléfono usando el botón de llamada en la app. 2. Si no hay respuesta, enviar un mensaje a través del chat de la app. 3. Esperar en el lugar por un máximo de 10 minutos. 4. Si el cliente no aparece, marcar el pedido como "Problema" en la app y contactar a la central para recibir instrucciones sobre cómo proceder con el paquete. Nunca dejar el paquete con un vecino sin autorización explícita de la central.',
    keywords: ['cliente ausente', 'no está', 'no responde', 'dejar paquete', 'vecino'],
  },
  {
    id: 'protocol-vehicle-issue',
    title: 'Protocolo: Problema con el Vehículo',
    content: 'En caso de un problema mecánico con la moto o el auto: 1. Priorizar la seguridad personal y estacionar en un lugar seguro. 2. Activar la alerta "SOS" en la app para notificar a la central inmediatamente. 3. Usar el menú de emergencia para solicitar asistencia mecánica. 4. La central se comunicará para coordinar el reasignamiento de los pedidos pendientes y la asistencia.',
    keywords: ['moto', 'auto', 'vehículo', 'problema', 'avería', 'falla', 'mecánico', 'grúa'],
  },
  {
    id: 'protocol-restricted-zone',
    title: 'Protocolo: Zonas Restringidas',
    content: 'Las entregas en zonas con horarios restringidos (ej. microcentro, barrios privados) deben realizarse estrictamente dentro de la ventana horaria permitida. Estas ventanas se especifican en los detalles del pedido. Si llegas fuera de horario, no intentes ingresar. Contacta a la central a través del chat para reprogramar la entrega. Los intentos de entrega fuera de horario pueden resultar en multas para la empresa.',
    keywords: ['zona restringida', 'horario', 'microcentro', 'barrio privado', 'permiso'],
  },
  {
    id: 'payment-cash',
    title: 'Manejo de Pagos en Efectivo',
    content: 'RutaRápida opera principalmente con pagos electrónicos. Sin embargo, en casos excepcionales, un pedido puede ser con "pago en destino". Esto estará claramente indicado en la orden. El conductor debe cobrar el monto exacto. Al final del día, el total de efectivo recolectado debe ser rendido en la central. No se permite dar cambio; el cliente debe tener el monto justo.',
    keywords: ['pago', 'efectivo', 'cobrar', 'dinero', 'cambio', 'vuelto'],
  },
];
