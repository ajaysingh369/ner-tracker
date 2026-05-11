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
    newArchEnabled: false,
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
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
            "minSdkVersion": 26
          },
          "ios": {
            "useFrameworks": "static"
          }
        }
      ],
      "expo-web-browser"
    ],
    experiments: {
      "typedRoutes": true,
      "reactCompiler": true
    }
  };
};
