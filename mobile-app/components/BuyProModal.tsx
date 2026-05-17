import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import BottomSheetNotice from './BottomSheetNotice';

export default function BuyProModal({ visible, onClose }: { visible: boolean, onClose: () => void }) {
    return (
        <BottomSheetNotice 
            visible={visible}
            onClose={onClose}
            type="info"
            title="🚀 Upgrade to Astra Pro"
            message="Unlock the full power of Zenith AI with professional biomechanical analysis, injury prevention alerts, and personalized tactical masterplans."
        />
    );
}
