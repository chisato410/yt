let player;
let youtubeId = "ozbgCyMdciU";

// 設定
const DEFAULT_VOLUME = 5;
const YT_API_KEY = "AIzaSyC-qvW8IurfpIjs9L7_kXVEGGXJWLWLcq4"; // ← 差し替え推奨
const searchList = document.querySelector(".searchlist");
const volumeInput = document.querySelector("#volume");
const volumeNum = document.querySelector("#volumeNum");
const memoText = document.querySelector("#memoText");
const memoList = document.querySelector("#memoList");

// ---------- YouTube API ---------- //
function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    height: "360",
    width: "640",
    videoId: youtubeId,
    playerVars: {
      playsinline: 1,
      controls: 0,
    },
    events: {
      onReady: onPlayerReady,
    },
  });
}

const onPlayerReady = (event) => {
  event.target.setVolume(DEFAULT_VOLUME);
  updateVolumeDisplay(DEFAULT_VOLUME);
  renderMemos();
};

const playVideo = () => player.playVideo();
const pauseVideo = () => player.pauseVideo();
const stopVideo = () => player.stopVideo();

const toggleMute = () => {
  const btn = document.querySelector("#mute");
  if (player.isMuted()) {
    player.unMute();
    btn.innerText = "ミュート";
  } else {
    player.mute();
    btn.innerText = "ミュート解除";
  }
};

const seek = (seconds) => {
  player.seekTo(player.getCurrentTime() + seconds, true);
};

const changeVolume = (vol) => {
  player.setVolume(vol);
  updateVolumeDisplay(vol);
};

const updateVolumeDisplay = (vol) => {
  volumeInput.value = vol;
  volumeNum.textContent = vol;
};

const changeVideo = (videoId) => {
  youtubeId = videoId;
  player.destroy();
  player = null;
  onYouTubeIframeAPIReady(); // onReady内で renderMemos() 実行
};

const changePlaybackRate = (rate) => {
  player.setPlaybackRate(rate);
  player.playVideo();
};

// ---------- メモ関連 ---------- //
const getMemoKey = () => `youtube_memo_${youtubeId}`;
const loadMemos = () => JSON.parse(localStorage.getItem(getMemoKey())) || [];

const saveMemo = (time, text) => {
  const memos = loadMemos();
  memos.push({ time, text });
  localStorage.setItem(getMemoKey(), JSON.stringify(memos));
  renderMemos();
};

const renderMemos = () => {
  if (!memoList) return;

  memoList.innerHTML = "";
  loadMemos().forEach((memo, index) => {
    const li = document.createElement("li");
    const timestamp = formatTime(memo.time);
    li.innerHTML = `
      <button data-time="${memo.time}" style="margin-right: 5px;">⏩ ${timestamp}</button>
      <span class="memo-text">${memo.text}</span>
      <button class="edit-memo" data-index="${index}" style="margin-left:10px;">✏️</button>
      <button class="delete-memo" data-index="${index}" style="margin-left:5px;">🗑️</button>
    `;

    li.querySelector("button[data-time]").addEventListener("click", (e) => {
      player.seekTo(parseFloat(e.target.getAttribute("data-time")), true);
    });

    li.querySelector(".edit-memo").addEventListener("click", (e) => {
      const idx = e.target.getAttribute("data-index");
      const memos = loadMemos();
      const newText = prompt("メモを編集:", memos[idx].text);
      if (newText && newText.trim()) {
        memos[idx].text = newText.trim();
        localStorage.setItem(getMemoKey(), JSON.stringify(memos));
        renderMemos();
      }
    });

    li.querySelector(".delete-memo").addEventListener("click", (e) => {
      const idx = e.target.getAttribute("data-index");
      const memos = loadMemos();
      memos.splice(idx, 1);
      localStorage.setItem(getMemoKey(), JSON.stringify(memos));
      renderMemos();
    });

    memoList.appendChild(li);
  });
};

const formatTime = (seconds) => {
  const min = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const sec = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${min}:${sec}`;
};

const handleAddMemo = () => {
  const text = memoText.value.trim();
  if (!text) return;
  saveMemo(player.getCurrentTime(), text);
  memoText.value = "";
};

// ---------- YouTube検索 ---------- //
const ytSearch = (val) => {
  const maxResults = 10;
  fetch(
    `https://www.googleapis.com/youtube/v3/search?type=video&part=snippet&maxResults=${maxResults}&key=${YT_API_KEY}&q=${val}`
  )
    .then((res) => res.json())
    .then((obj) => {
      searchList.innerHTML = ""; // リスト初期化
      obj.items.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.id.videoId;
        option.textContent = item.snippet.title;
        searchList.appendChild(option);
      });
    });
};

// ---------- イベントバインド ---------- //
document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#doplay").addEventListener("click", playVideo);
  document.querySelector("#dopause").addEventListener("click", pauseVideo);
  document.querySelector("#dostop").addEventListener("click", stopVideo);
  document.querySelector("#mute").addEventListener("click", toggleMute);
  document
    .querySelector("#do10sPrev")
    .addEventListener("click", () => seek(-10));
  document
    .querySelector("#do10sNext")
    .addEventListener("click", () => seek(10));
  volumeInput.addEventListener("input", (e) =>
    changeVolume(Number(e.target.value))
  );
  document
    .querySelector("#MovieId")
    .addEventListener("change", (e) => changeVideo(e.target.value));
  document.querySelector("#doSpeed").addEventListener("change", (e) => {
    const rate = parseFloat(e.target.value);
    if (!isNaN(rate)) changePlaybackRate(rate);
  });
  document.querySelector("#addMemo").addEventListener("click", handleAddMemo);
  document.querySelector("#searchBtn").addEventListener("click", (e) => {
    e.preventDefault();
    ytSearch(document.querySelector("#ytSearch").value);
  });

  // ← 追加：検索リストの選択変更時に動画切り替え
  searchList.addEventListener("change", (e) => {
    const selectedVideoId = e.target.value;
    if (selectedVideoId) changeVideo(selectedVideoId);
  });
});
