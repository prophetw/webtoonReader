import config from './config.js';
import ui from './ui.js';

const imageLoader = {
  loadImagesSequentially(imageUrls, container) {
    return new Promise((resolve) => {
      // Clear any previous images
      container.innerHTML = '';
      console.log(`Starting to load ${imageUrls.length} images`);
      
      if (imageUrls.length === 0) {
        ui.warning('没有找到图片', 2000);
        ui.hideLoading();
        resolve();
        return;
      }
      
      // Create all image elements upfront
      const imageElements = imageUrls.map((url, index) => {
        const img = document.createElement('img');
        img.setAttribute('data-index', index);
        img.className = 'lazy-image';
        
        // Set placeholder and basic styling
        img.alt = `图片 ${index + 1}`;
        img.style.minHeight = '50px';
        
        // Prepare the full URL
        const fullUrl = url.startsWith('http://') || url.startsWith('https://') 
          ? url 
          : `${config.baseUrl}${url}`;
        img.setAttribute('data-src', fullUrl);
        
        // Append each image to container
        container.appendChild(img);
        return img;
      });
      
      // Set up intersection observer for lazy loading
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.getAttribute('data-src');
            
            if (src && !img.src.includes(src)) {
              console.log(`Loading image ${img.getAttribute('data-index')} from ${src}`);
              img.src = src;
              
              // Remove the placeholder styling once loaded
              img.onload = function() {
                img.style.minHeight = 'auto';
                img.classList.add('loaded');
                observer.unobserve(img);  // Stop observing once loaded
              };
              
              img.onerror = function() {
                console.error(`Failed to load image ${img.getAttribute('data-index')} from ${src}`);
                img.alt = '加载失败';
                img.style.backgroundColor = '#f0f0f0';
                img.style.minHeight = '150px';
                observer.unobserve(img);  // Stop observing
              };
            }
          }
        });
      }, {
        // Load images as they approach the viewport
        rootMargin: '200px 0px',
        threshold: 0.01
      });
      
      // Observe all images
      imageElements.forEach(img => {
        observer.observe(img);
      });
      
      // Load the first few images immediately
      for (let i = 0; i < Math.min(5, imageElements.length); i++) {
        const img = imageElements[i];
        const src = img.getAttribute('data-src');
        if (src) {
          console.log(`Preloading image ${i} from ${src}`);
          img.src = src;
        }
      }
      
      // Hide loading after a short delay to allow initial images to appear
      setTimeout(() => {
        ui.hideLoading();
        resolve();
      }, 500);
    });
  },
  
  // Method to force load all remaining unloaded images
  loadAllImages(container) {
    const unloadedImages = container.querySelectorAll('img:not(.loaded)');
    unloadedImages.forEach(img => {
      const src = img.getAttribute('data-src');
      if (src && !img.src.includes(src)) {
        img.src = src;
      }
    });
  },
  
  // Setup global image error handling
  setupImageErrorHandling(container) {
    container.addEventListener('error', function(e) {
      if (e.target.tagName === 'IMG') {
        console.error('Image failed to load:', e.target.src);
        e.target.alt = '图片加载失败';
        e.target.style.minHeight = '150px';
        e.target.style.backgroundColor = '#f0f0f0';
        e.target.onerror = null; // Prevent further error events
      }
    }, true);
  }
};

export default imageLoader;
