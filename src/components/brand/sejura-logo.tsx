import React from "react";
import Image from "next/image";

type SejuraLogoProps = {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
};

const sizeClasses = {
  sm: "h-9 w-9",
  md: "h-12 w-12",
  lg: "h-20 w-20"
};

export function SejuraLogo({ size = "md", showText = true }: SejuraLogoProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <Image
        alt="Sejura"
        className={`${sizeClasses[size]} rounded-xl`}
        height={size === "lg" ? 80 : size === "md" ? 48 : 36}
        priority={size === "lg"}
        src="/icons/icon-192x192.png"
        width={size === "lg" ? 80 : size === "md" ? 48 : 36}
      />
      {showText ? <span className="font-bold text-ink">Sejura</span> : null}
    </span>
  );
}
