"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Cat = { slug: string; name: string; emoji: string };

const SCROLL_OFFSET = 88;

function scrollToSection(slug: string | null) {
  if (!slug) {
    const menu = document.getElementById("menu");
    if (menu) {
      const top = menu.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
      window.scrollTo({ top, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    return;
  }

  const el = document.getElementById(slug);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
  window.scrollTo({ top, behavior: "smooth" });
}

export function CategoryNav({ categories }: { categories: Cat[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash === "menu") {
      setActiveSlug(null);
      requestAnimationFrame(() => scrollToSection(null));
    } else if (hash && categories.some((c) => c.slug === hash)) {
      setActiveSlug(hash);
      requestAnimationFrame(() => scrollToSection(hash));
    }
  }, [categories]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateScrollButtons();
    el.addEventListener("scroll", updateScrollButtons, { passive: true });
    const ro = new ResizeObserver(updateScrollButtons);
    ro.observe(el);
    window.addEventListener("resize", updateScrollButtons);

    return () => {
      el.removeEventListener("scroll", updateScrollButtons);
      ro.disconnect();
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [updateScrollButtons, categories.length]);

  function scrollNav(direction: -1 | 1) {
    scrollRef.current?.scrollBy({ left: direction * 180, behavior: "smooth" });
  }

  function selectCategory(slug: string | null) {
    setActiveSlug(slug);
    scrollToSection(slug);
  }

  return (
    <div className="category-nav">
      {canScrollLeft && (
        <button
          type="button"
          className="category-nav-arrow category-nav-arrow-left"
          aria-label="Vorige categorieën"
          onClick={() => scrollNav(-1)}
        >
          ‹
        </button>
      )}

      <nav
        ref={scrollRef}
        className="category-nav-track scrollbar-none"
        aria-label="Categorieën"
      >
        <button
          type="button"
          onClick={() => selectCategory(null)}
          className={`chip shrink-0 ${activeSlug === null ? "chip-active" : "chip-inactive"}`}
        >
          Alles
        </button>
        {categories.map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => selectCategory(c.slug)}
            className={`chip shrink-0 ${activeSlug === c.slug ? "chip-active" : "chip-inactive"}`}
          >
            <span>{c.emoji}</span>
            {c.name}
          </button>
        ))}
      </nav>

      {canScrollRight && (
        <button
          type="button"
          className="category-nav-arrow category-nav-arrow-right"
          aria-label="Volgende categorieën"
          onClick={() => scrollNav(1)}
        >
          ›
        </button>
      )}
    </div>
  );
}
