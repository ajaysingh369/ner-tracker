export default ({ config }) => {
  // Detection: Check if we are in a dev environment
  const IS_DEV = process.env.EXPO_PUBLIC_APP_VARIANT === 'development' || 
                 process.env.NODE_ENV === 'development' || 
                 !process.env.NODE_ENV;
  return {
    ...config,
    name: IS_DEV ? "[DEV] RunAstra" : "RunAstra",
    slug: "runastra",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "mobileapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/icon.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png"
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.runastra.mobileapp",
      permissions: [
        "android.permission.health.READ_STEPS",
        "android.permission.health.WRITE_STEPS",
        "android.permission.health.READ_DISTANCE",
        "android.permission.health.WRITE_DISTANCE",
        "android.permission.ACTIVITY_RECOGNITION"
      ]
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      "./scripts/withHealthConnectDelegate.js",
      "./scripts/withHealthConnectManifest.js",
      "./scripts/withMicrophonePermission.js",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 400,
          "resizeMode": "contain",
          "backgroundColor": "#1a1a24",
          "dark": {
            "backgroundColor": "#1a1a24"
          }
        }
      ],
      "@react-native-google-signin/google-signin",
      [
        "react-native-health-connect",
        {
          "rationaleAndroid": "RunAstra needs to read your steps and distance to calculate your Zenith and sync your fitness journey."
        }
      ],
      "react-native-health",
      [
        "expo-build-properties",
        {
          "android": {
            "kotlinVersion": "2.0.0",
            "minSdkVersion": 26,
            "compileSdkVersion": 36,
            "targetSdkVersion": 36,
            "enableMinifyInReleaseBuilds": !IS_DEV,
            "enableShrinkResourcesInReleaseBuilds": !IS_DEV
          },
          "ios": {
            "useFrameworks": "static"
          }
        }
      ],
      "expo-web-browser",
      [
        "react-native-google-mobile-ads",
        {
          // PRODUCTION ANDROID APP ID: "ca-app-pub-7343438322975352~3537379775"
          "androidAppId": "ca-app-pub-3940256099942544~3347511713",
          "iosAppId": "ca-app-pub-3940256099942544~1458002511"
        }
      ]
    ],
    experiments: {
      "typedRoutes": true,
      "reactCompiler": true
    }
  };
};
