import { createUnconfiguredShopState, type RevenueCatShopState, type ShopProductId } from "./shopCatalog";

// The requested integration uses RevenueCat's Web SDK. Native builds should use
// the native RevenueCat SDK before enabling purchases on iOS or Android.
export async function initializeRevenueCatShop(): Promise<RevenueCatShopState> {
  return createUnconfiguredShopState("RevenueCat Web checkout is available in the browser preview.");
}

export async function purchaseRevenueCatShopItem(_id: ShopProductId): Promise<never> {
  throw new Error("RevenueCat Web checkout is only available in the browser preview.");
}