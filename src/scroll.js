import config from './config.js';
import imageLoader from './imageLoader.js';

const scroll = {
  isScrolling: false,
  scrollAnimationFrame: null,
  throttleTimer: null,
  
  smoothAutoScroll(element, onComplete) {
    let lastPosition = element.scrollTop;
    this.isScrolling = true;
    let consecutiveSamePositionCount = 0;
    
    // Load images as we start scrolling - but only once
    console.log('Auto-scroll: Loading all images');
    imageLoader.loadAllImages(element);
  
    const scrollStep = () => {
      if (element.scrollTop < element.scrollHeight - element.clientHeight) {
        element.scrollTop += config.scrollSpeed;
        
        // Check if scroll position changed
        if (element.scrollTop !== lastPosition) {
          lastPosition = element.scrollTop;
          consecutiveSamePositionCount = 0;
          this.scrollAnimationFrame = requestAnimationFrame(scrollStep);
          
          // Throttled check to load more images 
          if (!this.throttleTimer) {
            this.throttleTimer = setTimeout(() => {
              this.throttleTimer = null;
              const scrollPercent = (element.scrollTop / (element.scrollHeight - element.clientHeight)) * 100;
              if (scrollPercent > 50) {
                imageLoader.loadAllImages(element);
              }
            }, 500);
          }
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
    
    if (this.throttleTimer) {
      clearTimeout(this.throttleTimer);
      this.throttleTimer = null;
    }
    
    this.isScrolling = false;
  },
  
  scrollToTop(element) {
    element.scrollTop = 0;
  },
  
  scrollToBottom(element) {
    console.log('Scrolling to bottom and loading all images');
    imageLoader.loadAllImages(element);
    // Use setTimeout to ensure all images' DOM is updated before calculating final height
    setTimeout(() => {
      element.scrollTop = element.scrollHeight;
    }, 100);
  }
};

export default scroll;
