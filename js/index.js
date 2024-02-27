const API_KEY = YOUTUBE_API_KEY;
const VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos';
const SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';

const router = new Navigo('/', { hash: true });
const main = document.querySelector('main');

const favoriteIds = JSON.parse(localStorage.getItem('favoriteYT') || '[]');

const preload = {
  elem: document.createElement('div'),
  text: '<p class="preload__text">Loading...</p>',
  append() {
    main.style.display = 'flex';
    main.style.margin = 'auto';
    main.append(this.elem);
  },
  remove() {
    main.style.display = '';
    main.style.margin = '';
    this.elem.remove();
  },
  init() {
    this.elem.className = 'preload';
    this.elem.innerHTML = this.text;
  },
};

preload.init();

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

const formatDate = (isoString) => {
  const date = new Date(isoString);
  const formatter = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return formatter.format(date);
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
    url.searchParams.append('id', favoriteIds.join(','));
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

const fetchVideoData = async (id) => {
  try {
    const url = new URL(VIDEOS_URL);
    url.searchParams.append('part', 'snippet,statistics');
    url.searchParams.append('id', id);
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

const fetchSearchVideos = async (searchQuery, page) => {
  try {
    const url = new URL(SEARCH_URL);
    url.searchParams.append('part', 'snippet');
    url.searchParams.append('q', searchQuery);
    url.searchParams.append('type', 'video');
    url.searchParams.append('key', API_KEY);

    if (page) {
      url.searchParams.append('pageToken', page);
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(error);
  }
};

const createListVideo = (videos, titleText, pagination) => {
  const videoListSection = document.createElement('section');
  videoListSection.classList.add('video-list');

  const container = document.createElement('div');
  container.classList.add('container');

  const title = document.createElement('h2');
  title.classList.add('video-list__title');
  title.textContent = titleText;

  const videoListItems = document.createElement('ul');
  videoListItems.classList.add('video-list__items');

  const listVideos = videos.items.map((video) => {
    const li = document.createElement('li');
    li.classList.add('video-list__item');

    li.innerHTML = `
    <article class="video-card">
      <a class="video-card__link" href="#/video/${
        video.id.videoId || video.id
      }">
        <img class="video-card__thumbnail" src="${
          video.snippet.thumbnails.standard?.url ||
          video.snippet.thumbnails.high?.url
        }"
          alt="Превью видео ${video.snippet.title}" />
        <h3 class="video-card__title">${video.snippet.title}</h3>
        <p class="video-card__channel">${video.snippet.channelTitle}</p>
        ${
          video.contantDetails
            ? `<p class="video-card__duration">${convertISOToReadableDuration(
                video.contentDetails.duration
              )}</p>`
            : ''
        }
      </a>
      <button class="video-card__favorite favorite ${
        favoriteIds.includes(video.id.videoId || video.id) ? 'active' : ''
      }" type="button"
        aria-label="Добавить в избранное, ${video.snippet.title}"
        data-video-id="${video.id.videoId || video.id}">
        <svg class="video-card__icon">
          <use class="star-o" xlink:href="/images/sprite.svg#star-bw" />
          <use class="star" xlink:href="/images/sprite.svg#star" />
        </svg>
      </button>
    </article>
    `;
    return li;
  });

  videoListItems.append(...listVideos);
  videoListSection.append(container);
  container.append(title, videoListItems);

  if (pagination) {
    const paginationElem = document.createElement('div');
    paginationElem.classList.add('pagination');

    if (pagination.prev) {
      const arrowPrev = document.createElement('a');
      arrowPrev.classList.add('pagination__arrow');
      arrowPrev.text = 'ᐊ';
      arrowPrev.href = `#search?q=${pagination.searchQuery}&page=${pagination.prev}`;
      paginationElem.append(arrowPrev);
    }

    if (pagination.next) {
      const arrowNext = document.createElement('a');
      arrowNext.classList.add('pagination__arrow');
      arrowNext.text = 'ᐅ';
      arrowNext.href = `#search?q=${pagination.searchQuery}&page=${pagination.next}`;
      paginationElem.append(arrowNext);
    }

    videoListSection.append(paginationElem);
  }

  return videoListSection;
};

const createVideo = (video) => {
  const videoSection = document.createElement('section');
  videoSection.classList.add('video');

  videoSection.innerHTML = `
  <div class="container">
    <div class="video__player">
      <iframe class="video__iframe" src="https://www.youtube.com/embed/${
        video.id
      }" frameborder="0" allowfullscreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"></iframe>
    </div>
    <div class="video__container">
      <div class="video__content">
        <h2 class="video__title">${video.snippet.title}</h2>
        <p class="video__channel">${video.snippet.channelTitle}</p>
        <p class="video__info">
          <span class="video__views">${parseInt(
            video.statistics.viewCount
          ).toLocaleString()} просмотр </span>
          <span class="video__date">Дата премьеры: ${formatDate(
            video.snippet.publishedAt
          )}</span>
        </p>
        <p class="video__description">
        ${video.snippet.description}
        </p>
      </div>
      <button class="video__link favorite ${
        favoriteIds.includes(video.id) ? 'active' : ''
      }">
        <span class="video__no-favorite">Избранное</span>
        <span class="video__favorite">В избранном</span>
        <svg class="video__icon">
          <use xlink:href="/images/sprite.svg#star-ob" />
        </svg>
      </button>
    </div>
  </div>
  `;

  return videoSection;
};

const createHero = () => {
  // const header = document.querySelector('.header');

  // if (header) {
  //   header.remove();
  // }

  const heroSection = document.createElement('section');
  heroSection.className = 'hero';
  heroSection.innerHTML = `
    <div class="container">
      <div class="hero__container">
        <a class="hero__link" href="#/favorite">
          <span class="hero__link-text">Избранное</span>
          <svg class="hero__icon">
            <use xlink:href="images/sprite.svg#star-ow"></use>
          </svg>
        </a>
        <svg class="hero__logo" viewBox="0 0 360 48" role="img" aria-label="Логотип севиса You-Tvideo">
          <use xlink:href="/images/sprite.svg#logo-white" />
        </svg>
        <h1 class="hero__title">Смотри. Загружай. Создавай</h1>
        <p class="hero__tagline">Удобный видеохостинг для тебя</p>
      </div>
    </div>
  `;
  return heroSection;
};

const createSearch = () => {
  const searchSection = document.createElement('section');
  searchSection.className = 'search';
  const container = document.createElement('div');
  container.className = 'container';
  const title = document.createElement('h2');
  title.className = 'visually-hidden';
  title.textContent = 'поиск';

  const form = document.createElement('form');
  form.className = 'search__form';

  searchSection.append(container);
  container.append(title, form);
  form.innerHTML = `
    <input class="search__input" name="search" type="search" placeholder="Найти видео..." required>
    <button class="search__btn" type="submit">
      <span>поиск</span>
      <svg class="search__icon">
        <use xlink:href="/images/sprite.svg#search" />
      </svg>
    </button>
  `;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (form.search.value.trim()) {
      router.navigate(`/search?q=${form.search.value}`);
    }
  });

  return searchSection;
};

const createHeader = () => {
  const header = document.querySelector('.header');

  if (header) {
    return header;
  }

  const headerElem = document.createElement('header');
  headerElem.classList.add('header');

  headerElem.innerHTML = `
  <div class="container header__container">
    <a class="header__link" href="#">
      <svg class="header__logo" viewBox="0 0 240 32" role="img" aria-label="Логотип севиса You-Tvideo">
        <use xlink:href="/images/sprite.svg#logo-orange" />
      </svg>
    </a>
    <a class="header__link header__link_favorite" href="#/favorite">
      <span class="header__link-text">Избранное</span>
      <svg class="header__icon">
        <use xlink:href="/images/sprite.svg#star-ob" />
      </svg>
    </a>
  </div>
  `;

  return headerElem;
};

const indexRoute = async () => {
  document.querySelector('.header')?.remove();
  main.textContent = '';
  preload.append();
  const hero = createHero();
  const search = createSearch();
  const videos = await fetchTrendingVideos();
  preload.remove();
  const listVideo = createListVideo(videos, 'В тренде');
  main.append(hero, search, listVideo);
};

const videoRoute = async (ctx) => {
  const id = ctx.data.id;

  main.textContent = '';
  preload.append();
  document.body.prepend(createHeader());
  const search = createSearch();
  const data = await fetchVideoData(id);
  const video = data.items[0];
  preload.remove();
  const videoSection = createVideo(video);
  main.append(search, videoSection);

  const searchQuery = video.snippet.title;
  const videos = await fetchSearchVideos(searchQuery);
  const listVideo = createListVideo(videos, 'Похожие видео');
  main.append(listVideo);
};

const favoriteRoute = async () => {
  document.body.prepend(createHeader());
  main.textContent = '';
  preload.append();
  const search = createSearch();
  const videos = await fetchFavoriteVideos();
  preload.remove();
  const listVideo = createListVideo(videos, 'Избранное');
  main.append(search, listVideo);
};

const searchRoute = async (ctx) => {
  const searchQuery = ctx.params.q;
  const page = ctx.params.page;

  if (searchQuery) {
    document.body.prepend(createHeader());
    main.textContent = '';
    preload.append();
    const search = createSearch();
    const videos = await fetchSearchVideos(searchQuery, page);
    preload.remove();
    const listVideo = createListVideo(videos, 'Результаты поиска', {
      searchQuery,
      next: videos.nextPageToken,
      prev: videos.prevPageToken,
    });

    main.append(search, listVideo);
  }
};

const init = () => {
  router
    .on({
      '/': indexRoute,
      '/video/:id': videoRoute,
      '/favorite': favoriteRoute,
      '/search': searchRoute,
    })
    .resolve();
  // const currentPage = location.pathname.split('/').pop();
  // const urlSearchParams = new URLSearchParams(location.search);
  // const videoId = urlSearchParams.get('id');
  // const searchQuery = urlSearchParams.get('q');

  // if (currentPage === 'index.html' || currentPage === '') {
  //   fetchTrendingVideos().then(displayListVideo);
  // } else if (currentPage === 'video.html' && videoId) {
  //   fetchVideoData(videoId).then(displayVideo);
  // } else if (currentPage === 'favorite.html') {
  //   fetchFavoriteVideos().then(displayListVideo);
  // } else if (currentPage === 'search.html' && searchQuery) {
  //   console.log(currentPage);
  // }

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
