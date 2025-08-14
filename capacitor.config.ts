import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.zamper.fit',
  appName: 'ZamperFit',
  webDir: 'dist',
  server: {
    cleartext: true
  },
};

export default config;