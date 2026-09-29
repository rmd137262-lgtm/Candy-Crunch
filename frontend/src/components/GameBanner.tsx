import React, { Component, ReactNode } from "react";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform, View } from "react-native";
import { BannerAd, BannerAdSize, TestIds } from "react-native-google-mobile-ads";

const enabled = Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
const ANDROID_BANNER = "ca-app-pub-8747629647202579/2054247419";

class BannerErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {}

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export default function GameBanner() {
  if (!enabled) return null;

  const unitId = __DEV__
    ? TestIds.BANNER
    : Platform.select({ android: ANDROID_BANNER, default: TestIds.BANNER });

  if (!unitId) return null;

  return (
    <BannerErrorBoundary>
      <View style={{ alignItems: "center", minHeight: 50, justifyContent: "center" }}>
        <BannerAd
          unitId={unitId}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly: true }}
          onAdFailedToLoad={() => {}}
        />
      </View>
    </BannerErrorBoundary>
  );
}

