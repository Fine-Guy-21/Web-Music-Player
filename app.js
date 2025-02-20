let audioFiles = [];
let currentIndex = -1;
let repeatMode = 0; // 0 - off, 1 - repeat one, 2 - repeat all
const audioPlayer = document.getElementById("audioPlayer");
const playerContainer = document.getElementById("playerContainer");
const progressContainer = document.getElementById('
let audioFiles = [];
let currentIndex = -1;
let repeatMode = 0; // 0 - off, 1 - repeat one, 2 - repeat all
const audioPlayer = document.getElementById("audioPlayer");
const playerContainer = document.getElementById("playerContainer");
const progressContainer = document.getElementById('progressBarContainer');
const progressBar = document.getElementById("progress");
const currentTrack = document.getElementById("currentTrack");
const volumeControl = document.getElementById("volumeControl");

document.getElementById('pickFolder').addEventListener('change', async function(event) {
    const fileList = event.target.files;
    const audioListDiv = document.getElementById("audioList");
    audioListDiv.innerHTML = "<strong>Your Music Files:</strong>";
    audioFiles = [];

    for (const file of fileList) {
        if (!file.type.startsWith('audio/')) continue; // Process only audio files

        const metadata = await getMetadata(file);
        const title = metadata.title;
        const artist = metadata.artist || 'Unknown Artist';
        const newName = `${title} - ${artist}`;
        if(!title || !artist) {
            const newName = `${file.name}`;      
        }
        const audioUrl = URL.createObjectURL(file);
        audioFiles.push({ name: newName, url: audioUrl });

        const listItem = document.createElement("div");
        listItem.classList.add("audio-item");
        listItem.textContent = newName;
        listItem.addEventListener("click", () =>
            playAudio(audioFiles.indexOf(audioFiles.find((a) => a.url === audioUrl)))
        );
        audioListDiv.appendChild(listItem);
    }
});

// Function to update the Play/Pause button icon
function updatePlayPauseButton() {
    const playPauseButton = document.getElementById('playPause');
    if (audioPlayer.paused) {
        playPauseButton.innerHTML = '<img src="icons/icons8-play-24.png" alt="play">'; // Play icon
    } else {
        playPauseButton.innerHTML = '<img src="icons/icons8-pause-24.png" alt="pause">'; // Pause icon
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function playAudio(index) {
    if (index < 0 || index >= audioFiles.length) return;

    // Remove the 'active' class from the previously active item
    const prevActiveItem = document.querySelector(".audio-item.active");
    if (prevActiveItem) {
        prevActiveItem.classList.remove("active");
    }

    // Set the new active item
    currentIndex = index;
    audioPlayer.src = audioFiles[index].url;
    currentTrack.textContent = audioFiles[index].name;
    playerContainer.style.display = "block";
    audioPlayer.play();
    updatePlayPauseButton();

    // Add the 'active' class to the currently playing item
    const audioListDiv = document.getElementById("audioList");
    const activeItem = audioListDiv.querySelectorAll(".audio-item")[index];
    if (activeItem) {
        activeItem.classList.add("active");
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

document.getElementById("prev").addEventListener("click", () => playAudio(currentIndex - 1));
document.getElementById("next").addEventListener("click", () => playAudio(currentIndex + 1));
document.getElementById("rewind").addEventListener("click", () => (audioPlayer.currentTime -= 10));
document.getElementById("forward").addEventListener("click", () => (audioPlayer.currentTime += 10));

document.getElementById("shuffle").addEventListener("click", () => {
    if (audioFiles.length === 0) return; // No files to shuffle

    // Shuffle the audioFiles array
    audioFiles = shuffleArray(audioFiles);

    // Update the displayed list
    const audioListDiv = document.getElementById("audioList");
    audioListDiv.innerHTML = "<strong>Audio Files:</strong>";
    audioFiles.forEach((file, index) => {
        const listItem = document.createElement("div");
        listItem.classList.add("audio-item");
        listItem.textContent = file.name;
        listItem.addEventListener("click", () => playAudio(index));
        audioListDiv.appendChild(listItem);
    });

    // Play the first song in the shuffled list
    playAudio(0);
});

document.getElementById("repeat").addEventListener("click", () => {
    repeatMode = (repeatMode + 1) % 3;
    const repeatIcons = [
        '<img src="icons/icons8-repeat-off-24.png" alt="repeat-off">',
        '<img src="icons/icons8-repeat-one-24.png" alt="repeat-one">',
        '<img src="icons/icons8-repeat-24.png" alt="repeat-all">'
    ];
    document.getElementById("repeat").innerHTML = repeatIcons[repeatMode];
});

volumeControl.addEventListener('input', (e) => {
    audioPlayer.volume = e.target.value;
});

audioPlayer.addEventListener("ended", () => {
    if (repeatMode === 1) {
        playAudio(currentIndex);
    } else if (repeatMode === 2) {
        playAudio((currentIndex + 1) % audioFiles.length);
    } else {
        playAudio(currentIndex + 1);
    }
});

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

progressContainer.addEventListener('click', (e) => {
    // Get click position relative to progress container
    const rect = progressContainer.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const totalWidth = progressContainer.clientWidth;

    // Calculate new time
    const newTime = (clickPosition / totalWidth) * audioPlayer.duration;

    // Update audio player time
    audioPlayer.currentTime = newTime;
});

audioPlayer.addEventListener("timeupdate", () => {
    document.getElementById("currentTime").innerHTML = formatTime(audioPlayer.currentTime);
    document.getElementById("duration").innerHTML = formatTime(audioPlayer.duration);
    progressBar.style.width =
        (audioPlayer.currentTime / audioPlayer.duration) * 100 + "%";
});

async function getMetadata(file) {
    return new Promise((resolve) => {
        jsmediatags.read(file, {
            onSuccess: function(tag) {
                resolve({
                    title: tag.tags.title,
                    artist: tag.tags.artist,
                    album: tag.tags.album,
                    duration: formatDuration(tag.tags.duration),
                    dateModified: new Date(file.lastModified).toLocaleString()
                });
            },
            onError: function() {
                resolve({ title: file.name, artist: 'Unknown', album: 'Unknown', duration: 'Unknown', dateModified: new Date(file.lastModified).toLocaleString() });
            }
        });
    });
}

function formatDuration(seconds) {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}
