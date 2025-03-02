import config from './config.js';
import ui from './ui.js';

const imageLoader = {
  loadImagesSequentially(imageUrls, container) {
    return new Promise((resolve) => {
      let index = 0;
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (!img.src.startsWith('data:')) {
              const dataSrc = img.getAttribute('data-src');
              if (dataSrc) {
                img.src = dataSrc;
                img.removeAttribute('data-src');
              }
            }
            observer.unobserve(img);
          }
        });
      });
      
      function loadImage() {
        // No need to wait for all images to load
        if (index > 10) {
          ui.hideLoading();
          resolve();
          return;
        }
        
        if (index < imageUrls.length) {
          const imageUrl = imageUrls[index];
          const img = document.createElement('img');
          
          // Use lazy loading for images
          img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // Transparent 1px GIF
          
          const fullUrl = imageUrl.startsWith('http://') || imageUrl.startsWith('https://') 
            ? imageUrl 
            : `${config.baseUrl}${imageUrl}`;
            
          img.setAttribute('data-src', fullUrl);
          img.classList.add('lazy-image');
          
          img.onload = () => {
            // Only for the first few images
            if (index < 10) {
              index++;
              loadImage();
            }
          };
          
          img.onerror = () => {
            console.error('Error loading image:', imageUrl);
            index++;
            loadImage();
          };
          
          container.appendChild(img);
          imageObserver.observe(img);
          
          // For images beyond the first few, don't wait for onload
          if (index >= 10) {
            index++;
            loadImage();
          }
        } else {
          ui.hideLoading();
          resolve();
        }
      }
      
      loadImage();
    });
  }
};

export default imageLoader;
