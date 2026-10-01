export const SHOP_ITEMS = [
  {
    id: "extraMoves",
    title: "5 Extra Moves",
    description: "Keep this level going with five more moves.",
    icon: "⚡",
    fallbackPrice: "$0.99",
    productId: "candy_crunch_extra_moves",
    packageId: "extra_moves",
  },
  {
    id: "unlimitedLives",
    title: "Unlimited Lives · 1 Day",
    description: "Retry levels freely for the next 24 hours.",
    icon: "❤️",
    fallbackPrice: "$2.99",
    productId: "candy_crunch_unlimited_lives_day",
    packageId: "unlimited_lives_day",
  },
  {
    id: "boosterPack",
    title: "Remove Ads & Booster Pack",
    description: "Hide ads and add three Bagula blasts.",
    icon: "🦅",
    fallbackPrice: "$4.99",
    productId: "candy_crunch_remove_ads_booster_pack",
    packageId: "remove_ads_booster_pack",
  },
] as const;

export type ShopProductId = (typeof SHOP_ITEMS)[number]["id"];

export type ShopOffer = {
  id: ShopProductId;
  title: string;
  description: string;
  icon: string;
  price: string;
  available: boolean;
};

export type RevenueCatShopState = {
  configured: boolean;
  offers: ShopOffer[];
  message?: string;
};

export function createUnconfiguredShopState(message?: string): RevenueCatShopState {
  return {
    configured: false,
    offers: SHOP_ITEMS.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      icon: item.icon,
      price: item.fallbackPrice,
      available: false,
    })),
    message,
  };
}