import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface Props {
  light?: boolean;
  markOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const wordmark = require('../../assets/splash.png');
const mark = require('../../assets/icon.png');

export function TruvoWordmark({ markOnly, size = 'md' }: Props) {
  const imageStyle = markOnly ? markStyles[size] : wordmarkStyles[size];

  return (
    <View style={styles.container}>
      <Image source={markOnly ? mark : wordmark} style={imageStyle} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
});

const wordmarkStyles = StyleSheet.create({
  sm: {
    width: 132,
    height: 54,
  },
  md: {
    width: 184,
    height: 74,
  },
  lg: {
    width: 248,
    height: 100,
  },
});

const markStyles = StyleSheet.create({
  sm: {
    width: 48,
    height: 48,
  },
  md: {
    width: 72,
    height: 72,
  },
  lg: {
    width: 104,
    height: 104,
  },
});
