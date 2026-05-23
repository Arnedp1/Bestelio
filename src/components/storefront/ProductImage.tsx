"use client";

import Image from "next/image";
import { useState } from "react";

type Size = "mini" | "thumb" | "card" | "detail";

type Props = {
  src: string | null | undefined;
  alt: string;
  size?: Size;
  emojiFallback?: string;
  className?: string;
};

const SIZES = {
  mini: { box: 40, width: 80, height: 80, sizes: "40px" },
  thumb: { box: 80, width: 160, height: 160, sizes: "80px" },
  card: { width: 640, height: 480, sizes: "(max-width: 768px) 50vw, 320px" },
  detail: { box: 280, width: 560, height: 280, sizes: "(max-width: 768px) 100vw, 560px" },
};

export function ProductImage({
  src,
  alt,
  size = "thumb",
  emojiFallback = "🍽️",
  className = "",
}: Props) {
  const [failed, setFailed] = useState(false);

  if (size === "card") {
    const dim = SIZES.card;
    return (
      <div
        className={`relative h-24 w-full overflow-hidden bg-stone-100 sm:h-28 ${className}`}
      >
        {!src || failed ? (
          <span
            className="flex h-full w-full items-center justify-center bg-orange-50 text-3xl sm:text-4xl"
            aria-hidden
          >
            {emojiFallback}
          </span>
        ) : (
          <Image
            src={src}
            alt={alt}
            fill
            sizes={dim.sizes}
            quality={75}
            className="object-cover"
            onError={() => setFailed(true)}
          />
        )}
      </div>
    );
  }

  const dim = SIZES[size];

  if (!src || failed) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-3xl ${className}`}
        style={{ width: dim.box, height: dim.box }}
        aria-hidden
      >
        {emojiFallback}
      </div>
    );
  }

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-2xl bg-stone-100 ${className}`}
      style={{ width: dim.box, height: dim.box }}
    >
      <Image
        src={src}
        alt={alt}
        width={dim.width}
        height={dim.height}
        sizes={dim.sizes}
        quality={75}
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
