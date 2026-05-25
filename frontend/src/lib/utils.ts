import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function getCountryFlag(country?: string | null) {
  if (!country) return "🌍";
  const flags: Record<string, string> = {
    ES: "🇪🇸", GB: "🇬🇧", IT: "🇮🇹", NG: "🇳🇬", BR: "🇧🇷",
    DE: "🇩🇪", JP: "🇯🇵", IE: "🇮🇪", US: "🇺🇸", FR: "🇫🇷",
    PT: "🇵🇹", AR: "🇦🇷", NL: "🇳🇱",
  };
  return flags[country.toUpperCase()] || "🌍";
}

export function shareWhatsApp(text: string) {
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
}

export function shareDiscord(text: string) {
  navigator.clipboard.writeText(text);
}
