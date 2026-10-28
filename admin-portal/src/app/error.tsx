"use client";

import React, { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin Error:", error);
  }, [error]);

  return (
    <div className="p-8 text-center space-y-4 max-w-md mx-auto">
      <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xl mx-auto">
        !
      </div>
      <h2 className="text-lg font-bold text-gray-900">কিছু একটা সমস্যা হয়েছে</h2>
      <p className="text-xs text-gray-600">{error?.message || "অনাকাঙ্ক্ষিত ত্রুটি ঘটেছে"}</p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#FF6B1A] hover:bg-orange-600"
      >
        পুনরায় চেষ্টা করুন
      </button>
    </div>
  );
}
