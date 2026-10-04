import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

interface CandyProps {
  color: string;
  size?: number;
}

export const VectorBird: React.FC<CandyProps> = ({ color, size = 42 }) => {
  const s = size;

  // 1. RED HEART (Video Style Glossy Red Heart)
  if (color === 'red') {
    return (
      <View style={[styles.center, { width: s, height: s }]}>
        <View style={[styles.heartShape, { width: s * 0.82, height: s * 0.78 }]}>
          <Text style={{ fontSize: s * 0.62, color: '#FF1744' }}>❤️</Text>
          <View style={styles.topGlossSpot} />
        </View>
      </View>
    );
  }

  // 2. YELLOW STAR (Video Style Golden 5-Star Candy)
  if (color === 'yellow') {
    return (
      <View style={[styles.center, { width: s, height: s }]}>
        <View style={[styles.starShape, { width: s * 0.88, height: s * 0.88 }]}>
          <Text style={{ fontSize: s * 0.72, color: '#FFD700' }}>⭐</Text>
          <View style={styles.topGlossSpot} />
        </View>
      </View>
    );
  }

  // 3. BLUE SQUARE CUBE (Video Style Cyan Ice-Cube Candy)
  if (color === 'blue') {
    return (
      <View style={[styles.center, { width: s, height: s }]}>
        <View style={[styles.blueCube, { width: s * 0.76, height: s * 0.76 }]}>
          <View style={styles.cubeReflection} />
          <View style={styles.cubeCenterGem} />
        </View>
      </View>
    );
  }

  // 4. GREEN ROUND/CLOVER (Video Style Green Gem)
  if (color === 'green') {
    return (
      <View style={[styles.center, { width: s, height: s }]}>
        <View style={[styles.greenGem, { width: s * 0.78, height: s * 0.78 }]}>
          <View style={styles.gemGlossGleam} />
          <Text style={{ fontSize: s * 0.44 }}>🍀</Text>
        </View>
      </View>
    );
  }

  // 5. PURPLE DROP/FLOWER (Video Style Violet Drop Candy)
  if (color === 'purple') {
    return (
      <View style={[styles.center, { width: s, height: s }]}>
        <View style={[styles.purpleDrop, { width: s * 0.78, height: s * 0.78 }]}>
          <View style={styles.gemGlossGleam} />
          <Text style={{ fontSize: s * 0.48 }}>🌸</Text>
        </View>
      </View>
    );
  }

  // 6. ORANGE JELLY BEAN (Video Style Orange Bean Candy)
  return (
    <View style={[styles.center, { width: s, height: s }]}>
      <View style={[styles.orangeBean, { width: s * 0.84, height: s * 0.64 }]}>
        <View style={styles.beanWhiteGloss} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  topGlossSpot: {
    position: 'absolute',
    top: 2,
    left: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },
  heartShape: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  starShape: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  blueCube: {
    backgroundColor: '#00D2D3',
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: '#01A3A4',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#01A3A4',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 5,
  },
  cubeReflection: {
    position: 'absolute',
    top: 2,
    left: 3,
    width: '40%',
    height: '25%',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 6,
  },
  cubeCenterGem: {
    width: '36%',
    height: '36%',
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  greenGem: {
    backgroundColor: '#10AC84',
    borderRadius: 25,
    borderWidth: 2.5,
    borderColor: '#1DD1A1',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  purpleDrop: {
    backgroundColor: '#5F27CD',
    borderRadius: 22,
    borderWidth: 2.5,
    borderColor: '#341F97',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  gemGlossGleam: {
    position: 'absolute',
    top: 3,
    left: 5,
    width: '35%',
    height: '28%',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 10,
  },
  orangeBean: {
    backgroundColor: '#FF9F43',
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: '#EE5253',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  beanWhiteGloss: {
    position: 'absolute',
    top: 2,
    left: 6,
    width: '50%',
    height: '30%',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 10,
  },
});
