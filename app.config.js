/**
 * Configuración de Expo con soporte para variables de entorno
 * Las variables con prefijo EXPO_PUBLIC_ están disponibles en la app
 */

module.exports = {
  expo: {
    name: "Gallinapp",
    slug: "gallinapp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "gallinapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    description: "Aplicación profesional para gestión avícola integral. Controla tus lotes de gallinas ponedoras, pollos de engorde y levante con tecnología de punta.",
    keywords: ["avícola", "gallinas", "pollos", "gestión", "granja", "productividad"],
    privacy: "public",
    githubUrl: "https://github.com/gallinapp/gallinapp",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.gallinapp.pro",
      buildNumber: "1",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSLocationWhenInUseUsageDescription: "Gallinapp necesita acceso a la ubicación para registrar la localización de tus lotes.",
        NSCameraUsageDescription: "Gallinapp necesita acceso a la cámara para tomar fotos de tus lotes.",
        NSPhotoLibraryUsageDescription: "Gallinapp necesita acceso a tus fotos para adjuntar imágenes a los registros."
      },
      config: {
        usesNonExemptEncryption: false
      }
    },
    android: {
      package: "com.gallinapp.pro",
      versionCode: 1,
      adaptiveIcon: {
        backgroundColor: "#345DAD",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png"
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: [
        "NOTIFICATIONS",
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE",
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ]
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
      bundler: "metro",
      name: "Gallinapp - Gestión Avícola Profesional",
      shortName: "Gallinapp",
      lang: "es",
      scope: "/",
      themeColor: "#345DAD",
      backgroundColor: "#FFFFFF"
    },
    plugins: [
      "expo-router",
      "expo-font",
      "expo-web-browser",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000"
          }
        }
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/images/notification-icon.png",
          color: "#345DAD",
          sounds: [],
          mode: "production"
        }
      ]
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    },
      extra: {
        router: {},
        eas: {
          projectId: "d298378b-ccaf-46a4-8c4b-480efc4e09d3"
        },
        gallinapp: {
        apiUrl: "https://api.gallinapp.com",
        supportEmail: "soporte@gallinapp.com",
        websiteUrl: "https://gallinapp.com"
      },
      // Variables de entorno de Google OAuth
      googleClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "58539992128-orbman05sk0j6qjspo32femr44ervmq0.apps.googleusercontent.com",
      googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "58539992128-orbman05sk0j6qjspo32femr44ervmq0.apps.googleusercontent.com",
      googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "58539992128-orbman05sk0j6qjspo32femr44ervmq0.apps.googleusercontent.com",
      googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "58539992128-orbman05sk0j6qjspo32femr44ervmq0.apps.googleusercontent.com",
      // Variables de entorno para Suscripciones
      revenueCatApiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY || '',
      revenueCatAppId: process.env.EXPO_PUBLIC_REVENUECAT_APP_ID || '',
      stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
      // Variables de entorno para Firebase
      firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
      firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
      firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
      firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
      firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
    },
    primaryColor: "#345DAD",
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#FFFFFF",
      imageWidth: 200
    },
    runtimeVersion: {
      policy: "appVersion"
    },
  }
};



