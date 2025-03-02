import config from './config.js';

const api = {
  async fetchComicsMetaInfo() {
    const response = await fetch(`${config.baseUrl}/api/metaInfo`);
    return response.json();
  },
  
  async fetchComics() {
    const response = await fetch(`${config.baseUrl}/api/comics`);
    return response.json();
  },
  
  async fetchEpisodes(comicName) {
    const response = await fetch(`${config.baseUrl}/api/comics/${comicName}`);
    return response.json();
  },
  
  async fetchImages(comicName, episode) {
    const response = await fetch(`${config.baseUrl}/api/comics/${comicName}/${episode}`);
    return response.json();
  },
  
  async updateComicScore(comicName, score) {
    await fetch(`${config.baseUrl}/api/updateScores/${comicName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ score }),
    });
  },
  
  async updateComicTags(comicName, tags) {
    await fetch(`${config.baseUrl}/api/updateTags/${comicName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tags }),
    });
  }
};

export default api;
