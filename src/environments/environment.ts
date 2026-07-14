import { envSecrets } from './environment.generated';

export const environment = {
  production: false,
  apiUrl: 'http://127.0.0.1:8000/api',
  googleMapsApiKey: envSecrets.googleMapsApiKey,
};
