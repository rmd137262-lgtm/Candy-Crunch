// AdMob helper for native builds
import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";
import mobileAds, { InterstitialAd, AdEventType, TestIds } from "react-native-google-mobile-ads";

export const adsEnabled = Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

const INTERSTITIAL_ANDROID = "ca-app-pub-8747629647202579/8007408485";

let interstitial: any = null;
let loaded = false;

export async function initAds() {
  if (!adsEnabled) return;
  try {
    await mobileAds().initialize();
    
    const interstitialId = __DEV__
      ? TestIds.INTERSTITIAL
      : Platform.select({ android: INTERSTITIAL_ANDROID, default: TestIds.INTERSTITIAL });

    interstitial = InterstitialAd.createForAdRequest(interstitialId as string, {
      requestNonPersonalizedAdsOnly: true,
    });

    interstitial.addAdEventListener(AdEventType.LOADED, () => {
      loaded = true;
    });
    interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      loaded = false;
      try {
        interstitial?.load();
      } catch {}
    });
    interstitial.addAdEventListener(AdEventType.ERROR, () => {
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
