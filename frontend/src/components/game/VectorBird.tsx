import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  Easing 
} from 'react-native-reanimated';

interface Props {
  type: number;
  size?: number;
  isFlapping?: boolean;
}

const BIRDS = [
  { body: '#E53935', chest: '#FF8A80', wing: '#B71C1C', beak: '#FFB300', mask: '#212121', crest: true },
  { body: '#1E88E5', chest: '#BBDEFB', wing: '#0D47A1', beak: '#424242', mask: '#FFFFFF', crest: false },
  { body: '#FDD835', chest: '#FFF9C4', wing: '#F57F17', beak: '#FB8C00', mask: '#FFF', crest: false },
  { body: '#43A047', chest: '#C8E6C9', wing: '#1B5E20', beak: '#FFA000', mask: '#2E7D32', crest: false },
  { body: '#8E24AA', chest: '#E1BEE7', wing: '#4A148C', beak: '#FFD54F', mask: '#F3E5F5', crest: false },
];

export const VectorBird: React.FC<Props> = ({ type, size = 44, isFlapping = false }) => {
  const bird = BIRDS[type % BIRDS.length];
  
  // Animation values
  const wingAngle = useSharedValue(0);
  const bodyBob = useSharedValue(0);

  useEffect(() => {
    // 1. Idle Gentle Breathing (Har bird baithi hui thodi zinda lagegi)
    bodyBob.value = withRepeat(
      withSequence(
        withTiming(-1.5, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.5, { duration: 600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // 2. Wing Flap (Pankh ki tezi)
    if (isFlapping) {
      wingAngle.value = withRepeat(
        withSequence(
          withTiming(-55, { duration: 65, easing: Easing.linear }),
          withTiming(20, { duration: 65, easing: Easing.linear })
        ),
        -1,
        true
      );
    } else {
      wingAngle.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 400, easing: Easing.ease }),
          withTiming(4, { duration: 400, easing: Easing.ease })
        ),
        -1,
        true
      );
    }
  }, [isFlapping]);

  const animatedWingStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: isFlapping ? -4 : 0 },
      { rotate: `${wingAngle.value}deg` }
    ],
  }));

  const animatedBodyStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bodyBob.value }],
  }));

  return (
    <Animated.View style={[styles.root, { width: size, height: size }, animatedBodyStyle]}>
      {/* Tail */}
      <View style={[styles.tailFeather, { backgroundColor: bird.wing }]} />

      {/* Crest */}
      {bird.crest && <View style={[styles.crest, { backgroundColor: bird.body }]} />}

      {/* Main Perched Body */}
      <View style={[styles.bodyShape, { backgroundColor: bird.body }]}>
        <View style={[styles.chestLayer, { backgroundColor: bird.chest }]} />
        <View style={[styles.eyeMask, { backgroundColor: bird.mask }]} />
        
        {/* Eye */}
        <View style={styles.eyeContainer}>
          <View style={styles.pupil} />
          <View style={styles.shine} />
        </View>

        {/* Beak */}
        <View style={[styles.beak, { borderLeftColor: bird.beak }]} />
      </View>

      {/* Animated Wing (Real Pankh) */}
      <Animated.View 
        style={[
          styles.wingShape, 
          { backgroundColor: bird.wing }, 
          animatedWingStyle
        ]}
      >
        <View style={styles.wingStreak} />
      </Animated.View>

      {/* Feet */}
      <View style={styles.feetGroup}>
        <View style={styles.claw} />
        <View style={styles.claw} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  crest: {
    position: 'absolute',
    top: 2,
    right: 17,
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 3,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#E53935',
    transform: [{ rotate: '25deg' }],
    zIndex: 1,
  },
  bodyShape: {
    width: 32,
    height: 29,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 13,
    borderBottomRightRadius: 17,
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  chestLayer: {
    position: 'absolute',
    bottom: 1,
    right: 2,
    width: 17,
    height: 18,
    borderBottomRightRadius: 15,
    borderTopLeftRadius: 8,
    opacity: 0.85,
  },
  eyeMask: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 11,
    height: 10,
    borderRadius: 5,
    opacity: 0.7,
  },
  eyeContainer: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  pupil: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0F0F0F',
  },
  shine: {
    position: 'absolute',
    top: 0.8,
    right: 0.8,
    width: 1.8,
    height: 1.8,
    borderRadius: 1,
    backgroundColor: '#FFFFFF',
  },
  beak: {
    position: 'absolute',
    top: 9,
    right: -7,
    width: 0,
    height: 0,
    borderTopWidth: 3.5,
    borderBottomWidth: 3.5,
    borderLeftWidth: 8,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    zIndex: 4,
  },
  tailFeather: {
    position: 'absolute',
    bottom: 6,
    left: 2,
    width: 14,
    height: 7,
    borderRadius: 3,
    transform: [{ rotate: '-32deg' }],
  },
  wingShape: {
    position: 'absolute',
    top: 9,
    left: 6,
    width: 20,
    height: 14,
    borderTopLeftRadius: 11,
    borderTopRightRadius: 11,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 13,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    zIndex: 5,
  },
  wingStreak: {
    position: 'absolute',
    bottom: 3,
    left: 3,
    width: 12,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  feetGroup: {
    position: 'absolute',
    bottom: 4,
    right: 14,
    flexDirection: 'row',
    gap: 3,
    zIndex: 1,
  },
  claw: {
    width: 3.5,
    height: 3,
    backgroundColor: '#5D4037',
    borderRadius: 1,
  },
});

export default VectorBird;
