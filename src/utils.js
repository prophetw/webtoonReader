/**
 * Utilities for handling various helper functions
 */
const utils = {
  /**
   * Add visual feedback for touch events (ripple effect)
   * @param {TouchEvent} e - The touch event
   */
  addTouchFeedback(e) {
    const touch = e.changedTouches[0];
    const ripple = document.createElement('div');
    ripple.className = 'touch-feedback';
    ripple.style.left = touch.clientX + 'px';
    ripple.style.top = touch.clientY + 'px';
    document.body.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600); // Remove after animation finishes
  },
  
  /**
   * Detect if the user's device has a touchscreen
   * More reliable than just checking userAgent
   */
  isTouchDevice() {
    return (('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0) ||
      (navigator.msMaxTouchPoints > 0));
  },
  
  /**
   * Detects if the device is in portrait or landscape orientation
   * @returns {boolean} True if device is in portrait mode
   */
  isPortraitMode() {
    return window.matchMedia("(orientation: portrait)").matches;
  },
  
  /**
   * Debounce function to limit how often a function can be called
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  
  /**
   * Throttle function to limit call frequency
   */
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};

export default utils;
