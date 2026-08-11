// AdMob helper for native builds (base implementation used on iOS/Android;
// `ads.web.ts` overrides this on web). Ads are NATIVE-ONLY and are disabled in
// Expo Go (the native module is not bundled there). The interstitial uses a
// Google TEST unit for now — replace with a real interstitial unit before
// release. All calls are guarded so the game never crashes when ads are off.

import Constants, { ExecutionEnvironment } from "expo-constants";

// Expo Go ships as StoreClient and does NOT contain the AdMob native module.
export const adsEnabled = Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

let interstitial: { load: () => void; show: () => void } | null = null;
let loaded = false;

export async function initAds() {
  if (!adsEnabled) return;
  try {
    const Ads = await import("react-native-google-mobile-ads");
    await Ads.default().initialize();
    interstitial = Ads.InterstitialAd.createForAdRequest(Ads.TestIds.INTERSTITIAL, {
      requestNonPersonalizedAdsOnly: true,
    });
    interstitial.addAdEventListener(Ads.AdEventType.LOADED, () => {
      loaded = true;
    });
    interstitial.addAdEventListener(Ads.AdEventType.CLOSED, () => {
      loaded = false;
      interstitial?.load();
    });
    interstitial.addAdEventListener(Ads.AdEventType.ERROR, () => {
      loaded = false;
    });
    interstitial.load();
  } catch {
    interstitial = null;
  }
}

export function showGameOverAd() {
  if (!adsEnabled || !interstitial) return;
  try {
    if (loaded) {
      loaded = false;
      interstitial.show();
    }
  } catch {
    // never block the game-over flow on an ad failure
  }
}
