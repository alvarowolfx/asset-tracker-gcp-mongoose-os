import React from 'react';
import ReactDOM from 'react-dom';

import firebase from 'firebase/app';
import 'firebase/firestore';

import registerServiceWorker from './shared/registerServiceWorker';

import App from './App';

const config = {
  apiKey: 'AIzaSyDtNB2TmdY5cw6pZ1cJXTby-3GJgSoJPTU',
  authDomain: 'asset-tracker-iot.firebaseapp.com',
  databaseURL: 'https://asset-tracker-iot.firebaseio.com',
  projectId: 'asset-tracker-iot',
  storageBucket: 'asset-tracker-iot.appspot.com',
  messagingSenderId: '36412393718'
};
firebase.initializeApp(config);

const rootDiv = document.getElementById('root');

ReactDOM.render(<App />, rootDiv);
registerServiceWorker();
