const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, browserSessionPersistence, setPersistence, onAuthStateChanged, signOut, signInWithRedirect, getRedirectResult } = require('firebase/auth');
//const functions = require('firebase/auth');
const { initializeApp } = require('firebase/app');
const { getFirestore, Timestamp, FieldValue } = require("firebase/firestore");
const { collection, addDoc, setDoc, getDoc, getDocs, doc, onSnapshot, updateDoc, increment, query, where, orderBy } = require("firebase/firestore");
//import React, {useState, useEffect} from 'react';
const config = require('./config.js');
const app = initializeApp(config);
const auth = getAuth();
const provider = new GoogleAuthProvider();
provider.addScope(`https://www.googleapis.com/auth/calendar.events`);

const db = getFirestore();

function googleSignIn(email, password) {
  signInWithPopup(auth, provider)
    .then(async (result) => {
      console.log('google signed in');
      // This gives you a Google Access Token. You can use it to access the Google API.
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      // The signed-in user info.
      console.log(token), 'token';
      const user = result.user;
      console.log(user);
      console.log(user.refreshToken);
      let obj = {
        photo: user.photoURL,
        email: user.email,
        displayName: user.displayName
      };
      const response = await setDoc(doc(db, 'info', user.uid), obj);
      const empty = await setDoc(doc(db, 'Messages', user.uid), {});
      console.log('posted info');
      // ...
      // setPersistence(auth, browserSessionPersistence)
      // .then(() => {
      //   console.log('test');
      //   // Existing and future Auth states are now persisted in the current
      //   // session only. Closing the window would clear any existing state even
      //   // if a user forgets to sign out.
      //   // ...
      //   // New sign-in will be persisted with session persistence.
      //   return signInWithEmailAndPassword(auth, state.email, state.password);
      // })
      // .catch((error) => {
      //   // Handle Errors here.
      //   const errorCode = error.code;
      //   const errorMessage = error.message;
      //   console.log(errorCode, errorMessage, 'setpersistence');
      // });
    }).catch((error) => {
      // Handle Errors here.
      console.log('google fail');
      const errorCode = error.code;
      const errorMessage = error.message;
      // The email of the user's account used.
      console.log(errorCode, errorMessage);
      const email = error.email;
      // The AuthCredential type that was used.
      const credential = GoogleAuthProvider.credentialFromError(error);
      // ...
    });
}

function logOut() {
  signOut(auth).then(() => {
    console.log('signout');
    // Sign-out successful.
  }).catch((error) => {
    console.log('signoutfail');
    // An error happened.
  });
}

// function useAuth() {
//   const [currentUser, setCurrentUser] = useState();

//   useEffect(() => {
//     const unsub = onAuthStateChanged(auth, user => {setCurrentUser(user)});
//     return unsub;
//   }, [])

//   return currentUser;
// }

async function write(key, data, collection) {
  //console.log(db);
  await setDoc(
    doc(db, collection, key),
    data
  );
  //console.log('write Languages');
  return true;
}

async function get(key) {
  const docRef = doc(db, 'Users', key);
  const result = await getDoc(docRef);
  if (result.exists()) {
    //console.log(result.data(), 'get');
    return result.data();
  } else {
    return null;
  }
}

async function updateLanguages(key, data) {
  const updateRef = doc(db, "Users", key);

  // Set the "capital" field of the city 'DC'
  await updateDoc(updateRef, {
    languages: data
  });
}

async function getusers(excludeID) {
  let result = [];
  const querySnapshot = await getDocs(collection(db, "Users"));
  querySnapshot.forEach((doc) => {
    let obj = {};
    let user = doc.data();
    if (excludeID === doc.id) {
      return;
    }
    //console.log(doc.id);
    obj.uid = doc.id;
    obj.username = user.username;
    obj.photo = user.photo;
    obj.displayName = user.displayName;
    obj.languages = user.languages;
    result.push(obj);
    // doc.data() is never undefined for query doc snapshots
    //console.log(doc.id, " => ", doc.data());
  });
  return result;
}

async function getMessages(user_ID, other_ID) {

  const allConvosMe = doc(db, 'Messages', other_ID);
  const convosQ = await getDoc(allConvosMe);
  const convos = convosQ.data();
  const getMessagesFromMe = convos[user_ID];


  const allConvosOther = doc(db, 'Messages', user_ID);
  const convosR = await getDoc(allConvosOther);
  const convosOther = convosR.data();
  const getMessagesFromOther = convosOther[other_ID];

  // const getMessagesFromMe = await db.collection('messages').doc(other_ID).where('user_id', '==', user_ID).get();
  // const getMessagesFromOther = await db.collection('messages').doc(user_ID).where('user_id', '==', other_ID).get();

  var inOrderMsg = [];

  var organize = function (indexMe, indexOther) {
    if (getMessagesFromMe[indexMe] === undefined && getMessagesFromOther[indexOther] === undefined) {
      return;
    } else if (getMessagesFromMe[indexMe] === undefined) {
      var obj = {};
      obj[other_ID] = getMessagesFromOther[indexOther].message;
      inOrderMsg.push(obj);
      organize(indexMe, indexOther + 1);
    } else if (getMessagesFromOther[indexOther] === undefined) {
      var obj = {};
      obj[user_ID] = getMessagesFromMe[indexMe].message;
      inOrderMsg.push(obj);
      organize(indexMe + 1, indexOther);
    } else if (getMessagesFromMe[indexMe].time.valueOf() <= getMessagesFromOther[indexOther].time.valueOf()) {
      var obj = {};
      obj[user_ID] = getMessagesFromMe[indexMe].message
      inOrderMsg.push(obj);
      organize(indexMe + 1, indexOther);
    } else {
      var obj = {};
      obj[other_ID] = getMessagesFromOther[indexOther].message;
      inOrderMsg.push(obj);
      organize(indexMe, indexOther + 1);
    }
  }
  if (getMessagesFromMe === undefined && getMessagesFromOther === undefined) {
    inOrderMsg = [];
  } else if (getMessagesFromMe === undefined) {
    for (var i = 0; i < getMessagesFromOther.length; ++i) {
      var obj = {};
      obj[other_ID] = getMessagesFromOther[i].message;
      inOrderMsg.push(obj);
    }
  } else if (getMessagesFromOther === undefined) {
    for (var i = 0; i < getMessagesFromMe.length; ++i) {
      var obj = {};
      obj[user_ID] = getMessagesFromMe[i].message;
      inOrderMsg.push(obj);
    }
  } else {
    organize(0, 0);
  }

  return inOrderMsg;
}

async function postMessages(user_ID, other_ID, time, message) {


  const q = doc(db, 'Messages', other_ID);
  const qQ = await getDoc(q);
  const store = qQ.data();
  const getMessagesFromOther = store[user_ID];
  var time = Timestamp.now();

  //{reviever_ID: sender_ID: {msg}}
  if (getMessagesFromOther) {
    const doc = await getDoc(q);
    const temp = doc.data();
    const chatArr = temp[user_ID];
    var obj = {
      message: message,
      time: time
    };
    chatArr.push(obj);
    temp[user_ID] = chatArr;
    await setDoc(q, temp);
    return true;
  } else {
    const doc = await getDoc(q);
    const temp = doc.data();
    const chatArr = [];
    var obj = {
      message: message,
      time: time
    };
    chatArr.push(obj);
    temp[user_ID] = chatArr;
    await setDoc(q, temp);
    return true
  }
}

async function getChatUsers(user_ID) {
  const getAffiliatedUUID = await db.collection('messages').doc(user_ID).get();
  var userID_displayName = [];
  for (var i = 0; i < getAffiliatedUUID.length; ++i) {
    const displayName = await db.collection(info).doc(getAffiliatedUUID[i]).get();
    var obj = {};
    obj[getAffiliatedUUID[i]] = displayName.username;
    userID_displayName.push(obj);
  }
  return userID_displayName;
}

module.exports = {
  googleSignIn,
  logOut,
  write,
  get,
  updateLanguages,
  getusers,
  getMessages,
  postMessages,
  getChatUsers,
}