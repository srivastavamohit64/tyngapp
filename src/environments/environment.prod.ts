import { envSecrets } from './environment.generated';

export const environment = {
  production: true,
  apiUrl: 'https://tyngpeople.com/api',
  googleMapsApiKey: envSecrets.googleMapsApiKey,
};
