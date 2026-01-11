// alert("For better experience, please use the app in full-screen mode.");

/* ======================
   GLOBAL STATE
   ====================== */

let songs = [];
let currentSongIndex = 0;
let isPlaying = false;
let isLooping = false;
let isShuffle = false;
let currentPlayingLi = null;

const audio = new Audio();

/* ======================
   DOM REFERENCES
   ====================== */

const hamburger = document.querySelector(".hamburger");
const leftPanel = document.querySelector(".left");
const closepanel = document.querySelector(".close");

const playButton = document.getElementById("play");
const previousButton = document.getElementById("previous");
const nextButton = document.getElementById("next");
const shuffleButton = document.getElementById("shuffle");
const loopButton = document.getElementById("loop");

const volumeSlider = document.getElementById("volume-slider");
const volumeDisplay = document.getElementById("volume-display");
const volumeIcon = document.getElementById("unmute");
const songNameDisplay = document.querySelector(".songInfo");
const songTimer = document.querySelector(".songTimer");

const seekbar = document.querySelector(".seekbar");
const circle = document.querySelector(".circle");

const songListContainer = document.getElementById("songList");
const cardContainer = document.querySelector(".cardContainer");

/* ======================
   SIDEBAR
   ====================== */

hamburger.addEventListener("click", () => {
  leftPanel.classList.toggle("open");
});

closepanel.addEventListener("click", () => {
  leftPanel.classList.toggle("open");
});

/* ======================
   PLAYLIST FETCHING
   ====================== */

async function getPlaylists() {
  const res = await fetch("http://127.0.0.1:3000/Playlists/");
  const html = await res.text();

  const div = document.createElement("div");
  div.innerHTML = html;

  return [...div.querySelectorAll("a")]
    .map(a => a.getAttribute("href"))
    .filter(href => href && href.endsWith("/") && href !== "../");
}

async function getSongs(folder) {
  const res = await fetch(`http://127.0.0.1:3000/Playlists/${folder}`);
  const html = await res.text();

  const div = document.createElement("div");
  div.innerHTML = html;

  return [...div.querySelectorAll("a")]
    .map(a => a.getAttribute("href"))
    .filter(name => name.endsWith(".mp3"));
}

/* ======================
   RENDER PLAYLISTS
   ====================== */

function cleanFolderName(raw) {
  return decodeURIComponent(raw)
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean)
    .pop();
}

function loadPlaylists(playlists) {
  cardContainer.innerHTML = "";

  playlists.forEach(raw => {
    const folder = cleanFolderName(raw);

    const card = document.createElement("div");
    card.className = "card";
    card.dataset.folder = folder;

    card.innerHTML = `
      <img class="greenPB" src="img/playgreen.svg">
      <img src="img/${folder}.jpg">
      <h2>${folder}</h2>
      <p>Lorem ipsum dolor sit amet.</p>
    `;

    cardContainer.appendChild(card);
  });
}

/* ======================
   SONG LIST
   ====================== */

function cleanSongTitle(path, truncate = false) {
  let name = decodeURIComponent(path).split(/[/\\]/).pop().replace(/\.mp3$/i, "");
  if (truncate && name.length > 28) return name.slice(0, 25) + "...";
  return name;
}

function loadSongList() {
  songListContainer.innerHTML = "";

  songs.forEach((song, index) => {
    const li = document.createElement("li");
    li.dataset.song = song;

    li.innerHTML = `
      ${cleanSongTitle(song, true)}
      <span><img src="img/stopbars.svg"></span>
    `;

    li.addEventListener("click", () => {
      currentSongIndex = index;
      loadSong(song);
    });

    songListContainer.appendChild(li);
  });
}

/* ======================
   PLAYER LOGIC
   ====================== */

function loadSong(song) {
  audio.src = "http://127.0.0.1:3000" + decodeURIComponent(song).replace(/\\/g, "/");
  audio.play();

  songNameDisplay.textContent = cleanSongTitle(song);
  playButton.src = "img/pause.svg";
  isPlaying = true;

  updatePlayingSongUI(song);
}

function updatePlayingSongUI(song) {
  if (currentPlayingLi) {
    currentPlayingLi.querySelector("img").src = "img/stopbars.svg";
  }

  [...songListContainer.children].forEach(li => {
    if (li.dataset.song === song) {
      li.querySelector("img").src = "img/playingbars.svg";
      currentPlayingLi = li;
    }
  });
}

/* ======================
   CONTROLS
   ====================== */

playButton.addEventListener("click", () => {
  if (!audio.src) return;

  if (isPlaying) {
    audio.pause();
    playButton.src = "img/play.svg";
    isPlaying = false;
  } else {
    audio.play();
    playButton.src = "img/pause.svg";
    isPlaying = true;
  }
});

previousButton.addEventListener("click", () => {
  if (!songs.length) return;
  currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
  loadSong(songs[currentSongIndex]);
});

nextButton.addEventListener("click", () => {
  if (!songs.length) return;
  currentSongIndex = (currentSongIndex + 1) % songs.length;
  loadSong(songs[currentSongIndex]);
});

shuffleButton.addEventListener("click", () => {
  isShuffle = !isShuffle;
  shuffleButton.classList.toggle("active", isShuffle);
});

loopButton.addEventListener("click", () => {
  isLooping = !isLooping;
  audio.loop = isLooping;
  loopButton.classList.toggle("active", isLooping);
});

let previousVolume = volumeSlider.value / 100; // store initial volume

// Update volume when slider moves
volumeSlider.addEventListener("input", () => {
    audio.volume = volumeSlider.value / 100;
    volumeDisplay.textContent = `${volumeSlider.value}%`;

    if (audio.volume === 0) {
        volumeIcon.src = "img/mute.svg";
    } else {
        volumeIcon.src = "img/volume.svg";
        previousVolume = audio.volume; // remember last non-zero volume
    }
});

// Toggle mute/unmute on icon click
volumeIcon.addEventListener("click", () => {
    if (audio.volume > 0) {
        // Mute
        previousVolume = audio.volume; // store current volume
        audio.volume = 0;
        volumeSlider.value = 0;
        volumeDisplay.textContent = "0%";
        volumeIcon.src = "img/mute.svg";
    } else {
        // Restore previous volume
        audio.volume = previousVolume;
        volumeSlider.value = previousVolume * 100;
        volumeDisplay.textContent = `${volumeSlider.value}%`;
        volumeIcon.src = "img/volume.svg";
    }
});

/* ======================
   SEEK BAR
   ====================== */

seekbar.addEventListener("click", e => {
  if (!audio.duration) return;
  const percent = e.offsetX / seekbar.offsetWidth;
  audio.currentTime = percent * audio.duration;
});

audio.addEventListener("timeupdate", () => {
  if (!audio.duration) return;

  const percent = (audio.currentTime / audio.duration) * 100;
  circle.style.left = percent + "%";

  songTimer.textContent =
    formatTime(audio.currentTime) + " / " + formatTime(audio.duration);
});

audio.addEventListener("ended", () => {
  if (isShuffle) {
    currentSongIndex = Math.floor(Math.random() * songs.length);
  } else {
    currentSongIndex = (currentSongIndex + 1) % songs.length;
  }
  loadSong(songs[currentSongIndex]);
});

/* ======================
   UTIL
   ====================== */

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

/* ======================
   PLAYLIST CLICK (DELEGATED)
   ====================== */

cardContainer.addEventListener("click", async e => {
  const card = e.target.closest(".card");
  if (!card) return;

  audio.pause();
  audio.currentTime = 0;
  isPlaying = false;
  playButton.src = "img/play.svg";
  songTimer.textContent = "00:00 / 00:00";
  currentPlayingLi = null;

  songs = await getSongs(card.dataset.folder);
  currentSongIndex = 0;

  if (!songs.length) return;

  loadSongList();
});

/* ======================
   INIT
   ====================== */

(async function init() {
  const playlists = await getPlaylists();
  loadPlaylists(playlists);
})();
