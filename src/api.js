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
      console.log(`Updating score for ${comicName} to ${score}`);

      // Convert score to valid number format
      const numericScore = parseFloat(score);

      // Validate the score (0-5 range)
      const validScore = isNaN(numericScore) ? 0 : Math.min(5, Math.max(0, numericScore));

      // Format for storage (round to nearest half)
      const roundedScore = Math.round(validScore * 2) / 2;

      const response = await fetch(`${config.baseUrl}/api/updateScores/${comicName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ score: roundedScore })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      console.log(`Score updated successfully for ${comicName}`);
      return true;
    } catch (error) {
      console.error('Error updating comic score:', error);
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
  },

  // Update an episode's score
  async updateEpisodeScore(comicName, episode, score) {
    try {
      console.log(`Updating score for ${comicName} - ${episode} to ${score}`);

      // Convert score to valid number format
      const numericScore = parseFloat(score);

      // Validate the score (0-5 range)
      const validScore = isNaN(numericScore) ? 0 : Math.min(5, Math.max(0, numericScore));

      // Format for storage (round to nearest half)
      const roundedScore = Math.round(validScore * 2) / 2;

      const response = await fetch(`${config.baseUrl}/api/updateScores/${comicName}/${episode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ score: roundedScore })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      console.log(`Score updated successfully for ${comicName} - ${episode}`);
      return true;
    } catch (error) {
      console.error('Error updating episode score:', error);
      throw error;
    }
  },

  // Update an episode's tags
  async updateEpisodeTags(comicName, episode, tags) {
    try {
      console.log(`Updating tags for ${comicName} - ${episode}:`, tags);

      const response = await fetch(`${config.baseUrl}/api/updateTags/${comicName}/${episode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tags })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      console.log(`Tags updated successfully for ${comicName} - ${episode}`);
      return true;
    } catch (error) {
      console.error('Error updating episode tags:', error);
      throw error;
    }
  }
};


export default api;
