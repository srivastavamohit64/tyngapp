import { envSecrets } from './environment.generated';

export const environment = {
  production: true,
  apiUrl: 'https://tyngpeople.com/api',
  googleMapsApiKey: envSecrets.googleMapsApiKey,
  reverb: {
    // Set enabled=true after Reverb is deployed behind wss on the live host.
    enabled: true,
    key: '',
    host: 'tyngpeople.com',
    port: 443,
    scheme: 'https',
    channel: 'nearby-games',
  },
};
