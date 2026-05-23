export function emojiFromDescription(description: string | null): string {
  if (!description) return "🍽️";
  const match = description.match(/^(\p{Extended_Pictographic})/u);
  return match?.[1] ?? "🍽️";
}

export function textWithoutLeadingEmoji(description: string | null): string {
  if (!description) return "";
  return description.replace(/^(\p{Extended_Pictographic})\s*/u, "").trim();
}
