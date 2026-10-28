"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

interface LogoProps {
  className?: string;
  variant?: "horizontal" | "iconOnly" | "compact" | "typography";
  showMascot?: boolean;
  showLink?: boolean;
}

/**
 * Shared PenguFood Brand Component.
 * - Mascot Icon: The official circular Penguin head wearing an orange cap.
 * - Typography: The official PenguFood wordmark, adapted with zero flicker for light and dark themes.
 */
export function Logo({
  className = "",
  variant = "horizontal",
  showMascot,
  showLink = true,
}: LogoProps) {
  // Default showMascot to true on horizontal, false on compact for mobile width safety
  const shouldShowMascot = showMascot !== undefined ? showMascot : variant === "horizontal";
  let content: React.ReactNode;

  if (variant === "iconOnly") {
    content = (
      <div className={`relative w-9 h-9 sm:w-10 sm:h-10 shrink-0 ${className}`}>
        <Image
          src="/pengu-icon.png"
          alt="PenguFood Mascot"
          width={40}
          height={40}
          priority
          className="object-contain"
        />
      </div>
    );
  } else if (variant === "compact") {
    content = (
      <div className={`flex items-center gap-2 select-none ${className}`}>
        {shouldShowMascot && (
          <div className="relative w-8 h-8 shrink-0">
            <Image
              src="/pengu-icon.png"
              alt="PenguFood Icon"
              width={32}
              height={32}
              priority
              className="object-contain"
            />
          </div>
        )}
        <div className="relative h-7 w-28 sm:w-32 flex items-center">
          <Image
            src="/pengu-logo-light.png"
            alt="PenguFood"
            fill
            sizes="128px"
            priority
            className="object-contain object-left dark:hidden"
          />
          <Image
            src="/pengu-logo-dark.png"
            alt="PenguFood"
            fill
            sizes="128px"
            priority
            className="object-contain object-left hidden dark:block"
          />
        </div>
      </div>
    );
  } else if (variant === "typography") {
    content = (
      <div className={`relative h-8 sm:h-9 w-36 sm:w-44 flex items-center select-none ${className}`}>
        <Image
          src="/pengu-logo-light.png"
          alt="PenguFood"
          fill
          sizes="(max-width: 768px) 144px, 176px"
          priority
          className="object-contain object-left dark:hidden"
        />
        <Image
          src="/pengu-logo-dark.png"
          alt="PenguFood"
          fill
          sizes="(max-width: 768px) 144px, 176px"
          priority
          className="object-contain object-left hidden dark:block"
        />
      </div>
    );
  } else {
    // Horizontal (default)
    content = (
      <div className={`flex items-center gap-2.5 select-none ${className}`}>
        {shouldShowMascot && (
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 shrink-0 transition-transform group-hover:scale-105">
            <Image
              src="/pengu-icon.png"
              alt="PenguFood Mascot"
              width={40}
              height={40}
              priority
              className="object-contain"
            />
          </div>
        )}
        <div className="relative h-8 sm:h-9 w-36 sm:w-44 flex items-center">
          <Image
            src="/pengu-logo-light.png"
            alt="PenguFood - Food & Cake Delivery"
            fill
            sizes="(max-width: 768px) 144px, 176px"
            priority
            className="object-contain object-left dark:hidden"
          />
          <Image
            src="/pengu-logo-dark.png"
            alt="PenguFood - Food & Cake Delivery"
            fill
            sizes="(max-width: 768px) 144px, 176px"
            priority
            className="object-contain object-left hidden dark:block"
          />
        </div>
      </div>
    );
  }

  if (showLink) {
    return (
      <Link
        href="/"
        className="group inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B1A] rounded-xl transition-transform active:scale-95"
      >
        {content}
      </Link>
    );
  }

  return content;
}
