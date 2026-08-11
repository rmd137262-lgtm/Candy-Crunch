// Native banner ad (base implementation; `GameBanner.web.tsx` overrides on web).
// Disabled in Expo Go (native module absent) and rendered with a Google TEST
// unit while in development (__DEV__) to protect the AdMob account; the real
// Android banner unit is used only in production builds.

import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform, View } from "react-native";

const enabled = Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

let BannerAd: React.ComponentType<Record<string, unknown>> | null = null;
let BannerAdSize: Record<string, string> = {};
let TestIds: Record<string, string> = {};
if (enabled) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- native module must load synchronously for the banner view
  const Ads = require("react-native-google-mobile-ads");
  BannerAd = Ads.BannerAd;
  BannerAdSize = Ads.BannerAdSize;
  TestIds = Ads.TestIds;
}

const ANDROID_BANNER = "ca-app-pub-8747629647202579/2054247419";

export default function GameBanner() {
  if (!enabled || !BannerAd) return null;
  const Banner = BannerAd;
  const unitId = __DEV__ ? TestIds.BANNER : Platform.select({ android: ANDROID_BANNER, default: TestIds.BANNER });
  return (
    <View style={{ alignItems: "center" }}>
      <Banner
        unitId={unitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdFailedToLoad={() => {}}
      />
    </View>
  );
}
