import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { StyleSheet, View, Image } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 25,
          left: 20,
          right: 20,
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
          elevation: 10,
          height: 75,
          borderRadius: 24,
          paddingBottom: 0,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.05)',
        },
        tabBarBackground: () => (
          <View style={{ flex: 1, borderRadius: 24, overflow: 'hidden' }}>
            <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          </View>
        ),
        tabBarActiveTintColor: '#ff7a00',
        tabBarInactiveTintColor: '#666677',
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 10,
        },
        tabBarItemStyle: {
          paddingTop: 10,
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ color }) => <Ionicons name="trophy-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Leaderboard',
          tabBarIcon: ({ color }) => <Ionicons name="bar-chart-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <Image 
              source={{ uri: 'https://ui-avatars.com/api/?name=Ajay+Singh&background=ff7a00&color=fff' }} 
              style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: color }} 
            />
          ),
        }}
      />
    </Tabs>
  );
}
