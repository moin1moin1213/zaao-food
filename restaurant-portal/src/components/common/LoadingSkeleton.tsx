"use client";

import React from "react";

interface LoadingSkeletonProps {
  count?: number;
  type?: "card" | "list" | "banner";
  className?: string;
}

export function LoadingSkeleton({ count = 3, type = "card", className = "" }: LoadingSkeletonProps) {
  if (type === "banner") {
    return (
      <div className={`w-full h-44 sm:h-64 rounded-3xl bg-gray-200 dark:bg-gray-800 animate-pulse my-4 ${className}`} />
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 my-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-850 p-4 shadow-xs animate-pulse space-y-3"
        >
          <div className="w-full h-40 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-md w-3/4" />
          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-md w-1/2" />
          <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-800">
            <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-xl w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}
