export default ({ config }) => {
  return {
    ...config,
    name: "RunAstra",
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
        backgroundColor: "#1a1a24",
        foregroundImage: "./assets/images/icon.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png"
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.runastra.mobileapp",
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON || "./google-services.json",
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
      "./scripts/withProguardRules.js",
      "./scripts/withAndroidSigning.js",
      "./scripts/withAndroidCredentials.js",
      "@react-native-firebase/app",
      "@react-native-firebase/crashlytics",
      "@react-native-firebase/messaging",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/icon.png",
          "imageWidth": 300,
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
            "enableMinifyInReleaseBuilds": true,
            "enableShrinkResourcesInReleaseBuilds": true
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
