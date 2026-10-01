import { Purchases, type Package } from "@revenuecat/purchases-js";

import { createUnconfiguredShopState, SHOP_ITEMS, type RevenueCatShopState, type ShopProductId } from "./shopCatalog";
import { storage } from "@/src/utils/storage";

// This is a public RevenueCat Web Billing key. Set it as
// EXPO_PUBLIC_REVENUECAT_PUBLIC_API_KEY in Replit Secrets.
const REVENUECAT_PUBLIC_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_PUBLIC_API_KEY ?? "";

let purchases: Purchases | null = null;
let packagesByItem: Partial<Record<ShopProductId, Package>> = {};

export async function initializeRevenueCatShop(): Promise<RevenueCatShopState> {
  if (!REVENUECAT_PUBLIC_API_KEY.trim()) {
    return createUnconfiguredShopState("RevenueCat checkout needs a Web Billing public API key and a current offering.");
  }

  try {
    if (!Purchases.isConfigured()) {
      let appUserId = await storage.getItem<string>("revenuecat_web_app_user_id", "");
      if (!appUserId) {
        appUserId = Purchases.generateRevenueCatAnonymousAppUserId();
        await storage.setItem("revenuecat_web_app_user_id", appUserId);
      }
      purchases = Purchases.configure({ apiKey: REVENUECAT_PUBLIC_API_KEY, appUserId });
    } else {
      purchases = Purchases.getSharedInstance();
    }

    const offerings = await purchases.getOfferings();
    const availablePackages = offerings.current?.availablePackages ?? [];
    packagesByItem = {};
    const offers = SHOP_ITEMS.map((item) => {
      const pkg = availablePackages.find(
        (candidate) =>
          candidate.identifier === item.packageId ||
          candidate.product.identifier === item.productId,
      );
      if (pkg) packagesByItem[item.id] = pkg;
      return {
        id: item.id,
        title: item.title,
        description: item.description,
        icon: item.icon,
        // Use RevenueCat's localized product price whenever the product is configured.
        price: pkg?.product.price.formattedPrice ?? item.fallbackPrice,
        available: Boolean(pkg),
      };
    });

    const hasAnyOffer = offers.some((offer) => offer.available);
    return {
      configured: true,
      offers,
      message: hasAnyOffer
        ? undefined
        : "Add these three products to the current RevenueCat Web Billing offering to enable checkout.",
    };
  } catch (error) {
    packagesByItem = {};
    return createUnconfiguredShopState(
      error instanceof Error ? error.message : "RevenueCat could not load the current offering.",
    );
  }
}

export async function purchaseRevenueCatShopItem(id: ShopProductId) {
  if (!purchases) {
    throw new Error("RevenueCat checkout is not configured. Set the Web Billing public key and offering first.");
  }
  const rcPackage = packagesByItem[id];
  if (!rcPackage) {
    throw new Error("This item is not in the current RevenueCat offering yet.");
  }
  return purchases.purchase({ rcPackage });
}