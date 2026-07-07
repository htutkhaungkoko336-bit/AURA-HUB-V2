import admin from 'firebase-admin';

if (!admin.apps.length) {
  // ဒီမှာ သင့် JSON file ရဲ့ လမ်းကြောင်းကို ထည့်ပါ
  const serviceAccount = require('../aura-hub-mlbb-matchmaking-firebase-adminsdk-fbsvc-1076b2b0b8.json');

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

export const db = admin.firestore();