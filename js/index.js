const API_KEY = '';
const VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos';
const SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';

const favoriteIds = JSON.parse(localStorage.getItem('favoriteYT') || '[]');
console.log(favoriteIds);

const videoListItems = document.querySelector('.video-list__items');

const convertISOToReadableDuration = (isoDuration) => {
  const hoursMatch = isoDuration.match(/(\d+)H/);
  const minutesMatch = isoDuration.match(/(\d+)M/);
  const secondsMatch = isoDuration.match(/(\d+)S/);

  const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
  const seconds = secondsMatch ? parseInt(secondsMatch[1]) : 0;

  let result = '';

  if (hours > 0) {
    result += `${hours} ч `;
  }

  if (minutes > 0) {
    result += `${minutes} мин `;
  }

  if (seconds > 0) {
    result += `${seconds} сек`;
  }

  return result.trim();
};

const fetchTrendingVideos = async () => {
  try {
    const url = new URL(VIDEOS_URL);
    url.searchParams.append('part', 'contentDetails,id,snippet');
    url.searchParams.append('chart', 'mostPopular');
    url.searchParams.append('regionCode', 'JP');
    url.searchParams.append('maxResults', 12);
    url.searchParams.append('key', API_KEY);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(error);
  }
};

const fetchFavoriteVideos = async () => {
  try {
    if (favoriteIds.length === 0) {
      return { items: [] };
    }

    const url = new URL(VIDEOS_URL);
    url.searchParams.append('part', 'contentDetails,id,snippet');
    url.searchParams.append('maxResults', 12);
    url.searchParams.append('id', favoriteIds.join(','))
    url.searchParams.append('key', API_KEY);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(error);
  }
};

const displayVideo = (videos) => {
  videoListItems.textContent = '';

  const listVideos = videos.items.map((video) => {
    const li = document.createElement('li');
    li.classList.add('video-list__item');

    li.innerHTML = `
    <article class="video-card">
      <a class="video-card__link" href="/video.html?id=${video.id}">
        <img class="video-card__thumbnail" src="${
          video.snippet.thumbnails.standard?.url ||
          video.snippet.thumbnails.high?.url
        }"
          alt="Превью видео ${video.snippet.title}" />
        <h3 class="video-card__title">${video.snippet.title}</h3>
        <p class="video-card__channel">${video.snippet.channelTitle}</p>
        <p class="video-card__duration">${convertISOToReadableDuration(
          video.contentDetails.duration
        )}</p>
      </a>
      <button class="video-card__favorite favorite ${
        favoriteIds.includes(video.id) ? 'active' : ''
      }" type="button"
        aria-label="Добавить в избранное, ${video.snippet.title}"
        data-video-id="${video.id}">
        <svg class="video-card__icon">
          <use class="star-o" xlink:href="/images/sprite.svg#star-ob" />
          <use class="star" xlink:href="/images/sprite.svg#star" />
        </svg>
      </button>
    </article>
    `;
    return li;
  });

  videoListItems.append(...listVideos);
};

const init = () => {
  const currentPage = location.pathname.split('/').pop();
  const urlSearchParams = new URLSearchParams(location.search);
  const videoId = urlSearchParams.get('id');
  const searchQuery = urlSearchParams.get('q');

  if (currentPage === 'index.html' || currentPage === '') {
    fetchTrendingVideos().then(displayVideo);
  } else if (currentPage === 'video.html' && videoId) {
    console.log(videoId);
  } else if (currentPage === 'favorite.html') {
    fetchFavoriteVideos().then(displayVideo);
  } else if (currentPage === 'search.html') {
    console.log(currentPage);
  }

  document.body.addEventListener('click', ({ target }) => {
    const itemFavorite = target.closest('.favorite');

    if (itemFavorite) {
      const videoId = itemFavorite.dataset.videoId;

      if (favoriteIds.includes(videoId)) {
        favoriteIds.splice(favoriteIds.indexOf(videoId), 1);
        localStorage.setItem('favoriteYT', JSON.stringify(favoriteIds));
        itemFavorite.classList.remove('active');
      } else {
        favoriteIds.push(videoId);
        localStorage.setItem('favoriteYT', JSON.stringify(favoriteIds));
        itemFavorite.classList.add('active');
      }
    }
  });
};

init();
