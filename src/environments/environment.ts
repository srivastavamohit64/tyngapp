import { envSecrets } from './environment.generated';

export const environment = {
  production: false,
  apiUrl: 'https://tyngpeople.com/api',
  googleMapsApiKey: envSecrets.googleMapsApiKey,
};
// [http://127.0.0.1:8000
//   apiUrl: 'https://tyngpeople.com/api',