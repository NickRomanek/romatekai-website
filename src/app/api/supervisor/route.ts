import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const defaultCompanyInfo = `RomaTek Fast Facts
------------------
• Founded: 2025 • HQ: Florida, USA • Founder: Nick Romanek
• Mission: Help businesses turn AI ideas into measurable results—fast.

Core Services
-------------
• AI Readiness Audit (1‑week) – quick assessment of workflows, data sources & "easy‑win" automation spots
• MS 365/Teams Automations – build Power Automate flows (user onboarding, ticket triage, report generation)
• Azure OpenAI Chatbot MVP – branded FAQ or internal knowledge bot deployed in a secure Azure environment

Unique Value
------------
• 70% average reduction in manual admin time for pilot clients.
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

export async function POST(request: Request) {
  try {
    const { relevantContextFromLastUserMessage, companyInfo, supervisorInstructions } = await request.json();

    const companyInfoToUse = companyInfo || defaultCompanyInfo;
    const instructionsToUse = supervisorInstructions || '';

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `${instructionsToUse}\n\n${companyInfoToUse}\n\n==== Context from User's Last Message ====\n${relevantContextFromLastUserMessage}\n`
        }
      ],
      temperature: 0.7,
    });

    return NextResponse.json({ nextResponse: response.choices[0].message.content });
  } catch (error) {
    console.error('Error in supervisor API:', error);
    return NextResponse.json({ error: 'Failed to get response from supervisor' }, { status: 500 });
  }
} 