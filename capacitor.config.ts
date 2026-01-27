import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rivera.obras',
  appName: 'RiveraCo',
  webDir: 'www',
  server:{
    cleartext:true,
    androidScheme: 'http' 
  },
  plugins:{
    SplashScreen:{
      backgroundColor: "#1E3A8A",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      launchAutoHide: true,
      launchShowDuration: 1500
    }
  }
};

export default config;
