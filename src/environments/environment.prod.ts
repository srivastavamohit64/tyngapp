import { envSecrets } from './environment.generated';

export const environment = {
  production: true,
  apiUrl: 'https://your-production-domain.com/api',
  googleMapsApiKey: envSecrets.googleMapsApiKey,
};
