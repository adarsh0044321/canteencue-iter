export interface CuteAvatar {
  id: string;
  name: string;
  foodTag: string;
  bgColor: string;
  accentColor: string;
}

export const CUTE_AVATARS: CuteAvatar[] = [
  { id: "boba-cat", name: "Boba Kitty", foodTag: "Boba Lover", bgColor: "#fbcfe8", accentColor: "#ec4899" },
  { id: "ramen-panda", name: "Ramen Panda", foodTag: "Noodle Fan", bgColor: "#dbeafe", accentColor: "#3b82f6" },
  { id: "chai-fox", name: "Chai Fox", foodTag: "Cutting Chai", bgColor: "#fed7aa", accentColor: "#f97316" },
  { id: "burger-pup", name: "Burger Pup", foodTag: "Snack Master", bgColor: "#fef08a", accentColor: "#eab308" },
  { id: "samosa-monkey", name: "Samosa Monki", foodTag: "Crispy Cravings", bgColor: "#ffedd5", accentColor: "#ea580c" },
  { id: "matcha-bunny", name: "Matcha Bunny", foodTag: "Green Tea Lover", bgColor: "#bbf7d0", accentColor: "#22c55e" },
  { id: "pizza-bear", name: "Pizza Bear", foodTag: "Slice Hunter", bgColor: "#fecdd3", accentColor: "#e11d48" },
  { id: "chef-penguin", name: "Chef Penguin", foodTag: "Master Chef", bgColor: "#e0e7ff", accentColor: "#6366f1" },
  { id: "taco-tiger", name: "Taco Tiger", foodTag: "Spicy Wraps", bgColor: "#ffedd5", accentColor: "#f97316" },
  { id: "coffee-koala", name: "Coffee Koala", foodTag: "Latte Addict", bgColor: "#e2e8f0", accentColor: "#64748b" },
  { id: "donut-otter", name: "Donut Otter", foodTag: "Sweet Tooth", bgColor: "#f5d0fe", accentColor: "#a855f7" },
  { id: "dosa-elephant", name: "Dosa Ellie", foodTag: "South Canteen", bgColor: "#ccfbf1", accentColor: "#14b8a6" },
];

export function getRandomAvatarId(): string {
  const index = Math.floor(Math.random() * CUTE_AVATARS.length);
  return CUTE_AVATARS[index].id;
}

const STORAGE_KEY = "canteencue_user_avatar_id";

export function getStoredAvatarId(): string {
  if (typeof window === "undefined") return "boba-cat";
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && CUTE_AVATARS.some((a) => a.id === saved)) {
      return saved;
    }
    const fresh = getRandomAvatarId();
    localStorage.setItem(STORAGE_KEY, fresh);
    return fresh;
  } catch {
    return "boba-cat";
  }
}

export function setStoredAvatarId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
    window.dispatchEvent(new Event("avatar-changed"));
  } catch {}
}
