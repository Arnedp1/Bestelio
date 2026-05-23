"use client";

import { useEffect } from "react";

export function ScrollToCategorySection({ categoryId }: { categoryId?: string }) {
  useEffect(() => {
    if (!categoryId) return;

    const id = `category-${categoryId}`;
    const scroll = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    requestAnimationFrame(scroll);
    const t = window.setTimeout(scroll, 100);
    return () => window.clearTimeout(t);
  }, [categoryId]);

  return null;
}
