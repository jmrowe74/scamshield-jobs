import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.scamshieldjobs.app',
  appName: 'ScamShield Jobs',
  webDir: 'public',
  server: {
    url: 'https://scamshieldjobs.com',
    cleartext: false
  }
};

export default config;
