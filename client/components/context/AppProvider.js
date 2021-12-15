import { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { initializeApp } from 'firebase/app';

import firebaseConfig from "../homepage/FirebaseConfig";

const app = initializeApp(firebaseConfig);
const auth = getAuth();

const AppContext = createContext({});

function AppProvider({ children }) {
  const [user, setUser] = useState({});
  //const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, result => {
      console.log('onauth', result);
      setUser(result);
      //setLoading(false)
    })
    return unsub;
  }, [])

  const [curUser, setCurUser] = useState({
    uid: 'test uid',
    username: 'TestUsername',
    displayName: 'TestDisplayname',
    photo: '/assets/profile.png',
    languages: {
      Chinese: 2,
      Japanese: 2,
      English: 4,
    },
  });

  const [languagesList, setLanguagesList] = useState([
    { label: 'English', value: 'English' },
    { label: 'Chinese', value: 'Chinese' },
    { label: 'French', value: 'French' },
    { label: 'German', value: 'German' },
    { label: 'Italian', value: 'Italian' },
    { label: 'Japanese', value: 'Japanese' },
    { label: 'Korean', value: 'Korean' },
    { label: 'Portuguese', value: 'Portuguese' },
    { label: 'Russian', value: 'Russian' },
    { label: 'Spanish', value: 'Spanish' },
    { label: 'Swedish', value: 'Swedish' },
  ]);

  const [levelList, setLevelList] = useState([
    { label: 'Entry', value: 'Entry' },
    { label: 'Intermediate', value: 'Intermediate' },
    { label: 'Advanced', value: 'Advanced' },
    { label: 'Native', value: 'Native' },
  ]);

  return (
    <AppContext.Provider value={{curUser, setCurUser, languagesList, setLanguagesList, levelList, setLevelList, user}}>
      {children}
    </AppContext.Provider>
  );
}

function useApp() {
  //console.log('yo');
  const result = useContext(AppContext);
  console.log('here' + result);
  return result;
}

export { AppContext, AppProvider, useApp };