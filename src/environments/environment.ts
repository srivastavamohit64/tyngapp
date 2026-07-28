import { envSecrets } from './environment.generated';

export const environment = {
  production: false,
  apiUrl: 'https://tyngpeople.com/api',
  googleMapsApiKey: envSecrets.googleMapsApiKey,
  // Firebase Realtime Database (replaces Laravel Reverb)
  firebase: {
    enabled: true,
    apiKey: 'AIzaSyBvHY2HbmgEau-DVO10-oiYr9FFuB5wDqU',
    authDomain: 'tyng-64f71.firebaseapp.com',
    databaseURL: 'https://tyng-64f71-default-rtdb.firebaseio.com',
    projectId: 'tyng-64f71',
    storageBucket: 'tyng-64f71.firebasestorage.app',
    messagingSenderId: '209498346476',
    appId: '',
    path: 'realtime/nearby-games',
  },
};
