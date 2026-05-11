import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#ff7a00',
        tabBarInactiveTintColor: '#666677',
        tabBarStyle: {
          position: 'absolute',
          bottom: insets.bottom > 0 ? insets.bottom + 10 : 20,
          left: 20,
          right: 20,
          height: 70,
          borderRadius: 35,
          backgroundColor: 'rgba(28, 29, 46, 0.9)',
          borderTopWidth: 0,
          elevation: 0,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarBackground: () => (
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        ),
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'AI Coach',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="fitness" color={color} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Rank',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="trophy" color={color} />,
        }}
      />
      {/* Profile tab removed and moved to Header Avatar */}
    </Tabs>
  );
}
