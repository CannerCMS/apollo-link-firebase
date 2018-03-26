import * as firebase from 'firebase';

firebase.initializeApp({
  apiKey: 'AIzaSyAwzjZJD7SUCRC42mL7A9sw4VPIvodQH98',
  authDomain: 'apollo-test-2c6af.firebaseapp.com',
  databaseURL: 'https://apollo-test-2c6af.firebaseio.com',
  projectId: 'apollo-test-2c6af',
  storageBucket: '',
  messagingSenderId: '84103499922'
});

export const initialize = () => new Promise((resolve, reject) => {
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      resolve(user);
    }
  });
  firebase.auth().signInAnonymously().catch(error => {
    reject(error);
  });
})
.then(() => {
  return firebase.app();
});
