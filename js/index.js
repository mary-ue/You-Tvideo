const API_KEY = '';
const VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos';
const SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';

const videoListItems = document.querySelector('.video-list__items');

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

fetchTrendingVideos().then((videos) => console.log(videos));

