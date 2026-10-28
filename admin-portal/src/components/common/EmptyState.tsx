"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import { UtensilsCrossed, AlertCircle, RefreshCw } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionHref,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto my-6 rounded-2xl bg-gray-50/70 dark:bg-gray-800/40 border border-dashed border-gray-200 dark:border-gray-700 ${className}`}
    >
      <div className="w-14 h-14 mb-4 rounded-2xl bg-orange-100/70 dark:bg-orange-950/40 text-[#FF6B1A] flex items-center justify-center shadow-inner">
        {icon || <UtensilsCrossed className="w-7 h-7" />}
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1.5">{title}</h3>
      {description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">{description}</p>}

      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-[#FF6B1A] hover:bg-[#E85B0D] shadow-sm transition-transform active:scale-95"
        >
          {actionLabel}
        </Link>
      )}

      {!actionHref && onAction && actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-[#FF6B1A] hover:bg-[#E85B0D] shadow-sm transition-transform active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto my-8 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40">
      <div className="w-12 h-12 mb-3 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">
        {title || t.common.error}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-rose-700 dark:text-rose-300 bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          {t.common.retry}
        </button>
      )}
    </div>
  );
}

export function LoadingSkeleton({ count = 3, type = "card" }: { count?: number; type?: "card" | "list" | "banner" }) {
  if (type === "banner") {
    return (
      <div className="w-full h-44 sm:h-64 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse my-4" />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 my-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/60 p-4 shadow-sm animate-pulse"
        >
          <div className="w-full h-40 bg-gray-200 dark:bg-gray-700 rounded-xl mb-3" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4" />
          <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700/60">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}
