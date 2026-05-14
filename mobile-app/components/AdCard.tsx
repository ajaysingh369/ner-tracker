import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeAd, NativeAdView, NativeAsset, NativeAssetType, TestIds } from 'react-native-google-mobile-ads';
import Skeleton from './Skeleton';

const { width } = Dimensions.get('window');

// In production, we would use process.env to determine the real Ad Unit ID based on platform.
// PRODUCTION ANDROID AD UNIT ID: 'ca-app-pub-7343438322975352/8773394587'
const adUnitId = TestIds.NATIVE; 

export default function AdCard() {
  const [nativeAd, setNativeAd] = useState<NativeAd | null>(null);
  const [isLoading, setIsLoading] = useState(Platform.OS !== 'web'); // Skip loading on web
  const [error, setError] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    let isMounted = true;
    let currentAd: NativeAd | null = null;

    const loadAd = async () => {
      try {
        currentAd = await NativeAd.createForAdRequest(adUnitId);
        if (isMounted) {
          setNativeAd(currentAd);
          setIsLoading(false);
        }
      } catch (e) {
        console.error("Failed to load Native Ad:", e);
        if (isMounted) {
          setError(true);
          setIsLoading(false);
        }
      }
    };

    loadAd();

    return () => {
      isMounted = false;
      if (currentAd) {
        currentAd.destroy();
      }
    };
  }, []);

  if (isLoading) {
    return <Skeleton width={width * 0.85} height={160} borderRadius={24} />;
  }

  // Web fallback or Error fallback uses the static UI
  if (Platform.OS === 'web' || error || !nativeAd) {
    return (
      <TouchableOpacity activeOpacity={0.9}>
        <View style={styles.bannerCard}>
          <Image source={{ uri: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" }} style={styles.bannerImage} />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.bannerGradient}>
            <View style={styles.adBadge}><Text style={styles.adBadgeText}>Ad</Text></View>
            <Text style={styles.bannerTitle}>Premium Running Gear</Text>
            <Text style={styles.bannerSubtitle}>Up to 40% off on trail shoes this weekend only.</Text>
            <Text style={styles.advertiserText}>Sponsored by Astra Athletics</Text>
          </LinearGradient>
        </View>
      </TouchableOpacity>
    );
  }

  // ── Native Render ────────────────────────────────────────────────────────
  return (
    <NativeAdView nativeAd={nativeAd} style={styles.bannerCard}>
      {nativeAd.images && nativeAd.images.length > 0 && (
        <NativeAsset assetType={NativeAssetType.IMAGE}>
          <Image source={{ uri: nativeAd.images[0].url }} style={styles.bannerImage} />
        </NativeAsset>
      )}
      
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.bannerGradient}>
        <View style={styles.adBadge}>
          <Text style={styles.adBadgeText}>Ad</Text>
        </View>
        
        {nativeAd.headline && (
          <NativeAsset assetType={NativeAssetType.HEADLINE}>
            <Text style={styles.bannerTitle} numberOfLines={1}>{nativeAd.headline}</Text>
          </NativeAsset>
        )}
        
        {nativeAd.body && (
          <NativeAsset assetType={NativeAssetType.BODY}>
            <Text style={styles.bannerSubtitle} numberOfLines={2}>{nativeAd.body}</Text>
          </NativeAsset>
        )}

        {nativeAd.advertiser && (
          <NativeAsset assetType={NativeAssetType.ADVERTISER}>
            <Text style={styles.advertiserText}>Sponsored by {nativeAd.advertiser}</Text>
          </NativeAsset>
        )}
      </LinearGradient>
    </NativeAdView>
  );
}

const styles = StyleSheet.create({
  bannerCard: { 
    width: width * 0.85, 
    height: 160, 
    borderRadius: 24, 
    marginRight: 16, 
    overflow: 'hidden', 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.1)' 
  },
  bannerImage: { width: '100%', height: '100%', position: 'absolute' },
  bannerGradient: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    height: '80%', 
    padding: 20, 
    justifyContent: 'flex-end' 
  },
  adBadge: { 
    position: 'absolute', 
    top: -30, 
    left: 20, 
    backgroundColor: '#FFD27D', 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 4,
    zIndex: 10
  },
  adBadgeText: { 
    color: '#000', 
    fontSize: 9, 
    fontWeight: '900', 
    textTransform: 'uppercase',
    letterSpacing: 0.5 
  },
  bannerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  bannerSubtitle: { color: '#fff', opacity: 0.9, fontSize: 12, marginTop: 4 },
  advertiserText: { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 6, fontWeight: '600' }
});