console.log("This Is JS Command Line.");
let currentSong = null;
let currfolder;

async function getSongs(folder) {
    currfolder = folder.replace(/\\/g, '/');
    const url = `/${currfolder}/songs.json`;
    let a = await fetch(encodeURI(url));
    if (!a.ok) {
        throw new Error(`Failed to load ${url}: ${a.status} ${a.statusText}`);
    }
    let songs = await a.json();
    return songs;
}


async function main() {

    async function displayAlbums() {
        let cardContainer = document.querySelector(".card-container");
        if (!cardContainer) {
            console.error("card-container not found in DOM");
            return null;
        }

        let a = await fetch('/Songs/albums.json');
        if (!a.ok) {
            console.error('Failed to load albums.json');
            return null;
        }
        let folders = await a.json();

        let firstFolder = null;
        for (const folderName of folders) {
            let infoResponse;
            try {
                infoResponse = await fetch(encodeURI(`/Songs/${folderName}/info.json`));
            } catch (err) {
                console.warn(`Failed to fetch info.json for folder ${folderName}`, err);
                continue;
            }
            if (!infoResponse.ok) continue;

            let metadata = await infoResponse.json();
            if (!firstFolder) firstFolder = folderName;

            cardContainer.innerHTML += `<div data-folder="${folderName}" class="card">
                        <div class="music-img">
                            <div class="circular">
                                <img src="img/play.png" alt="Play-Button">
                            </div>
                            <img src="/Songs/${encodeURIComponent(folderName)}/cover.jpg"
                                alt="Song-Card.img">
                        </div>
                        <h3>${metadata.title}</h3>
                        <p>${metadata.description}</p>
                    </div>`;
        }

        cardContainer.addEventListener("click", async event => {
            const card = event.target.closest('.card');
            if (!card || !card.dataset.folder) return;

            const playBtn = document.getElementById("play");
            if (playBtn) {
                playBtn.src = "img/pause.png";
            }
            
            songs = await getSongs(`Songs/${card.dataset.folder}`);
            renderLibrary(songs);
        });

        return firstFolder;
    }

    // Get The List Of All The Songs.
    //--------------------------------
    let songs = [];
    let firstAlbum = await displayAlbums();

    try {
        songs = await getSongs("Songs/01_Angry Mood");
    } catch (err) {
        console.warn("Failed to load default initial album:", err);
    }

    if (!songs.length && firstAlbum) {
        try {
            songs = await getSongs(`Songs/${firstAlbum}`);
        } catch (err) {
            console.error("Failed to load fallback album:", firstAlbum, err);
        }
    }

    if (!songs.length) {
        console.error("No songs loaded for initial album list.");
    }

    // Get the Each Songs Name.
    //--------------------------
    function getSongName(track) {

        let name = track.replace(".mp3", "");

        // Remove starting C + artist name
        name = name.substring(name.indexOf("-") + 1);

        // Remove ending numbers
        name = name.replace(/-\d+$/, "");

        // Replace - with spaces
        name = name.replace(/-/g, " ");

        return name;
    }

    // Convert Seconds Into Minutes:Seconds.
    function secondsToMinutes(seconds) {
        if (isNaN(seconds) || seconds < 0) {
            return " 00:00";
        }

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);

        const formattedMinutes = String(minutes).padStart(2, '0');
        const formattedSeconds = String(remainingSeconds).padStart(2, '0');

        return `${formattedMinutes}:${formattedSeconds}`;
    }

    // List Songs In The Library.
    //----------------------------

    let currentTrack = "";

    const playMusic = (track, index, pause = false) => {
        if (currentSong) currentSong.pause();
        currentSong = new Audio(`${currfolder}/${track}`);
        currentTrack = track;

        let li = document.querySelectorAll(".marquee");
        li.forEach(m => m.classList.remove("animate"));
        for (const currentLI of li) {
            if (currentLI.id === `index-${index}`) {
                currentLI.classList.add("animate");
            }
        }
        if (!pause) {
            currentSong.play();
        }

        let songInfo = document.querySelector(".song-info");
        let fetchSongName = getSongName(track);
        if (songInfo) {
            songInfo.innerHTML = `<p>${fetchSongName}</p>`;
            songInfo.classList.add("animate-on-bar");
        }

        const playBtn = document.getElementById("play");
        if (playBtn) playBtn.src = "img/pause.png";

        // Fetch Time & Duration For Current Song.
        currentSong.addEventListener("timeupdate", () => {
            document.querySelector(".song-time").innerHTML = `${secondsToMinutes(currentSong.currentTime)} / ${secondsToMinutes(currentSong.duration)}`;
            document.querySelector(".circle").style.left = ((currentSong.currentTime) / (currentSong.duration)) * 100 + "%";
        });

    };

    // renderLibrary: updates the left song list and binds click handlers
    function renderLibrary(newSongs) {

        songs = newSongs || [];
        const songUL = document.querySelector(".song-list ul");
        let songNames = [];
        let artists = [];

        songNames = songs.map(song => {
            let name = song.replace(".mp3", "");
            name = name.substring(name.indexOf("-") + 1);
            name = name.replace(/-\d+$/, "");
            name = name.replace(/-/g, " ");
            return name;
        });

        artists = songs.map(song => {
            let name = song.replace(".mp3", "");
            let artist = name.split("-")[0];
            return artist;
        });

        let html = "";
        for (let i = 0; i < songNames.length; i++) {
            html += `
            <li>
                <div class="music-icon">
                    <img class="white-svg" src="img/music.svg" alt="">
                </div>
                <div class="info">
                    <div class="marquee" id="index-${i}">${songNames[i]}...</div>
                    <div>${artists[i]}</div>
                </div>
                <div class="music-icon">
                    <img class="white-svg" src="img/play-button2.png" alt="">
                </div>
            </li>`;
        }

        songUL.innerHTML = html;

        if (songs.length) {
            playMusic(songs[0], 0, true);
            const playBtn = document.getElementById("play");
            if (playBtn) playBtn.src = "img/pause.png";
        }

        Array.from(songUL.getElementsByTagName("li")).forEach((e, index) => {
            e.addEventListener("click", () => {
                document.querySelectorAll(".marquee").forEach(m => m.classList.remove("animate"));
                let currentPlaying = e.querySelector(".marquee");
                if (currentPlaying) currentPlaying.classList.add("animate");
                const playBtn = document.getElementById("play");
                if (playBtn) playBtn.src = "img/pause.png";
                playMusic(songs[index], index);
            });
        });
    }

    // initial render
    renderLibrary(songs);

    // bind card clicks to load folders (cards have data-folder attributes)
    Array.from(document.querySelectorAll('.card')).forEach(card => {
        card.addEventListener('click', async () => {
            const folder = card.dataset.folder;
            if (!folder) return;
            try {
                const newSongs = await getSongs(`Songs/${folder}`);
                renderLibrary(newSongs);
            } catch (err) {
                console.error('Failed to load folder', folder, err);
            }
        });
    });

    function handlePlayClick() {
        if (!currentSong) return;
        const playBtn = document.getElementById("play");
        if (!playBtn) return;

        if (currentSong.paused) {
            currentSong.play();
            playBtn.src = "img/pause.png";
        } else {
            currentSong.pause();
            playBtn.src = "img/play-button2.png";
        }
    }

    function handlePreviousClick() {
        let index = songs.indexOf(currentTrack);
        if (index != 0) {
            playMusic(songs[index - 1], index - 1);
        } else {
            playMusic(songs[songs.length - 1], songs.length - 1);
        }
    }

    function handleNextClick() {
        let index = songs.indexOf(currentTrack);
        if (index + 1 < songs.length) {
            playMusic(songs[index + 1], index + 1);
        } else {
            playMusic(songs[0], 0);
        }
    }

    function bindControlButtons() {
        const previousBtn = document.getElementById("previous");
        const playBtn = document.getElementById("play");
        const nextBtn = document.getElementById("next");
        if (!previousBtn || !playBtn || !nextBtn) return;

        previousBtn.onclick = handlePreviousClick;
        playBtn.onclick = handlePlayClick;
        nextBtn.onclick = handleNextClick;
    }

    function bindSoundControls() {
        const soundLine = document.querySelector(".sound-line");
        const soundPercent = document.querySelector(".sound-percent");
        const plus = document.getElementById("plus");
        const minus = document.getElementById("minus");
        const muteButton = document.querySelector(".mute-sound");
        const seekbar = document.querySelector(".seekbar");
        const circle = document.querySelector(".circle");
        if (!soundLine || !soundPercent || !plus || !minus || !muteButton || !seekbar || !circle) return;

        soundPercent.style.left = soundPercent.style.left || "100%";

        soundLine.onclick = (e) => {
            e.stopPropagation();
            const rect = soundLine.getBoundingClientRect();
            let percent = ((e.clientX - rect.left) / rect.width) * 100;
            percent = Math.max(0, Math.min(100, percent));
            soundPercent.style.left = percent + "%";
            currentSong.volume = percent / 100;
        };

        // Seekbar - works on both desktop (click) and mobile (touch)
        function handleSeek(clientX) {
            const rect = seekbar.getBoundingClientRect();
            let percent = ((clientX - rect.left) / rect.width) * 100;
            percent = Math.max(0, Math.min(100, percent));
            circle.style.left = percent + "%";
            if (currentSong && !isNaN(currentSong.duration) && currentSong.duration > 0) {
                currentSong.currentTime = (currentSong.duration * percent) / 100;
            }
        }

        seekbar.onclick = (e) => {
            handleSeek(e.clientX);
        };

        seekbar.addEventListener("touchstart", (e) => {
            e.preventDefault();
            handleSeek(e.touches[0].clientX);
        }, { passive: false });

        seekbar.addEventListener("touchmove", (e) => {
            e.preventDefault();
            handleSeek(e.touches[0].clientX);
        }, { passive: false });

        plus.onclick = () => {
            let current = parseFloat(soundPercent.style.left) || 0;
            let newValue = Math.min(current + 10, 100);
            soundPercent.style.left = newValue + "%";
            currentSong.volume = Math.min(1, currentSong.volume + 0.1);
        };

        minus.onclick = () => {
            let current = parseFloat(soundPercent.style.left) || 0;
            let newValue = Math.max(current - 10, 0);
            soundPercent.style.left = newValue + "%";
            currentSong.volume = Math.max(0, currentSong.volume - 0.1);
        };

        muteButton.onclick = (e) => {
            const img = e.target;
            const src = img.getAttribute("src");

            if (src === "img/sound-on.png") {
                img.src = "img/sound-off.png";
                currentSong.volume = 0;
                soundPercent.style.left = "0";
            } else {
                img.src = "img/sound-on.png";
                currentSong.volume = 1;
                soundPercent.style.left = "100%";
            }
        };
    }

    if (currentSong) {
        currentSong.volume = 1;
    }

    // Adding An Event Listener For Ham-Burger.
    document.querySelector(".ham-burger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    })
    document.querySelector(".hide-bar").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-100%";
    })


    const controlLayout = document.querySelector(".playbar");
    const el = document.querySelector(".navbar"); // your element
    const mq = window.matchMedia('(max-width: 1000px)');

    function updateContent(e) {
        if (e.matches) {
            el.innerHTML = `<div class="nav-text flex">

        <div class="left-png flex">
            <div class="logo-img png logo cursor">
                <img class="white-svg" src="img/logo.svg" alt="Logo-Img">
            </div>
            <div class="home png bg-grey cursor">
                <img class="white-svg" src="img/home.svg" alt="Home-Img">
            </div>
        </div>

        <div class="text-up-down flex">

            <div class="right-text">
                <div class="premium-text right-text text font-style cursor">
                    <p>Premium</p>
                </div>

                <div class="support-text right-text text font-style cursor">
                    <p>Support</p>
                </div>

                <div class="download-text right-text text font-style cursor">
                    <p>Download</p>
                </div>

                <div class="seprate-line">
                    <div class="line"></div>
                </div>
            </div>

            <div class="left-text">
                <div class="download-text left-text font-style cursor">
                    <div class="download-img">
                        <img class="white-svg" src="img/download.svg" alt="Download-Png">
                    </div>
                    <p>Install App</p>
                </div>

                <div class="signup-text left-text font-style cursor">
                    <p>Signup</p>
                </div>

                <div class="login-text left-text font-style cursor">

                    <button class="login">Log in</button>
                </div>
            </div>
        </div>
    </div>
    
    <div class="search-bar flex bg-grey">

            <div class="search-img cursor">
                <img class="white-svg" src="img/search.svg" alt="Search-Png">
            </div>

            <div class="search-text">
                <input type="text" placeholder="What do you want to play?">
            </div>

            <div class="search-line">
                <div class="line"></div>
            </div>

            <div class="search-browse cursor">
                <img class="white-svg" src="img/browse.svg" alt="Browse-Png">
            </div>

        </div>`;
        }
        else {
            el.innerHTML = `<div class="nav-text flex">

                <div class="left-png flex">
                    <div class="logo-img png logo cursor">
                        <img class="white-svg" src="img/logo.svg" alt="Logo-Img">
                    </div>
                    <div class="home png bg-grey cursor">
                        <img class="white-svg" src="img/home.svg" alt="Home-Img">
                    </div>
                </div>

                <div class="search-bar flex bg-grey">

                <div class="search-img cursor">
                    <img class="white-svg" src="img/search.svg" alt="Search-Png">
                </div>

                <div class="search-text">
                    <input type="text" placeholder="What do you want to play?">
                </div>

                <div class="search-line">
                    <div class="line"></div>
                </div>

                <div class="search-browse cursor">
                    <img class="white-svg" src="img/browse.svg" alt="Browse-Png">
                </div>

            </div>

                <div class="text-up-down flex">

                    <div class="right-text">
                        <div class="premium-text right-text text font-style cursor">
                            <p>Premium</p>
                        </div>

                        <div class="support-text right-text text font-style cursor">
                            <p>Support</p>
                        </div>

                        <div class="download-text right-text text font-style cursor">
                            <p>Download</p>
                        </div>

                        <div class="seprate-line">
                            <div class="line"></div>
                        </div>
                    </div>

                    <div class="left-text">
                        <div class="download-text left-text font-style cursor">
                            <div class="download-img">
                                <img class="white-svg" src="img/download.svg" alt="Download-Png">
                            </div>
                            <p>Install App</p>
                        </div>

                        <div class="signup-text left-text font-style cursor">
                            <p>Signup</p>
                        </div>

                        <div class="login-text left-text font-style cursor">

                            <button class="login">Log in</button>
                        </div>
                    </div>
                </div>

            </div>`
        }
    }

    // run once on load
    updateContent(mq);
    updateControl(mq);
    bindControlButtons();
    bindSoundControls();
    // listen for changes
    mq.addEventListener('change', (e) => {
        updateContent(e);
        updateControl(e);
        bindControlButtons();
        bindSoundControls();
    });

    // restore song-info into the rebuilt controls only for wide view (>1000px)
    (function restoreSongInfo() {
        if (mq.matches) return; // don't show info when width <= 1000px
        const songInfoEl = document.querySelector('.song-info');
        if (songInfoEl && currentTrack) {
            try {
                songInfoEl.innerHTML = `<p>${getSongName(currentTrack)}</p>`;
                songInfoEl.classList.add('animate-on-bar');
            } catch (err) {
                // ignore
            }
        }
    })();

    // ensure song-info shows initial track (repopulate after playbar rebuild)
    (function populateSongInfo() {
        const songInfoEl = document.querySelector('.song-info');
        const trackToShow = currentTrack || songs[0];
        if (songInfoEl && trackToShow) {
            songInfoEl.innerHTML = `<p>${getSongName(trackToShow)}</p>`;
            songInfoEl.classList.add('animate-on-bar');
        }
    })();

    // listen for changes
    mq.addEventListener('change', (e) => {
        updateContent(e);
        updateControl(e);
        bindControlButtons();
        bindSoundControls();

        // restore song-info after controls rebuild on resize only when wide
        if (!e.matches) {
            const songInfoEl = document.querySelector('.song-info');
            if (songInfoEl && currentTrack) {
                songInfoEl.innerHTML = `<p>${getSongName(currentTrack)}</p>`;
                songInfoEl.classList.add('animate-on-bar');
            }
        }
    });

    function updateControl(e) {
        if (e.matches) {
            controlLayout.innerHTML = `<div class="control">
            <div class="song-time">
                00:00 / 00:00
            </div>
            <div class="control-img">
                <img id="previous" class="white-svg" src="img/Backward.png" alt="Backward-Button">
                <img itemid="play" class="white-svg" id="play" src="img/play-button2.png" alt="Play-Button">
                <img id="next" class="white-svg" src="img/Forward.png" alt="Forward-Button">
            </div>
            <div class="sound-control">
                <img class="mute-sound white-svg" src="img/sound-on.png" alt="sound-icon">

                <div class="up-down opacity">
                    <p class="plus-minus" id="minus">
                        <img class="white-svg" src="img/minus.png" alt="Soung-Minus.Png">
                    </p>
                    <div class="sound-line">
                        <div class="sound-percent"></div>
                    </div>
                    <p class="plus-minus" id="plus">
                        <img class="white-svg" src="img/plus.png" alt="Soung-plus.Png">
                    </p>
                </div>
            </div>
        </div>

        <div class="bar">
            <div class="seekbar">
                <div class="circle">

                </div>
            </div>

        </div>`;
        }
        else {
            controlLayout.innerHTML = `<div class="control">
                <div class="song-time">
                    00:00 / 00:00
                </div>
                <div class="control-img">
                    <img id="previous" class="white-svg" src="img/Backward.png" alt="Backward-Button">
                    <img itemid="play" class="white-svg" id="play" src="img/play-button2.png" alt="Play-Button">
                    <img id="next" class="white-svg" src="img/Forward.png" alt="Forward-Button">
                </div>
                <div class="song-info-parent">
                    <div class="song-info">

                    </div>
                </div>
            </div>

            <div class="bar">
                <div class="seekbar">
                    <div class="circle">

                    </div>
                </div>
                <div class="sound-control">
                    <img class="mute-sound white-svg" src="img/sound-on.png" alt="sound-icon">

                    <div class="up-down opacity">
                        <p class="plus-minus" id="minus">
                            <img class="white-svg" src="img/minus.png" alt="Soung-Minus.Png">
                        </p>
                        <div class="sound-line">
                            <div class="sound-percent"></div>
                        </div>
                        <p class="plus-minus" id="plus">
                            <img class="white-svg" src="img/plus.png" alt="Soung-plus.Png">
                        </p>
                    </div>
                </div>

            </div>`
        }
    }
}

main();