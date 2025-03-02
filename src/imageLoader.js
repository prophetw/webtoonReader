import config from './config.js';
import ui from './ui.js';

const imageLoader = {
  loadImagesSequentially(imageUrls, container) {
    return new Promise((resolve) => {
      let index = 0;
      
      // Create an Intersection Observer for lazy loading
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const dataSrc = img.getAttribute('data-src');
            if (dataSrc && img.src !== dataSrc) {
              // Set a loading state
              img.style.opacity = '0.5';
              
              // Actually load the image
              const tempImg = new Image();
              tempImg.onload = () => {
                img.src = dataSrc;
                img.style.opacity = '1';
              };
              tempImg.onerror = () => {
                console.error('Error loading image:', dataSrc);
                img.style.opacity = '1';
                img.alt = 'Failed to load image';
              };
              tempImg.src = dataSrc;
            }
            observer.unobserve(img);
          }
        });
      }, {
        rootMargin: '100px 0px' // Load images a bit before they come into view
      });
      
      // Function to add images to the DOM
      function loadImage() {
        // Show at least first 5 images immediately
        if (index >= 5 && index > imageUrls.length * 0.1) {
          ui.hideLoading();
          resolve();
          return;
        }
        
        if (index < imageUrls.length) {
          const imageUrl = imageUrls[index];
          const img = document.createElement('img');
          
          // Create a placeholder for the image
          img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // 1px transparent GIF
          
          // Set up actual image URL
          const fullUrl = imageUrl.startsWith('http://') || imageUrl.startsWith('https://') 
            ? imageUrl 
            : `${config.baseUrl}${imageUrl}`;
          
          img.setAttribute('data-src', fullUrl);
          img.alt = `Image ${index + 1}`;
          img.style.display = 'block';
          img.style.width = '100%';
          img.style.maxWidth = '100%';
          img.classList.add('lazy-image');
          
          // Add to container and observe
          container.appendChild(img);
          imageObserver.observe(img);
          
          // Preload the first few images immediately
          if (index < 3) {
            const preloadImg = new Image();
            preloadImg.src = fullUrl;
          }
          
          // Continue loading next image
          index++;
          
          // Use setTimeout to prevent blocking the UI thread
          setTimeout(loadImage, 10);
        } else {
          ui.hideLoading();
          resolve();
        }
      }
      
      // Start loading process
      container.innerHTML = ''; // Clear container first
      loadImage();
      
      // Add debugging info
      console.log(`Loading ${imageUrls.length} images`);
    });
  },
  
  // Helper method to add image loading error handler
  setupImageErrorHandling(container) {
    container.addEventListener('error', function(e) {
      if (e.target.tagName === 'IMG') {
        console.error('Image failed to load:', e.target.src);
        e.target.alt = 'Image failed to load';
        e.target.style.height = '100px';
        e.target.style.background = '#f0f0f0';
        e.target.onerror = null; // Prevent infinite error loop
      }
    }, true);
  }
};

export default imageLoader;
