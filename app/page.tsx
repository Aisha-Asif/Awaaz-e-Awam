"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/Card";
import { Button } from "@/components/Button";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="p-6 sm:p-8 border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Awaaz-e-Awam
          </h1>
          <p className="mt-3 text-lg text-slate-600">Your voice. Your forms.</p>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-slate-700">How would you like to begin?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/speak" className="block">
              <Card variant="elevated" padding="lg" className="h-full hover:shadow-xl transition-shadow duration-300">
                <CardContent className="flex flex-col items-center text-center h-full">
                  <div className="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Speak Naturally</h3>
                  <p className="text-slate-600 mb-6">
                    Speak your information in Urdu or Roman Urdu. The AI will understand and fill the form for you.
                  </p>
                  <Button size="lg" className="w-full">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    Start Speaking
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/scan" className="block">
              <Card variant="elevated" padding="lg" className="h-full hover:shadow-xl transition-shadow duration-300">
                <CardContent className="flex flex-col items-center text-center h-full">
                  <div className="w-20 h-20 rounded-2xl bg-green-100 flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.2A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.2A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Scan a Form</h3>
                  <p className="text-slate-600 mb-6">
                    Take a picture of your physical form. The AI will read it and guide you through each field in Urdu.
                  </p>
                  <Button variant="outline" size="lg" className="w-full">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.2A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.2A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    </svg>
                    Scan Form
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>

          <div className="text-center pt-4">
            <p className="text-sm text-slate-500">
              Demo only. Please do not enter real sensitive identity information.
            </p>
          </div>
        </div>
      </div>

      <footer className="p-6 border-t border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto text-center text-sm text-slate-500">
          Awaaz-e-Awam — Multi-Dialect Urdu Voice-to-Form Assistant
        </div>
      </footer>
    </main>
  );
}