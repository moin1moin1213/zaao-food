"use client";

import React, { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center text-2xl mb-4 font-black">
        !
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        কিছু একটা সমস্যা হয়েছে (Something went wrong)
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mb-6">
        {error?.message || "একটি অনাকাঙ্ক্ষিত ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।"}
      </p>
      <button
        onClick={() => reset()}
        className="px-5 py-2.5 rounded-xl font-bold text-white bg-[#FF6B1A] hover:bg-[#e05a10] shadow-md transition-all active:scale-95"
      >
        পুনরায় চেষ্টা করুন (Try Again)
      </button>
    </div>
  );
}
