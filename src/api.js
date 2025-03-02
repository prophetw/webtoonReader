import config from './config.js';

const api = {
  async fetchComicsMetaInfo() {
    try {
      const response = await fetch(`${config.baseUrl}/api/metaInfo`);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching comics meta info:', error);
      return {};
    }
  },
  
  async fetchComics() {
    try {
      const response = await fetch(`${config.baseUrl}/api/comics`);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching comics:', error);
      return [];
    }
  },
  
  async fetchEpisodes(comicName) {
    try {
      const response = await fetch(`${config.baseUrl}/api/comics/${comicName}`);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error(`Error fetching episodes for ${comicName}:`, error);
      return [];
    }
  },
  
  async fetchImages(comicName, episode) {
    try {
      const url = `${config.baseUrl}/api/comics/${comicName}/${episode}`;
      console.log('Fetching images from URL:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Received ${data.length} images from API`);
      return data;
    } catch (error) {
      console.error(`Error fetching images for ${comicName} - ${episode}:`, error);
      return [];
    }
  },
  
  async updateComicScore(comicName, score) {
    try {
      const response = await fetch(`${config.baseUrl}/api/updateScores/${comicName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ score }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      return true;
    } catch (error) {
      console.error(`Error updating score for ${comicName}:`, error);
      throw error;
    }
  },
  
  async updateComicTags(comicName, tags) {
    try {
      const response = await fetch(`${config.baseUrl}/api/updateTags/${comicName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tags }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      return true;
    } catch (error) {
      console.error(`Error updating tags for ${comicName}:`, error);
      throw error;
    }
  }
};

export default api;
