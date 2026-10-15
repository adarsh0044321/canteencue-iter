import menuData from "./menu.json";
import { MenuItem, PortionType } from "./types";

export const ALL_MENU_ITEMS: MenuItem[] = menuData as MenuItem[];

export function getMenuItems(): MenuItem[] {
  return ALL_MENU_ITEMS;
}

export function getItemById(id: string): MenuItem | undefined {
  return ALL_MENU_ITEMS.find((item) => item.id === id);
}

export function getItemPriceForPortion(item: MenuItem, portion?: PortionType): number {
  if (portion && item.portionOptions) {
    const match = item.portionOptions.find((p) => p.portion === portion);
    if (match) return match.price;
  }
  return item.price;
}

export function getAllPortionsForMenuItem(item: MenuItem): { item: MenuItem; portion?: PortionType; price: number }[] {
  if (item.portionOptions && item.portionOptions.length > 0) {
    return item.portionOptions.map((opt) => ({
      item,
      portion: opt.portion,
      price: opt.price,
    }));
  }
  return [
    {
      item,
      portion: item.portion || "standard",
      price: item.price,
    },
  ];
}
