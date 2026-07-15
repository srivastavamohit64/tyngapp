import { envSecrets } from './environment.generated';

export const environment = {
  production: true,
  apiUrl: 'http://127.0.0.1:8000/api',
  googleMapsApiKey: envSecrets.googleMapsApiKey,
};
