let audioFiles = [];
let currentIndex = -1;
let repeatMode = 0; // 0 - off, 1 - repeat one, 2 - repeat all
let currentLyrics = null;
let LyricsTitle, LyricsArtist;
const audioPlayer = document.getElementById("audioPlayer");
const playerContainer = document.getElementById("playerContainer");
const progressContainer = document.getElementById("progressBarContainer");
const progressBar = document.getElementById("progress");
const currentTrack = document.getElementById("currentTrack");
const volumeControl = document.getElementById("volumeControl");

// File selection and metadata handling
document
  .getElementById("pickFolder")
  .addEventListener("change", async function (event) {
    const fileList = event.target.files;
    const audioListDiv = document.getElementById("audioList");
    audioListDiv.innerHTML = "<strong>Your Music Files:</strong>";
    audioFiles = [];

    for (const file of fileList) {
      if (!file.type.startsWith("audio/")) continue;

      const metadata = await getMetadata(file);
      const title = metadata.title;
      const artist = metadata.artist || "Unknown Artist";
      const newName = `${title} - ${artist}`;
      if (!title || !artist) {
        const newName = `${file.name}`;
      }
      const audioUrl = URL.createObjectURL(file);
      audioFiles.push({ name: newName, url: audioUrl });

      const listItem = document.createElement("div");
      listItem.classList.add("audio-item");
      listItem.textContent = newName;
      listItem.addEventListener("click", () =>
        playAudio(
          audioFiles.indexOf(audioFiles.find((a) => a.url === audioUrl))
        )
      );
      audioListDiv.appendChild(listItem);
    }
  });

// Audio playback control
async function playAudio(index) {
  if (index < 0 || index >= audioFiles.length) return;

  const prevActiveItem = document.querySelector(".audio-item.active");
  if (prevActiveItem) {
    prevActiveItem.classList.remove("active");
  }

  currentIndex = index;
  audioPlayer.src = audioFiles[index].url;
  currentTrack.textContent = audioFiles[index].name;
  playerContainer.style.display = "block";

  audioPlayer.play();
  updatePlayPauseButton();

  const audioListDiv = document.getElementById("audioList");
  const activeItem = audioListDiv.querySelectorAll(".audio-item")[index];
  if (activeItem) {
    activeItem.classList.add("active");
  }
//   const file = document.getElementById("pickFolder").files[index];
//   const file = audioFiles[index];

//   const metadata = await getMetadata(file);
//   title = metadata.title || "no title";
//   artist = metadata.artist || "no artist";

//   console.log("Now Playing : title ", metadata.title);
//   console.log("Now Playing: artist", metadata.artist);

  const [title, artist] = audioFiles[index].name.split(" - ");

  if (artist.includes(",")) {
    const artistList = artist.split(",").map(name => name.trim());
    console.log("Artist List: ", artistList);
    for (let singleArtist of artistList) {
        currentLyrics = await fetchLyrics(singleArtist, cleanTitle(title));
        console.log("Lyrics for ", singleArtist);
        if (currentLyrics && currentLyrics !== "Lyrics not available for this track") {
            displayLyrics(); 
            return; 
        }
    }
} else {
    currentLyrics = await fetchLyrics(artist, cleanTitle(title));
    displayLyrics();
}






}

document.getElementById("playPause").addEventListener("click", () => {
  if (audioPlayer.paused) {
    audioPlayer.play();
    updatePlayPauseButton();
  } else {
    audioPlayer.pause();
    updatePlayPauseButton();
  }
});

document
  .getElementById("prev")
  .addEventListener("click", () => playAudio(currentIndex - 1));
document
  .getElementById("next")
  .addEventListener("click", () => playAudio(currentIndex + 1));
document
  .getElementById("rewind")
  .addEventListener("click", () => (audioPlayer.currentTime -= 10));
document
  .getElementById("forward")
  .addEventListener("click", () => (audioPlayer.currentTime += 10));

document.getElementById("shuffle").addEventListener("click", () => {
  if (audioFiles.length === 0) return;

  audioFiles = shuffleArray(audioFiles);

  const audioListDiv = document.getElementById("audioList");
  audioListDiv.innerHTML = "<strong>Audio Files:</strong>";
  audioFiles.forEach((file, index) => {
    const listItem = document.createElement("div");
    listItem.classList.add("audio-item");
    listItem.textContent = file.name;
    listItem.addEventListener("click", () => playAudio(index));
    audioListDiv.appendChild(listItem);
  });

  playAudio(0);
});

document.getElementById("repeat").addEventListener("click", () => {
  repeatMode = (repeatMode + 1) % 3;
  const repeatIcons = [
    '<img src="icons/icons8-repeat-off-24.png" alt="repeat-off">',
    '<img src="icons/icons8-repeat-one-24.png" alt="repeat-one">',
    '<img src="icons/icons8-repeat-24.png" alt="repeat-all">',
  ];
  document.getElementById("repeat").innerHTML = repeatIcons[repeatMode];
});

// Volume control
volumeControl.addEventListener("input", (e) => {
  audioPlayer.volume = e.target.value;
});

// Playback events
audioPlayer.addEventListener("ended", () => {
  if (repeatMode === 1) {
    playAudio(currentIndex);
  } else if (repeatMode === 2) {
    playAudio((currentIndex + 1) % audioFiles.length);
  } else {
    playAudio(currentIndex + 1);
  }
});

// Progress bar
progressContainer.addEventListener("click", (e) => {
  const rect = progressContainer.getBoundingClientRect();
  const clickPosition = e.clientX - rect.left;
  const totalWidth = progressContainer.clientWidth;
  const newTime = (clickPosition / totalWidth) * audioPlayer.duration;
  audioPlayer.currentTime = newTime;
});

audioPlayer.addEventListener("timeupdate", () => {
  document.getElementById("currentTime").innerHTML = formatTime(
    audioPlayer.currentTime
  );
  document.getElementById("duration").innerHTML = formatTime(
    audioPlayer.duration
  );
  progressBar.style.width =
    (audioPlayer.currentTime / audioPlayer.duration) * 100 + "%";
});

// Utility functions
function updatePlayPauseButton() {
  const playPauseButton = document.getElementById("playPause");
  if (audioPlayer.paused) {
    playPauseButton.innerHTML =
      '<img src="icons/icons8-play-24.png" alt="play">';
  } else {
    playPauseButton.innerHTML =
      '<img src="icons/icons8-pause-24.png" alt="pause">';
  }
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

async function getMetadata(file) {
  return new Promise((resolve) => {
    jsmediatags.read(file, {
      onSuccess: function (tag) {
        resolve({
          title: tag.tags.title,
          artist: tag.tags.artist,
          album: tag.tags.album,
          duration: formatDuration(tag.tags.duration),
          dateModified: new Date(file.lastModified).toLocaleString(),
        });
      },
      onError: function () {
        resolve({
          title: file.name,
          artist: "Unknown",
          album: "Unknown",
          duration: "Unknown",
          dateModified: new Date(file.lastModified).toLocaleString(),
        });
      },
    });
  });
}

function formatDuration(seconds) {
  if (!seconds) return "Unknown";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}

// Lyrics functionality
document.getElementById("lyricsBtn").addEventListener("click", () => {
  const popup = document.getElementById("lyricsPopup");
  const lyricsText = document.getElementById("lyricsText");

  if (currentLyrics) {
    lyricsText.innerHTML = currentLyrics.replace(/\n/g, "<br>");
    document.getElementById("lyricsTitle").textContent = `${audioFiles[
      currentIndex
    ].name.replace(" - ", ' - Lyrics for "')}"`;
    popup.style.display = "block";
  }
});

function displayLyrics() {
  const popup = document.getElementById("lyricsPopup");
  const lyricsText = document.getElementById("lyricsText");

  if (currentLyrics) {
    lyricsText.innerHTML = currentLyrics.replace(/\n/g, "<br>");
    document.getElementById("lyricsTitle").textContent = `${audioFiles[
      currentIndex
    ].name.replace(" - ", ' - Lyrics for "')}"`;
    //   popup.style.display = "block";
  }
}

document.getElementById("closeLyrics").addEventListener("click", () => {
  document.getElementById("lyricsPopup").style.display = "none";
});

window.addEventListener("click", (e) => {
  const popup = document.getElementById("lyricsPopup");
  if (e.target === popup) {
    popup.style.display = "none";
  }
});

async function fetchLyrics(artist, title) {
  try {
    const response = await fetch(
      `https://api.lyrics.ovh/v1/${encodeURIComponent(
        artist
      )}/${encodeURIComponent(title)}`
    );

    if (!response.ok) throw new Error("Lyrics not found");

    const data = await response.json();
    return data.lyrics || "Lyrics not available for this track";
  } catch (error) {
    return "Lyrics not available for this track";
  }
}

function cleanTitle(title) {
    if (!title.includes("(")) return title; 
    
    let index = title.indexOf("(");
    return title.substring(0, index).trim();
}
