/**
 * @fileOverview Implements a Genkit tool for searching the company's knowledge base.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { knowledgeBase, type KnowledgeArticle } from '@/ai/knowledge-base';

// Define the schema for the tool's output
const KnowledgeSearchResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
});
export type KnowledgeSearchResult = z.infer<typeof KnowledgeSearchResultSchema>;

export const searchKnowledgeBase = ai.defineTool(
  {
    name: 'searchKnowledgeBase',
    description: 'Busca en la base de conocimientos interna de la empresa (protocolos, reglas, procedimientos) para responder preguntas del conductor. Úsalo cuando el conductor pregunte "cómo hacer", "cuál es el protocolo", "qué hago si", o sobre reglas de la empresa.',
    inputSchema: z.object({
      query: z.string().describe('La pregunta o tema que el conductor quiere buscar.'),
    }),
    outputSchema: z.array(KnowledgeSearchResultSchema),
  },
  async (input) => {
    console.log(`[Knowledge Base Tool] Searching for: ${input.query}`);
    const query = input.query.toLowerCase();
    
    // Simple keyword matching search logic. A real app would use embeddings.
    const results = knowledgeBase
      .filter(article => {
        const titleMatch = article.title.toLowerCase().includes(query);
        const contentMatch = article.content.toLowerCase().includes(query);
        const keywordMatch = article.keywords.some(kw => query.includes(kw));
        return titleMatch || contentMatch || keywordMatch;
      })
      .map(({ id, title, content }) => ({ id, title, content })); // Return only the necessary fields
      
    console.log(`[Knowledge Base Tool] Found ${results.length} results.`);
    return results;
  }
);
