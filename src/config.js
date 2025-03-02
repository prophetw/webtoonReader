const config = {
  baseUrl: '', // Will be set on init
  scrollSpeed: 2,
  autoNext: false,
  autoPlay: false,
  
  init() {
    // Initialize baseUrl
    // const hostname = window.location.hostname;
    // this.baseUrl = `http://${hostname}:3000`;
    
    // Load settings from localStorage
    this.scrollSpeed = parseInt(localStorage.getItem('scrollSpeed')) || 2;
    this.autoNext = !!localStorage.getItem('autoNext');
    this.autoPlay = !!localStorage.getItem('autoPlay');
    
    return this;
  },
  
  saveScrollSpeed(speed) {
    this.scrollSpeed = parseInt(speed);
    localStorage.setItem('scrollSpeed', this.scrollSpeed);
  },
  
  toggleAutoNext(enabled) {
    this.autoNext = enabled;
    if (enabled) {
      localStorage.setItem('autoNext', 1);
    } else {
      localStorage.removeItem('autoNext');
    }
  },
  
  toggleAutoPlay(enabled) {
    this.autoPlay = enabled;
    if (enabled) {
      localStorage.setItem('autoPlay', 1);
    } else {
      localStorage.removeItem('autoPlay');
    }
  },
  
  saveLastReadInfo(comicName, episode) {
    try {
      const lastReadInfo = { comicName, episode };
      localStorage.setItem('lastReadInfo', JSON.stringify(lastReadInfo));
    } catch (error) {
      console.error('Failed to save last read info:', error);
    }
  },
  
  getLastReadInfo() {
    try {
      const lastReadInfoStr = localStorage.getItem('lastReadInfo');
      return lastReadInfoStr ? JSON.parse(lastReadInfoStr) : null;
    } catch (error) {
      console.error('Failed to get last read info:', error);
      return null;
    }
  }
};

export default config.init();
