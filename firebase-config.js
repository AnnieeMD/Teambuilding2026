/*
  firebase-config.js
  ──────────────────
  Plain global variable — loaded before db.js via <script src="...">
  No import/export here; db.js reads FIREBASE_CONFIG as a global.

  To find your databaseURL:
  Firebase Console → Realtime Database → Data tab
  It looks like: https://<project>-default-rtdb.<region>.firebasedatabase.app
*/

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyA0ZhBMJ3NMpZHcSqSLs5gEvAab82oykAQ",
  authDomain:        "teambuilding2026-ca528.firebaseapp.com",
  databaseURL:       "https://teambuilding2026-ca528-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId:         "teambuilding2026-ca528",
  storageBucket:     "teambuilding2026-ca528.firebasestorage.app",
  messagingSenderId: "843542421445",
  appId:             "1:843542421445:web:8cf343f010a8101da975ac"
};
