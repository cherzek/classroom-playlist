  // This function runs when the page has loaded
  document.addEventListener("DOMContentLoaded", function() {
    
    // --- Logic for the Teacher's Setup Page (index.html) ---
    const setupForm = document.getElementById("setupForm");
    if (setupForm) {
      setupForm.addEventListener("submit", function(event) {
        event.preventDefault(); 
        const playlistUrl = document.getElementById("playlistUrl").value;
        const statusDiv = document.getElementById("status");
        statusDiv.innerHTML = '<div class="d-flex align-items-center"><strong>Generating...</strong><div class="spinner-border ms-auto" role="status" aria-hidden="true"></div></div>';
        
        google.script.run
          .withSuccessHandler(function(shareLink) {
            statusDiv.innerHTML = "";
            document.getElementById("shareLink").value = shareLink;
            document.getElementById("shareLinkContainer").style.display = "block";
          })
          .withFailureHandler(function(error) {
            statusDiv.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
          })
          .generateSubmissionLink(playlistUrl);
      });
    }

    // --- Logic for the Student's Page (student.html) ---
    const playlistContainer = document.getElementById("playlistContainer");
    if (playlistContainer) {
      const playlistId = document.getElementById("playlistId").value;

      // Make loadPlaylist globally accessible so we can call it after voting
      window.loadPlaylist = function() {
        playlistContainer.innerHTML = `<div class="text-center"><div class="spinner-border" role="status"></div><p>Loading playlist...</p></div>`;
        google.script.run
          .withSuccessHandler(displayTracks)
          .withFailureHandler(showError)
          .getPlaylistTracksWithVotes(playlistId);
      }

      function displayTracks(tracks) {
        playlistContainer.innerHTML = "";
        if (!tracks || tracks.length === 0) {
          playlistContainer.innerHTML = "<p class='text-center text-muted'>This playlist is empty. Add the first song!</p>";
          return;
        }
        tracks.forEach(track => {
          const trackElement = document.createElement('div');
          trackElement.className = 'track-item d-flex align-items-center mb-3';
          trackElement.id = track.playlistItemId;
          trackElement.innerHTML = `
            <img src="${track.thumbnail}" class="track-thumbnail me-3">
            <div class="flex-grow-1">
              <strong>${track.title}</strong>
            </div>
            <div class="vote-buttons text-center">
              <button class="btn btn-sm btn-outline-success" onclick="castVote('${track.playlistItemId}', 'up')"><i class="bi bi-arrow-up"></i></button>
              <span class="vote-count fw-bold">${track.votes.up - track.votes.down}</span>
              <button class="btn btn-sm btn-outline-danger" onclick="castVote('${track.playlistItemId}', 'down')"><i class="bi bi-arrow-down"></i></button>
            </div>
          `;
          playlistContainer.appendChild(trackElement);
        });
      }

      function showError(error) {
        playlistContainer.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
      }
      
      // Initial playlist load
      window.loadPlaylist();

      // **FIXED**: Add Song Form Logic was missing
      const addSongForm = document.getElementById("addSongForm");
      const addSongStatus = document.getElementById("addSongStatus");
      addSongForm.addEventListener("submit", function(event) {
        event.preventDefault();
        const videoUrl = document.getElementById("videoUrl").value;
        addSongStatus.innerHTML = `<div class="text-center"><div class="spinner-border spinner-border-sm" role="status"></div> Adding song...</div>`;
        
        google.script.run
          .withSuccessHandler(function(newTrack) {
            addSongStatus.innerHTML = `<div class="alert alert-success">Song added successfully!</div>`;
            addSongForm.reset();
            window.loadPlaylist(); // Reload the playlist to show the new song
            setTimeout(() => { addSongStatus.innerHTML = ""; }, 3000);
          })
          .withFailureHandler(function(error) {
            addSongStatus.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
          })
          .addVideoToPlaylist(playlistId, videoUrl);
      });
    }
  });

  // --- Shared Functions ---
  function copyLink() {
    const linkInput = document.getElementById("shareLink");
    linkInput.select();
    linkInput.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(linkInput.value);
    alert("Link copied to clipboard!");
  }

  // **FIXED**: This function must be globally accessible to be called by onclick
  function castVote(playlistItemId, voteType) {
    const trackElement = document.getElementById(playlistItemId);
    const voteCountElement = trackElement.querySelector('.vote-count');
    const currentScore = parseInt(voteCountElement.textContent);
    
    // Optimistically update the UI
    voteCountElement.textContent = voteType === 'up' ? currentScore + 1 : currentScore - 1;
    trackElement.querySelectorAll('button').forEach(btn => btn.disabled = true);

    google.script.run
      .withSuccessHandler(function(wasMoved) {
        if (wasMoved) {
          // If a track was moved, reload the whole playlist
          window.loadPlaylist();
        } else {
          // Otherwise, just re-enable the buttons
          trackElement.querySelectorAll('button').forEach(btn => btn.disabled = false);
        }
      })
      .withFailureHandler(function(err) {
        alert(err.message);
        voteCountElement.textContent = currentScore; // Revert count on error
        trackElement.querySelectorAll('button').forEach(btn => btn.disabled = false);
      })
      .recordVote(playlistItemId, voteType);
  }
