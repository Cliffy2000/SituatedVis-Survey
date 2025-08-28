// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCDvS6_XW11__L72dR4gjBALtgrb8Q2bok",
  authDomain: "situatedvis-survey.firebaseapp.com",
  projectId: "situatedvis-survey",
  storageBucket: "situatedvis-survey.firebasestorage.app",
  messagingSenderId: "1069467495827",
  appId: "1:1069467495827:web:8465d20426bfc7cba94c66",
  measurementId: "G-Q6J6QJVMW7"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Initialize Auth
const auth = firebase.auth();

// Function to save user data
async function saveUserData(data) {
  try {
    // Add timestamp if not present
    if (!data.metadata.timestamp) {
      data.metadata.timestamp = new Date().toISOString();
    }
    
    // Create a unique document ID based on username and timestamp
    const docId = `${data.metadata.userName}_${data.metadata.setupName}_${Date.now()}`;
    
    // Save to Firestore
    await db.collection('userResponses').doc(docId).set(data);
    
    console.log('Data successfully saved to Firebase!');
    return true;
  } catch (error) {
    console.error('Error saving data to Firebase:', error);
    return false;
  }
}

// Function to get all responses (optional, for admin use)
async function getAllResponses() {
  try {
    const snapshot = await db.collection('userResponses').get();
    const responses = [];
    snapshot.forEach(doc => {
      responses.push({
        id: doc.id,
        ...doc.data()
      });
    });
    return responses;
  } catch (error) {
    console.error('Error fetching responses:', error);
    return [];
  }
}