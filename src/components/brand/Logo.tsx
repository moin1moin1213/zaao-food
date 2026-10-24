"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

interface LogoProps {
  className?: string;
  variant?: "horizontal" | "iconOnly" | "compact";
  showLink?: boolean;
}

/**
 * Shared Zaao Food Brand Component.
 * Uses the authentic repository SVG asset (/zaaofood-logo.svg).
 * Easily configurable and theme-adaptive.
 */
export function Logo({ className = "", variant = "horizontal", showLink = true }: LogoProps) {
  const content = (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {variant === "iconOnly" ? (
        <div className="relative w-9 h-9 flex items-center justify-center bg-zaao-primary/10 rounded-xl overflow-hidden p-1">
          <Image
            src="/zaaofood-logo.svg"
            alt="Zaao Food"
            width={36}
            height={36}
            priority
            className="object-contain"
          />
        </div>
      ) : (
        <div className="relative h-10 w-36 sm:w-44 flex items-center">
          <Image
            src="/zaaofood-logo.svg"
            alt="Zaao Food - Local Food Delivery"
            fill
            sizes="(max-width: 768px) 144px, 176px"
            priority
            className="object-contain object-left dark:brightness-110"
          />
        </div>
      )}
    </div>
  );

  if (showLink) {
    return (
      <Link href="/" className="inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-zaao-primary rounded-lg transition-transform active:scale-95">
        {content}
      </Link>
    );
  }

  return content;
}
