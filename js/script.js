let currentSong = new Audio();
let isPlaying = false; // Track whether a song is currently playing
let songs;
let currFolder;
let previousVolume = 0.5; // Store previous volume before mute

function formatSecondsToMinutesSeconds(totalSeconds) {
  if (typeof totalSeconds !== "number" || totalSeconds < 0) {
    return "00:00"; // Handle invalid input
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const formattedMinutes = String(minutes).padStart(2, "0"); // Ensure two digits
  const formattedSeconds = String(seconds).padStart(2, "0"); // Ensure two digits

  return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
  currFolder = folder;
  let response = await fetch(`http://127.0.0.1:3000/songs/${currFolder}/`);

  if (!response.ok) {
    console.error(`Error fetching songs from folder ${folder}`);
    return []; // Return an empty array if the fetch fails
  }

  let textResponse = await response.text();
  let div = document.createElement("div");
  div.innerHTML = textResponse;
  let as = div.getElementsByTagName("a");
  songs = [];
  for (let index = 0; index < as.length; index++) {
    const element = as[index];
    if (element.href.endsWith(".mp3")) {
      songs.push(element.href.split(`/songs/${folder}/`)[1]);
    }
  }

  let songUl = document.querySelector(".songList").getElementsByTagName("ul")[0];
  songUl.innerHTML = "";
  // DISPLAYING SONGS IN LIBRARY
  for (const song of songs) {
    songUl.innerHTML += `<li>
                <img class="invert" src="img/music.svg" alt="musicIcon">
                <div class="info">
                  <div class="songName">${song.replaceAll("%20", " ")} </div>
                  <div class="artistName">Asil</div>
                </div>
                <div class="flex justify-content items-center playNow">
                  <span>Play Now</span>
                  <img class="invert btn" src="img/play.svg" alt="playnow">
                </div>
              </li>`;
  }
  attachSongEventListeners();

  
  return songs;  // Return the songs array after processing
}

function attachSongEventListeners() {
  Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach((element) => {
    element.addEventListener("click", (event) => {
      const songName = element.querySelector(".songName").innerText;
      if (event.target.closest(".playNow")) {
        if (element.classList.contains("playing")) {
          currentSong.pause();
          isPlaying = false;
          element.classList.remove("playing");
          element.querySelector(".playNow span").innerText = "Play Now";
          element.querySelector(".playNow img").src = "img/play.svg";
        } else {
          playMusic(songName);
        }
        return;
      }
      playMusic(songName);
    });
  });
}

document.querySelector("#previous").addEventListener("click", () => {
  if (!songs || songs.length === 0) {
    console.warn("No songs available.");
    return;
  }
  let index = songs.indexOf(currentSong.src.split(`/songs/${currFolder}/`)[1]);
  if (index < 0) {
    console.warn("No songs available.");
    return;
  }

  index = (index - 1 + songs.length) % songs.length; // Wraparound to the last song if at the beginning
  playMusic(songs[index]);
});

document.querySelector("#next").addEventListener("click", () => {
  if (!songs || songs.length === 0) {
    console.warn("No songs available.");
    return;
  }
  let index = songs.indexOf(currentSong.src.split(`/songs/${currFolder}/`)[1]);
  if (index < 0) {
    console.warn("No songs available.");
    return;
  }
  index = (index + 1) % songs.length; // Wraparound to the first song if at the end
  playMusic(songs[index]);
});

document.querySelector("#play").addEventListener("click", () => {
  if (isPlaying) {
    currentSong.pause();
    isPlaying = false;
    play.src = "img/play.svg"; // Change to play icon
  } else {
    currentSong.play();
    isPlaying = true;
    play.src = "img/pause.svg"; // Change to pause icon
  }
});

function playMusic(trackName) {
  document.querySelector(".songInfo").innerText = trackName;

  // Find the currently playing song element and reset it
  const currentlyPlayingElement = document.querySelector(".songList li.playing");

  if (currentlyPlayingElement) {
    currentlyPlayingElement.classList.remove("playing");
    currentlyPlayingElement.querySelector(".playNow span").innerText = "Play Now";
    currentlyPlayingElement.querySelector(".playNow img").src = "img/play.svg";
  }

  if (currentSong.src !== `/songs/${currFolder}/${trackName}`) {
    currentSong.src = `/songs/${currFolder}/${trackName}`;
    currentSong.play();
    isPlaying = true;
    play.src = "img/pause.svg"; // Change the main play/pause button
  } else if (isPlaying) {
    currentSong.pause();
    isPlaying = false;
    play.src = "img/play.svg"; // Change the main play/pause button
  } else {
    currentSong.play();
    isPlaying = true;
    play.src = "img/pause.svg"; // Change the main play/pause button
  }

  // Find the new song element and update it
  const newSongElement = Array.from(document.querySelectorAll(".songList li")).find(
    (li) => li.querySelector(".songName").innerText === trackName.replaceAll("%20", " ")
  );

  if (newSongElement) {
    newSongElement.classList.add("playing");
    newSongElement.querySelector(".playNow span").innerText = "Playing";
    newSongElement.querySelector(".playNow img").src = "img/pause.svg";

    // Scroll the song into view smoothly
    newSongElement.scrollIntoView({
      behavior: "smooth",
      block: "nearest", // Align the top or bottom of the element to the nearest edge of the visible scrolling area.
    });
  }
}

async function main() {
  // Getting list of all songs
  await getSongs("");

  // Display all the albums on the page
  let response = await fetch(`http://127.0.0.1:3000/songs/`);
  let textResponse = await response.text();
  let div = document.createElement("div");
  div.innerHTML = textResponse;
  let as = div.getElementsByTagName("a");

  folders = [];
  for (let index = 0; index < as.length; index++) {
    const element = as[index];
    if (element.href.includes("songs/")) {
      folders.push(element.href.split(`/`)[4]);
    }
  }

  let folderUl = document.querySelector(".cardContainer");
  folderUl.innerHTML = "";
  // DISPLAYING SONGS IN Playlist
  for (const folder of folders) {
    let a = await fetch(`http://127.0.0.1:3000/songs/${folder}/info.json`);
    let ans = await a.json();
    folderUl.innerHTML += `<div data-folder=${folder} class="card">
                        <img class="greenPB" src="img/playgreen.svg" alt="Playit">
                        <img src= songs/${folder}/cover.jpg alt=${folder}>
                        <h2>${ans.title}</h2>
                        <p>${ans.description}</p>
                    </div>`;
  }

  // Listen for time update event
  currentSong.addEventListener("timeupdate", () => {
    let currentTime = currentSong.currentTime;
    let duration = currentSong.duration;
    let progress = (currentTime / duration) * 100;
    document.querySelector(".circle").style.left = progress + "%";
    document.querySelector(".songTimer").innerHTML = `${formatSecondsToMinutesSeconds(currentTime)} / ${formatSecondsToMinutesSeconds(duration)}`;
  });

  // Listen for song end event to play the next song automatically
  currentSong.addEventListener("ended", () => {
    let index = songs.indexOf(currentSong.src.split(`/songs/${currFolder}/`)[1]);
    index = (index + 1) % songs.length; // Wraparound to the first song if at the end
    playMusic(songs[index]);
  });

  // Volume Control
  const volumeSlider = document.getElementById("volume-slider");
  const volumeDisplay = document.getElementById("volume-display");
  volumeSlider.addEventListener("input", function () {
    let currentVolume = this.value;
    currentSong.volume = currentVolume / 100;
    updateDisplay(currentVolume);
  });

  // Mute upon clicking Speaker
  document.querySelector(".volume-control-container img").addEventListener("click", (e) => {
    let volumeImg = document.querySelector(".volume-control-container img");
    if (volumeImg.src.includes("img/mute.svg")) {
      volumeImg.src = "img/volume.svg";
      currentSong.volume = previousVolume;
      volumeSlider.value = previousVolume * 100;
      updateDisplay(previousVolume * 100);
    } else {
      volumeImg.src = "img/mute.svg";
      previousVolume = currentSong.volume;
      currentSong.volume = 0;
      volumeSlider.value = 0;
      updateDisplay(0);
    }
  });

  function updateDisplay(volumeLevel) {
    volumeDisplay.innerText = `${parseInt(volumeLevel)}%`;
  }

  // Add an event listener to seekbar
  document.querySelector(".seekbar").addEventListener("click", (e) => {
    let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
    document.querySelector(".circle").style.left = percent + "%";
    currentSong.currentTime = (currentSong.duration * percent) / 100;
  });

  // Add an event listener for hamburger
  document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".left").style.left = "0";
  });

  // Add an event listener for close button
  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-120%";
  });

  // Load library from cards
  Array.from(document.getElementsByClassName("card")).forEach((e) => {
    e.addEventListener("click", async (item) => {
      const folder = item.currentTarget.dataset.folder;
      console.log("Folder selected:", folder);  // Log the folder name to verify
      songs = await getSongs(folder);
      console.log("Songs in selected folder:", songs);  // Log the fetched songs
    });
  });
}

main();
