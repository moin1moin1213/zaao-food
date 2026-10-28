"use client";

import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="bn">
      <body className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-2xl mb-4 font-black">
          !
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          কিছু একটা সমস্যা হয়েছে
        </h2>
        <p className="text-sm text-gray-600 max-w-md mb-6">
          {error?.message || "একটি অনাকাঙ্ক্ষিত ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।"}
        </p>
        <button
          onClick={() => reset()}
          className="px-5 py-2.5 rounded-xl font-bold text-white bg-[#FF6B1A] hover:bg-[#e05a10] shadow-md transition-all active:scale-95"
        >
          পুনরায় চেষ্টা করুন
        </button>
      </body>
    </html>
  );
}
