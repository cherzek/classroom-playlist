// This file should NOT contain firebaseConfig or firebase.initializeApp()
// Those are handled in the HTML.

document.addEventListener('DOMContentLoaded', () => {
  // Get references to Firebase services AFTER they have been initialized in HTML
  // (This assumes the HTML has initialized `firebase` globally)
  const db = firebase.firestore(); // Now should be defined
  const functions = firebase.functions(); // Now should be defined

  // --- Teacher's Setup Page Logic ---
  const setupForm = document.getElementById('setupForm');
  if (setupForm) {
    setupForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      alert("Frontend is connected to Firebase! (Functions service available)");
      console.log("Firestore (db) reference:", db);
      console.log("Functions (functions) reference:", functions);

      // Example of calling a Firebase Function (this won't work yet as function is not deployed)
      // const callableFunction = functions.httpsCallable('myFunctionName');
      // const result = await callableFunction({ someData: 'value' });
      // console.log(result.data);
    });
  }

  // --- Student's Page Logic ---
  const playlistContainer = document.getElementById('playlistContainer');
  if (playlistContainer) {
    console.log("Student page loaded. (Firestore and Functions services available)");
  }
});

function copyLink() {
  const linkInput = document.getElementById('shareLink');
  linkInput.select();
  navigator.clipboard.writeText(linkInput.value);
  alert("Link copied to clipboard!");
}