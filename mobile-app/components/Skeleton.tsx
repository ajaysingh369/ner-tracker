import React, { useEffect } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface SkeletonProps {
  width: number | string;
  height: number;
  borderRadius?: number;
}

export default function Skeleton({ width, height, borderRadius = 16 }: SkeletonProps) {
  const opacity = new Animated.Value(0.3);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[{ width: width as any, height, borderRadius, opacity, backgroundColor: 'rgba(255,255,255,0.08)' }]} />  );
}

const styles = StyleSheet.create({});
