import { tool } from '@openai/agents/realtime';

const companyInfo = `RomaTek Fast Facts
------------------
• Founded: 2025 • HQ: Florida, USA • Founder: Nick Romanek
• Mission: Help businesses turn AI ideas into measurable results—fast.
• Core Services:
  1. AI Readiness Assessments (1‑week sprint, fixed price)
  2. Pilot Automations (e.g., MS 365 onboarding bots, Azure OpenAI chatbots)
  3. Managed AI Ops (continuous model tuning & MLOps)

Unique Value
------------
• 70 % average reduction in manual admin time for pilot clients.
• Certified in Azure AI‑102 and Microsoft Solutions Architecture.
• Proven track record in automotive diagnostics, healthcare, and legal SMBs.

FAQs
----
Q: What makes RomaTek different from other consultancies?  
A: We deliver quick‑turn pilots (≤30 days) with transparent pricing, then scale only what works.

Q: Do you build custom LLM apps?  
A: Yes. We specialize in GPT‑4o integrations (chat, embeddings, tool‑calling) and maintain strict data‑privacy controls.

Q: How do I start?  
A: Book a free 30‑minute discovery call at romatekai.com/consult, or email hello@romatekai.com.`;

export const getNextResponseFromSupervisor = tool({
  name: 'getNextResponseFromSupervisor',
  description: 'Get a response from the supervisor agent with access to company information',
  parameters: {
    type: 'object',
    properties: {
      relevantContextFromLastUserMessage: {
        type: 'string',
        description: 'Context from the user\'s last message to help the supervisor provide a relevant response'
      }
    },
    required: ['relevantContextFromLastUserMessage'],
    additionalProperties: false
  },
  execute: async (input) => {
    const { relevantContextFromLastUserMessage } = input as {
      relevantContextFromLastUserMessage: string;
    };

    try {
      const response = await fetch('/api/supervisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ relevantContextFromLastUserMessage }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from supervisor');
      }

      const data = await response.json();
      return { nextResponse: data.nextResponse };
    } catch (error) {
      console.error('Error calling supervisor API:', error);
      return { error: 'Failed to get response from supervisor' };
    }
  }
}); 