require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json());
const port = require('../port.js');

const { listEvents, createEvent } = require('../calendar.js');
const { loadClient } = require('../googleCalApiClient.js');

//import { route } from 'express/lib/application';
//import { writeLanguages } from '../helpers.js';
const firefunctions = require('../helpers.js');
const req = require('express/lib/request');


app.get('/', (req, res) => {
  res.send('Hello World');
});


//#region user auth

app.get('/auth', async (req, res) => {
  const result = await firefunctions.get(req.query.uid);
  if (result === null) {
    res.send(400);
  } else {
    res.status(200).send(result);
  }
});

app.post('/auth', async (req, res) => {
  const data = req.body.info;
  /*
  data = {
    displayName: ,
    languages: {
      Chinese: 2,
      Korean: 2,
    }
    uid: ,
    email: ,
    apikey: ,
    refreshtoken: ,
    photoURL: ,
  }
  */
  const usersWrite = await firefunctions.write(req.body.uid, data, 'Users');
  const messageWrite = await firefunctions.write(req.body.uid, {}, 'Messages');
  res.send(201);
});

app.get('/user', async (req, res) => {
  let result = {};
  const response = await firebasefunctions.get(req.query.uid);
  result.uid = req.query.uid;
  result.username = response.username;
  result.displayName = response.displayName;
  result.photo = response.photo;
  result.languages = response.languages;
  res.status(200).send(result);
});

app.get('/users', async (req, res) => {
  /*
  [
  {
    uid:
    username:
    displayName:
    photo:
    languages: {
      Chinese: 2,
      Japanese: 2,
    },
  },
  ]
  */
  const result = await firebasefunctions.getusers();
  res.status(200).send(result);
})

//#endregion


//#region chat

const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');

const serviceAccount = require('./path/to/serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

app.get('/chat', async (req, res) => {
  const getMessagesFromMe = await db.collection('messages').doc(req.query.sender_ID).where('user_id', '==', req.query.reciever_ID).get();
  const getMessagesFromOther = await db.collection('messages').doc(req.query.reciever_ID).where('user_id', '==', req.query.sender_ID).get();

  var inOrderMsg = [];

  var organize = function(indexMe, indexOther) {
    if (getMessagesFromMe[indexMe] === undefined && getMessagesFromOther[indexOther] === undefined) {
      return;
    } else if (getMessagesFromMe[indexMe] === undefined) {
      inOrderMsg.push({req.query.sender_ID:getMessagesFromOther[indexOther]});
      organize(indexMe, indexOther + 1);
    } else if (getMessagesFromOther[indexOther] === undefined) {
      inOrderMsg.push({req.query.reciever_ID: getMessagesFromMe[indexMe]});
      organize(indexMe+1, indexOther);
    } else if (getMessagesFromMe[indexMe].Time >= getMessagesFromOther[indexOther].Time) {
      inOrderMsg.push({req.query.sender_ID: getMessagesFromMe[indexMe]});
      organize(indexMe+1, indexOther);
    } else {
      inOrderMsg.push({req.query.reciever_ID: getMessagesFromOther[indexOther]});
      organize(indexMe, indexOther+1);
    }
  }

  organize(0,0);

  res.send(inOrderMsg);
});

app.post('/chat', async (req, res) => {
  const getMessagesFromOther = await db.collection('messages').doc(req.body.reciever_ID).where('user_id', '==', req.query.sender_ID).get();

  //{reviever_ID: sender_ID: {msg}}
  if (getMessagesFromOther) {
    db.collection('messages').doc(req.body.reciever_ID).update({
      req.body.sender_ID: FieldValue.arrayUnion({
        message: req.body.message,
        Time: req.body.timestamp
      })
    }).then((suc, err) => {
      if (err) {
        req.sendStatus(404);
      } else {
        req.sendStatus(201);
      }
    })
  } else {
    db.collection('messages').doc(req.body.reciever_ID).set({
      req.body.sender_ID: [{
        message: req.body.message,
        time: req.body.timestamp
      }]
    }).then((suc, err) => {
      if (err) {
        res.sendStatus(404);
      } else {
        res.sendStatus(201);
      }
    })
  }

});

//azure translation
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

var subscriptionKey = require('../Azure_api_config.js');
var endpoint = "https://api.cognitive.microsofttranslator.com";

app.get('/chat/translation', async (req, res) => {
  var location = "westus2";
  var language = req.query.language;
  const messages = await db.collection('messages').doc(req.query.sender_ID).where('user_id', '==', req.query.reciever_ID);
  // const messages = [{Time: '4:30', message:'Hello there'}, {Time: '5:00', message: 'Wow. Ignore me. That is cool'}, {Time: '6:00', message: 'Baby come back'}];
  var translatedMessages = [];
  for (var i = 0; i < messages.length; ++i) {
    await axios({
      baseURL: endpoint,
      url: '/translate',
      method: 'post',
      headers: {
          'Ocp-Apim-Subscription-Key': subscriptionKey.token,
          'Ocp-Apim-Subscription-Region': location,
          'Content-type': 'application/json',
          'X-ClientTraceId': uuidv4().toString()
      },
      params: {
          'api-version': '3.0',
          'to': language
      },
      data: [{
          'text': messages[i].message
      }],
      responseType: 'json'
    }).then((result) => {
      translatedMessages.push(result.data[0]['translations'][0]['text']);
    });
  }
  res.send(translatedMessages);
})

//#endregion

//#region calendar

loadClient();

app.get('/calendar/list', async (req, res) => {

  await listEvents((events) => {
    res.send(events);
  })
});

app.post('/calendar/create', async (req, res) => {

  await createEvent((events) => {
    res.send(events);
  })
});

//#endregion

//#region video
app.get('/video', (req, res) => {
  res.send('Hello World');
});
//#endregion


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
});