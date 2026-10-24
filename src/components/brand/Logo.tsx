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
 * Integrates the official Zaao Food logo supplied by the user.
 * Seamlessly adapts to light mode and dark mode without hydration flicker.
 */
export function Logo({ className = "", variant = "horizontal", showLink = true }: LogoProps) {
  const content = (
    <div className={`flex items-center select-none ${className}`}>
      {variant === "iconOnly" ? (
        <div className="relative w-9 h-9 flex items-center justify-center bg-orange-500/10 dark:bg-orange-500/20 rounded-xl overflow-hidden p-1">
          <Image
            src="/zaao-logo-light.png"
            alt="Zaao Food"
            width={34}
            height={34}
            priority
            className="object-contain dark:hidden"
          />
          <Image
            src="/zaao-logo-dark.png"
            alt="Zaao Food"
            width={34}
            height={34}
            priority
            className="object-contain hidden dark:block"
          />
        </div>
      ) : variant === "compact" ? (
        <div className="relative h-8 w-28 sm:w-32 flex items-center">
          <Image
            src="/zaao-logo-light.png"
            alt="Zaao Food"
            fill
            sizes="128px"
            priority
            className="object-contain object-left dark:hidden"
          />
          <Image
            src="/zaao-logo-dark.png"
            alt="Zaao Food"
            fill
            sizes="128px"
            priority
            className="object-contain object-left hidden dark:block"
          />
        </div>
      ) : (
        <div className="relative h-10 w-36 sm:w-44 flex items-center">
          <Image
            src="/zaao-logo-light.png"
            alt="Zaao Food - Local Food Delivery"
            fill
            sizes="(max-width: 768px) 144px, 176px"
            priority
            className="object-contain object-left dark:hidden"
          />
          <Image
            src="/zaao-logo-dark.png"
            alt="Zaao Food - Local Food Delivery"
            fill
            sizes="(max-width: 768px) 144px, 176px"
            priority
            className="object-contain object-left hidden dark:block"
          />
        </div>
      )}
    </div>
  );

  if (showLink) {
    return (
      <Link
        href="/"
        className="inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-zaao-primary rounded-lg transition-transform active:scale-95"
      >
        {content}
      </Link>
    );
  }

  return content;
}
