'use client';

import Image from 'next/image';
import { useEffect } from 'react';

// FAQ data for structured data
const faqData = [
  {
    question: 'What is Azure OpenAI Service?',
    answer: 'Azure OpenAI is Microsoft\'s enterprise-grade deployment of OpenAI language models with built-in security, compliance, and regional data residency.',
  },
  {
    question: 'How long does a pilot take?',
    answer: 'Most proofs of concept are delivered in three to six weeks, depending on data availability and integration scope.',
  },
  {
    question: 'Can you work inside our Azure subscription?',
    answer: 'Yes. We can deploy resources in your tenant for full data ownership, or host in our managed environment.',
  },
  {
    question: 'What is the typical project cost?',
    answer: 'Strategy + roadmap engagements begin at $5,000. Rapid POCs range from $8–15k. Managed AI-Ops retainers start at $4k/month.',
  },
  {
    question: 'Do you provide ongoing support after deployment?',
    answer: 'Yes, we offer managed AI-Ops services including monitoring, fine-tuning, cost optimization, and feature updates starting at $4k/month.',
  },
];

// Service packages data
const servicePackages = [
  {
    title: "Strategy & Road-map",
    description: "1-week assessment, cost model, and 12-month adoption plan.",
    price: "From $5,000",
    timeline: "1-week",
    href: "#contact"
  },
  {
    title: "Rapid POC",
    description: "Deploy a working chatbot, doc-intel pipeline, or Copilot extension in 3–6 weeks.",
    price: "$8–15,000",
    timeline: "4-week",
    href: "#contact"
  },
  {
    title: "Managed AI-Ops",
    description: "Ongoing fine-tuning, monitoring, and cost optimisation.",
    price: "From $4,000 / mo",
    timeline: "Ongoing",
    href: "#contact"
  }
];

// Client component for FAQ accordion
function FAQAccordion() {
  return (
    <div className="max-w-3xl mx-auto mt-10 px-4">
      {faqData.map((faq, index) => (
        <details key={index} className="mb-4 bg-white rounded-lg shadow-sm">
          <summary className="p-6 cursor-pointer hover:bg-slate-50 font-semibold text-lg flex justify-between items-center text-gray-900">
            {faq.question}
            <span className="text-blue-600 text-xl">+</span>
          </summary>
          <div className="px-6 pb-6">
            <p className="text-slate-600">{faq.answer}</p>
          </div>
        </details>
      ))}
    </div>
  );
}

export default function AzureAIConsultingPage() {
  // Set SEO metadata for client component
  useEffect(() => {
    document.title = "Azure OpenAI Consulting | RomaTek AI";
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Rapid pilots and production deployments of GPT-4o, Copilot extensions, and process automation on Microsoft Azure.');
    } else {
      const newMeta = document.createElement('meta');
      newMeta.name = 'description';
      newMeta.content = 'Rapid pilots and production deployments of GPT-4o, Copilot extensions, and process automation on Microsoft Azure.';
      document.head.appendChild(newMeta);
    }

    // Add canonical link
    const existingCanonical = document.querySelector('link[rel="canonical"]');
    if (existingCanonical) {
      existingCanonical.setAttribute('href', 'https://romatekai.com/azure-ai-consulting');
    } else {
      const canonical = document.createElement('link');
      canonical.rel = 'canonical';
      canonical.href = 'https://romatekai.com/azure-ai-consulting';
      document.head.appendChild(canonical);
    }
  }, []);

  // FAQ structured data
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqData.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />

      {/* Header Navigation */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <a href="/" className="text-xl font-bold text-blue-700 hover:text-blue-800 transition-colors mr-8">
                RomaTek AI <span className="text-gray-700">Solutions</span>
              </a>
              <nav className="hidden md:flex space-x-6 text-base font-medium">
                <a href="/" className="text-gray-600 hover:text-gray-900 transition-colors">Home</a>
                <a href="/blog" className="text-gray-600 hover:text-gray-900 transition-colors">Blog</a>
              </nav>
            </div>
          </div>
        </div>
      </header>

      <section className="py-16 text-center bg-gradient-to-b from-white to-slate-50">
        <h1 className="text-4xl font-bold text-gray-900">
          Microsoft AI Consulting for <span className="text-blue-600">SMBs</span>
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-700">
          Azure OpenAI, Microsoft 365 Copilot, and custom AI solutions—delivered in 30 days with enterprise-grade security.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <a
            href="https://calendly.com/romatekai/ai-consultation"
            className="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            Book Free Audit
          </a>
          <a
            href="#faq"
            className="px-6 py-3 rounded-lg border border-blue-600 text-blue-600 font-medium hover:bg-blue-50 transition-colors"
          >
            FAQ
          </a>
        </div>

      </section>

      <section className="py-20 bg-slate-900 w-full">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-white mb-4">Why Microsoft AI + RomaTek?</h2>
          <div className="grid md:grid-cols-3 gap-6 mt-10">
            <div className="p-6 border rounded-lg bg-slate-800 text-white">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 mr-3 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="font-medium">Enterprise-grade security</h3>
              </div>
              <p className="mt-2 text-sm text-slate-300">
                Data never leaves Microsoft's compliant cloud. We configure PII redaction, private networking,
                and RBAC from day&nbsp;one.
              </p>
            </div>
            <div className="p-6 border rounded-lg bg-slate-800 text-white">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 mr-3 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="font-medium">Rapid time to value</h3>
              </div>
              <p className="mt-2 text-sm text-slate-300">
                Proven sprint model: strategy → pilot → production in under 30&nbsp;days, with clear ROI checkpoints.
              </p>
            </div>
            <div className="p-6 border rounded-lg bg-slate-800 text-white">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 mr-3 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="font-medium">Certified expertise</h3>
              </div>
              <p className="mt-2 text-sm text-slate-300">
                Azure AI-102 certified team; direct collaboration experience with Microsoft AI Labs.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-50">
        <h2 className="text-2xl font-semibold text-center text-gray-900">Service Packages</h2>
        <div className="grid md:grid-cols-3 gap-6 mt-10 max-w-5xl mx-auto px-4">
          {servicePackages.map((pkg, index) => (
            <div
              key={index}
              className="p-6 bg-white border rounded-lg hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <h3 className="font-medium text-lg text-gray-900 group-hover:text-blue-600 transition-colors">{pkg.title}</h3>
              <p className="mt-2 text-sm text-slate-600 mb-4">
                {pkg.description}
              </p>
              <div className="border-t pt-4">
                <p className="text-xs text-slate-500 mb-1">Timeline: {pkg.timeline}</p>
                <p className="font-semibold text-blue-600">{pkg.price}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 max-w-5xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-white bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">30-Day Delivery Timeline</h2>
        <div className="mt-10 text-center">
          <div className="w-full max-w-4xl mx-auto">
            <div className="h-64 bg-gradient-to-r from-blue-600 via-blue-500 to-green-500 rounded-xl flex items-center justify-center relative overflow-hidden">
              {/* Speed lines background effect */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-1/4 left-0 w-full h-0.5 bg-white transform -skew-y-3"></div>
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white transform -skew-y-3"></div>
                <div className="absolute top-3/4 left-0 w-full h-0.5 bg-white transform -skew-y-3"></div>
              </div>
              
              <div className="text-center relative z-10">
                <div className="flex justify-center items-center mb-6">
                  {/* Fast forward / rocket icon */}
                  <div className="relative">
                    <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <p className="text-white text-2xl font-bold mb-2">From Strategy to Production</p>
                <p className="text-blue-100 text-lg">30-day fast-track to Microsoft AI success</p>
                <div className="mt-6 flex justify-center space-x-8 text-white text-sm">
                  <div className="text-center">
                    <div className="font-bold text-lg">Week 1</div>
                    <div className="text-blue-100">Strategy</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">Week 2-3</div>
                    <div className="text-blue-100">Build & Test</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">Week 4</div>
                    <div className="text-blue-100">Deploy</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-50">
        <h2 className="text-2xl font-semibold text-center text-gray-900">Client Impact</h2>
        <div className="max-w-3xl mx-auto text-center px-4">
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">CLIENT</span>
              </div>
            </div>
                         <p className="italic text-slate-700 text-lg leading-relaxed">
               "RomaTek cut our new-hire onboarding time by <span className="font-bold text-2xl text-blue-600">70%</span> with a custom AI doc-assistant. ROI realised in six weeks."
             </p>
            <p className="text-slate-500 mt-4 font-medium">— COO, Regional Auto-Diagnostics Firm</p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-800 w-full">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-semibold text-center text-white">Credentials &amp; Stack</h2>
          <div className="flex flex-wrap justify-center gap-8 mt-12">
            <div 
              className="w-32 h-32 bg-slate-700 hover:bg-slate-600 rounded-xl flex items-center justify-center border border-slate-600 cursor-pointer transition-colors group"
              title="Azure AI-102 Certified"
            >
              <span className="text-sm text-center text-white group-hover:text-blue-300 font-medium">Azure AI-102</span>
            </div>
            <div 
              className="w-32 h-32 bg-slate-700 hover:bg-slate-600 rounded-xl flex items-center justify-center border border-slate-600 cursor-pointer transition-colors group"
              title="Microsoft AI Labs Participant"
            >
              <span className="text-sm text-center text-white group-hover:text-blue-300 font-medium">MS AI Labs</span>
            </div>
            <div 
              className="w-32 h-32 bg-slate-700 hover:bg-slate-600 rounded-xl flex items-center justify-center border border-slate-600 cursor-pointer transition-colors group"
              title="OpenAI API Expert"
            >
              <span className="text-sm text-center text-white group-hover:text-blue-300 font-medium">OpenAI</span>
            </div>
            <div 
              className="w-32 h-32 bg-slate-700 hover:bg-slate-600 rounded-xl flex items-center justify-center border border-slate-600 cursor-pointer transition-colors group"
              title="Power Automate Specialist"
            >
              <span className="text-sm text-center text-white group-hover:text-blue-300 font-medium">Power Automate</span>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="py-20 bg-slate-50">
        <h2 className="text-2xl font-semibold text-center text-gray-900">Frequently Asked Questions</h2>
        <FAQAccordion />
      </section>

      <section id="contact" className="py-20 text-center bg-white">
        <h2 className="text-2xl font-semibold text-gray-900">Ready to Start?</h2>
        <p className="mt-2 text-gray-600">Book a 30-minute discovery call to map your first Microsoft AI win.</p>
        <iframe
          src="https://calendly.com/romatekai/ai-consultation"
          className="w-full max-w-lg mx-auto h-[620px] mt-6 border rounded-lg shadow-lg"
        />
      </section>
    </>
  );
} 