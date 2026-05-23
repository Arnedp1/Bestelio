/** Emoji per categorie-slug (The Food Stop-menu). */
export const CATEGORY_EMOJI_BY_SLUG: Record<string, string> = {
  friet: "🍟",
  snack: "🌭",
  "koude-sauzen": "🫙",
  "warme-sauzen": "🥘",
  hamburgers: "🍔",
  bickyburger: "🍔",
  "classic-burgers": "🍔",
  "warme-broodjes": "🥖",
  broodjes: "🥪",
  "speciale-koude-broodjes": "🥪",
  wraps: "🌯",
  mitraillette: "🥖",
  "drank-fles": "🥤",
  "drank-blik": "🥤",
  "warme-drank": "☕",
};

export function categoryEmoji(slug: string): string {
  return CATEGORY_EMOJI_BY_SLUG[slug] ?? "🍽️";
}
