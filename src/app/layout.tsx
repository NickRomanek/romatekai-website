import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./lib/envSetup";
import { usePathname } from "next/navigation";
import React from "react";
import ClientHeaderOnlyOnAbout from "./components/ClientHeaderOnlyOnAbout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RomaTek AI Solutions",
  description: "Advanced AI Solutions for Modern Businesses",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientHeaderOnlyOnAbout />
        {children}
      </body>
    </html>
  );
}

// Client Component for conditional header
// src/app/components/ClientHeaderOnlyOnAbout.tsx
// ---
// 'use client';
// import { usePathname } from 'next/navigation';
// export default function ClientHeaderOnlyOnAbout() {
//   const pathname = usePathname();
//   if (pathname !== '/about') return null;
//   return (
//     <header className="bg-white shadow sticky top-0 z-30 w-full">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
//         <a href="/" className="text-xl font-bold text-blue-700 cursor-pointer">
//           RomaTek <span className="text-gray-700">AI Solutions</span>
//         </a>
//         <nav>
//           <a href="/" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition">Home</a>
//         </nav>
//       </div>
//     </header>
//   );
// }
