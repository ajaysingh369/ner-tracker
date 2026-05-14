import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, View, Text, Dimensions, TouchableOpacity } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence, 
  withTiming,
  withRepeat,
  interpolate
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MascotRenderer } from './Mascots';

const { width } = Dimensions.get('window');
const RING_SIZE = width * 0.85;

interface ZenithAvatarProps {
  mood: string;
  isAchieved: boolean;
  steps: number;
  target: number;
  forceTrigger?: number;
  onStateChange?: (state: 'idle' | 'popping' | 'speaking' | 'shrinking' | 'perched') => void;
  ringUiOpacity?: Animated.SharedValue<number>;
}

export default function ZenithAvatar({ mood, isAchieved, steps, target, forceTrigger, onStateChange, ringUiOpacity }: ZenithAvatarProps) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [state, setState] = useState<'idle' | 'popping' | 'speaking' | 'shrinking' | 'perched'>('idle');
  
  const scale = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const bobble = useSharedValue(0);
  const opacity = useSharedValue(0);

  // Perch position: Inline with the bottom status badge/text area in ringCenterText
  const PERCH_X = -55; // Offset to the left of the badge text
  const PERCH_Y = 115; // Offset down to the badge vertical position

  const personas: any = {
    'Steady': {
      name: 'Zenith Monk',
      greetings: ["Consistency is the path to the stars. Walk with peace today.", "The steady river carves the stone. Keep flowing."],
      taunts: ["A calm mind needs a moving body. You're falling behind.", "Even the monk must walk for his alms. Move!"]
    },
    'Surge': {
      name: 'Furious Titan',
      greetings: ["Zenith is hungry. Feed it steps or stay on the couch!", "I smell weakness. Prove me wrong today."],
      taunts: ["My grandmother syncs more steps while making chai. Hustle!", "Is that all? I've seen snails with more hustle."]
    },
    'Growth': {
        name: 'The Warrior',
        greetings: ["Victory is won in the morning. Let's attack the goal!", "A warrior never rests until the mission is done."],
        taunts: ["You call this effort? The leaderboard is laughing.", "Victory belongs to the most persevering. Keep pushing!"]
    },
    'Zenith Overdrive': {
        name: 'The Commander',
        greetings: ["OVERDRIVE DETECTED! Break your records today!", "No limits. No excuses. Show me elite speed."],
        taunts: ["Don't waste this energy. Push harder!", "The stars are waiting for your surge. Go!"]
    }
  };

  const currentPersona = personas[mood] || personas['Steady'];

  useEffect(() => {
    if (onStateChange) onStateChange(state);
  }, [state]);

  useEffect(() => {
    if (forceTrigger) {
        const pool = [...currentPersona.greetings, ...currentPersona.taunts];
        setMessage(pool[Math.floor(Math.random() * pool.length)]);
        triggerInteraction();
    }
  }, [forceTrigger]);

  useEffect(() => {
    checkInteraction();
  }, [mood, isAchieved]);

  const checkInteraction = async () => {
    const today = new Date().toISOString().split('T')[0];
    const lastSeen = await AsyncStorage.getItem('zenith_last_seen');
    const interactionCount = parseInt(await AsyncStorage.getItem('zenith_interaction_count') || '0');

    let shouldShow = false;
    let selectedMsg = "";

    if (isAchieved) {
        shouldShow = true;
        selectedMsg = "GLORIOUS! You've conquered the Zenith. The stars salute you!";
    } else if (lastSeen !== today) {
        shouldShow = true;
        selectedMsg = currentPersona.greetings[Math.floor(Math.random() * currentPersona.greetings.length)];
        await AsyncStorage.setItem('zenith_last_seen', today);
        await AsyncStorage.setItem('zenith_interaction_count', '1');
    } else if (interactionCount < 3) {
        const progress = (steps / target);
        const hour = new Date().getHours();
        if (hour > 16 && progress < 0.6) {
            shouldShow = true;
            selectedMsg = currentPersona.taunts[Math.floor(Math.random() * currentPersona.taunts.length)];
            await AsyncStorage.setItem('zenith_interaction_count', (interactionCount + 1).toString());
        }
    }

    if (shouldShow) {
        setMessage(selectedMsg);
        triggerInteraction();
    }
  };

  const triggerInteraction = () => {
    setVisible(true);
    setState('popping');

    // Smooth pop in, hide ring text
    opacity.value = withTiming(1, { duration: 400 });
    scale.value = withSpring(1, { damping: 15, stiffness: 90 });
    translateX.value = withSpring(0, { damping: 15 });
    translateY.value = withSpring(0, { damping: 15 });
    if (ringUiOpacity) ringUiOpacity.value = withTiming(0, { duration: 300 });

    setTimeout(() => {
        setState('speaking');
        bobble.value = withRepeat(
            withSequence(
                withTiming(-8, { duration: 1500 }),
                withTiming(0, { duration: 1500 })
            ),
            -1,
            true
        );
    }, 600);

    // Smooth Shrink to badge (Ease out Speak -> Ease in Perch), no jumping
    setTimeout(() => {
        setState('shrinking');
        bobble.value = withTiming(0);
        
        // Single fluid motion using withTiming to avoid spring bounce/overshoot
        scale.value = withTiming(0.1, { duration: 600 }); // 20 / 200 = 0.1 scale
        translateX.value = withTiming(PERCH_X, { duration: 600 });
        translateY.value = withTiming(PERCH_Y, { duration: 600 });
        
        // Bring back the ring text (including the badge's MascotRenderer)
        if (ringUiOpacity) ringUiOpacity.value = withTiming(1, { duration: 600 });

        setTimeout(() => {
            // Handoff to the badge's MascotRenderer
            setState('idle');
            setVisible(false);
        }, 650);
    }, 5600);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
        { translateX: translateX.value },
        { translateY: translateY.value + bobble.value },
        { scale: scale.value }
    ],
    opacity: opacity.value,
    zIndex: state === 'perched' ? 5 : 100
  }));

  const speechStyle = useAnimatedStyle(() => ({
    opacity: state === 'speaking' ? withTiming(1) : withTiming(0),
    transform: [
        { scale: state === 'speaking' ? withSpring(1) : withSpring(0) },
        { translateY: -120 }
    ]
  }));

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
        <Animated.View style={[styles.avatarWrapper, animatedStyle]}>
            <TouchableOpacity activeOpacity={1} disabled={true}>
                <MascotRenderer 
                    id={mood} 
                    size={200} 
                    theme={isAchieved ? 'solar' : (mood === 'Surge' ? 'nebula' : 'solar')} 
                />
            </TouchableOpacity>
        </Animated.View>

        {state === 'speaking' && (
            <Animated.View style={[styles.bubble, speechStyle]}>
                <Text style={styles.bubbleText}>{message}</Text>
                <View style={styles.bubbleArrow} />
            </Animated.View>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  avatarWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    position: 'absolute',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    maxWidth: width * 0.75,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    zIndex: 110,
  },
  bubbleText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 20,
  },
  bubbleArrow: {
    position: 'absolute',
    bottom: -8,
    alignSelf: 'center',
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#fff',
  }
});
