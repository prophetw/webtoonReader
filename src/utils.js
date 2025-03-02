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
    
    // Position the ripple precisely where the touch happened
    ripple.style.left = touch.clientX + 'px';
    ripple.style.top = touch.clientY + 'px';
    
    // Add the ripple to the DOM
    document.body.appendChild(ripple);
    
    // Remove after animation completes
    setTimeout(() => {
      ripple.remove();
    }, 600);
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
   * Check if an event is a tap or a drag
   * @param {Object} startCoords - Starting touch coordinates
   * @param {Object} endCoords - Ending touch coordinates
   * @param {number} duration - Touch duration in ms
   * @param {number} maxDistance - Maximum distance for a tap
   * @param {number} maxDuration - Maximum duration for a tap
   * @returns {boolean} True if the event is a tap
   */
  isTap(startCoords, endCoords, duration, maxDistance = 10, maxDuration = 200) {
    const distance = Math.sqrt(
      Math.pow(endCoords.x - startCoords.x, 2) + 
      Math.pow(endCoords.y - startCoords.y, 2)
    );
    return distance <= maxDistance && duration <= maxDuration;
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
  },
  
  /**
   * Prevent default for an event
   * @param {Event} e - The event to prevent default on
   */
  preventDefaultEvent(e) {
    if (e && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
    }
    return false;
  },
  
  /**
   * Gets a sortable representation of a string, considering Chinese characters
   * This is a basic implementation - for a more accurate solution,
   * consider using a dedicated pinyin library
   * @param {string} str - String to get sortable representation for
   * @returns {string} Sortable representation
   */
  getPinyinSortKey(str) {
    // Basic first-letter extraction
    // In a real implementation, this would use a proper pinyin conversion library
    return str.charAt(0).toUpperCase();
  },
  
  /**
   * Checks if a character is a Chinese character
   * @param {string} char - The character to check
   * @returns {boolean} True if the character is Chinese
   */
  isChineseChar(char) {
    return /[\u4e00-\u9fa5]/.test(char);
  },
  
  /**
   * Groups array items by a key function
   * @param {Array} array - The array to group
   * @param {Function} keyFn - Function that returns the key for grouping
   * @returns {Object} Grouped items
   */
  groupBy(array, keyFn) {
    return array.reduce((result, item) => {
      const key = keyFn(item);
      if (!result[key]) {
        result[key] = [];
      }
      result[key].push(item);
      return result;
    }, {});
  }
};

export default utils;
