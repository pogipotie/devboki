import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.boki.kiosk',
  appName: 'BOKI Kiosk',
  webDir: 'dist-kiosk',
  server: {
    url: 'https://devboki.vercel.app/kiosk',
    allowNavigation: ['devboki.vercel.app', '*.vercel.app'],
    // Force UTF-8 encoding for external content
    headers: {
      'Content-Type': 'text/html; charset=UTF-8',
      'Accept-Charset': 'UTF-8'
    }
  },
  android: {
    webContentsDebuggingEnabled: true,
    allowMixedContent: true,
    captureInput: true,
  },
  ios: {
    allowsLinkPreview: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: "#ffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    StatusBar: {
      style: 'default',
      backgroundColor: '#ffffff',
    },
  },
  cordova: {
    preferences: {
      'Orientation': 'landscape',
      'Fullscreen': 'true',
      'KeepRunning': 'true',
      'DisallowOverscroll': 'true',
      'EnableViewportScale': 'false',
      'AllowInlineMediaPlayback': 'true',
      'MediaPlaybackRequiresUserAction': 'false',
      'LoadUrlTimeoutValue': '60000',
      'WebViewEngine': 'Crosswalk',
    }
  }
};

export default config;
