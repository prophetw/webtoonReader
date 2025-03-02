import config from './config.js';

const scroll = {
  isScrolling: false,
  scrollAnimationFrame: null,
  
  smoothAutoScroll(element, onComplete) {
    let lastPosition = element.scrollTop;
    this.isScrolling = true;
    let consecutiveSamePositionCount = 0;
  
    const scrollStep = () => {
      if (element.scrollTop < element.scrollHeight - element.clientHeight) {
        element.scrollTop += config.scrollSpeed;
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
    cancelAnimationFrame(this.scrollAnimationFrame);
    this.isScrolling = false;
  },
  
  scrollToTop(element) {
    element.scrollTop = 0;
  },
  
  scrollToBottom(element) {
    element.scrollTop = element.scrollHeight;
  }
};

export default scroll;
