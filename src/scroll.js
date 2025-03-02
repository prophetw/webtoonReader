import config from './config.js';
import imageLoader from './imageLoader.js';

const scroll = {
  isScrolling: false,
  scrollAnimationFrame: null,
  
  smoothAutoScroll(element, onComplete) {
    let lastPosition = element.scrollTop;
    this.isScrolling = true;
    let consecutiveSamePositionCount = 0;
    
    // Load all images as we start scrolling
    imageLoader.loadAllImages(element);
  
    const scrollStep = () => {
      if (element.scrollTop < element.scrollHeight - element.clientHeight) {
        element.scrollTop += config.scrollSpeed;
        
        // Check if scroll position changed
        if (element.scrollTop !== lastPosition) {
          lastPosition = element.scrollTop;
          consecutiveSamePositionCount = 0;
          this.scrollAnimationFrame = requestAnimationFrame(scrollStep);
        } else {
          consecutiveSamePositionCount++;
          if (consecutiveSamePositionCount > 10) {
            // If position doesn't change for 10 consecutive frames, assume we're at the bottom
            this.stopSmoothScroll();
            if (config.autoNext && typeof onComplete === 'function') {
              onComplete();
            }
          } else {
            this.scrollAnimationFrame = requestAnimationFrame(scrollStep);
          }
        }
        
        // Check if we need to load more images
        const scrollPercent = (element.scrollTop / (element.scrollHeight - element.clientHeight)) * 100;
        if (scrollPercent > 50) {
          imageLoader.loadAllImages(element);
        }
      } else {
        this.stopSmoothScroll();
        if (config.autoNext && typeof onComplete === 'function') {
          onComplete();
        }
      }
    };
    
    this.scrollAnimationFrame = requestAnimationFrame(scrollStep);
  },
  
  stopSmoothScroll() {
    if (this.scrollAnimationFrame) {
      cancelAnimationFrame(this.scrollAnimationFrame);
      this.scrollAnimationFrame = null;
    }
    this.isScrolling = false;
  },
  
  scrollToTop(element) {
    element.scrollTop = 0;
  },
  
  scrollToBottom(element) {
    element.scrollTop = element.scrollHeight;
    // When scrolling to bottom, make sure all images are loaded
    imageLoader.loadAllImages(element);
  }
};

export default scroll;
