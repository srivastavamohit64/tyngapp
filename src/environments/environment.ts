import { envSecrets } from './environment.generated';

export const environment = {
  production: false,
  apiUrl: 'https://tyngpeople.com/api',
  googleMapsApiKey: envSecrets.googleMapsApiKey,
};
