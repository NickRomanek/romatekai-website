import React from 'react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-4 text-gray-900">About RomaTek AI Solutions</h1>
        <p className="text-lg text-gray-700 mb-8">
          Welcome! Here you'll find my credentials and a few photos. (You can update this section with your real info and images.)
        </p>
        <div className="bg-white rounded-xl shadow p-6 mb-8 text-left">
          <h2 className="text-2xl font-semibold mb-2">Credentials</h2>
          <ul className="list-disc list-inside text-gray-800">
            <li>Certified in Azure AI-102 and Microsoft Solutions Architecture</li>
            <li>10+ years experience in AI and IT consulting</li>
            <li>Proven track record in automotive diagnostics, healthcare, and legal SMBs</li>
            <li>Founder: Nick Romanek</li>
            <li>Based in Florida, USA</li>
          </ul>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=facearea&w=400&h=400&q=80" alt="Team or founder" className="rounded-xl shadow object-cover w-full h-64" />
          <img src="https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=400&h=400&q=80" alt="Office or event" className="rounded-xl shadow object-cover w-full h-64" />
        </div>
      </div>
    </div>
  );
} 