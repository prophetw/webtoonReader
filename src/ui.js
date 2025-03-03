const ui = {
  showLoading() {
    const loading = document.getElementById('loading');
    loading.style.display = 'flex';
  },
  
  hideLoading() {
    const loading = document.getElementById('loading');
    loading.style.display = 'none';
  },
  
  warning(message, duration, position = 'mid') {
    const warningPanel = document.getElementById('warningPanel');
    const warningMessage = document.getElementById('warningMessage');
    warningMessage.innerHTML = message;
    warningPanel.style.display = 'block';
    
    // Position
    if (position === 'top') {
      warningPanel.style.top = '20%';
    } else if (position === 'mid') {
      warningPanel.style.top = '50%';
    } else if (position === 'bottom') {
      warningPanel.style.bottom = '70%';
    }
  
    setTimeout(() => {
      warningPanel.style.display = 'none';
    }, duration);
  },
  
  confirm(title, message, duration, defaultResult = true) {
    const confirmPanel = document.getElementById('confirmPanel');
    const confirmTitle = document.getElementById('confirmTitle');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmBtn = document.getElementById('confirmBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    
    confirmTitle.innerHTML = title;
    confirmMessage.innerHTML = message;
    confirmPanel.style.display = 'block';
    
    let interval;
    return new Promise((resolve) => {
      confirmBtn.onclick = () => {
        confirmPanel.style.display = 'none';
        if (interval) {
          clearInterval(interval);
        }
        resolve(true);
      };
      
      cancelBtn.onclick = () => {
        confirmPanel.style.display = 'none';
        if (interval) {
          clearInterval(interval);
        }
        resolve(false);
      };
      
      // Update remaining time in message
      interval = setInterval(() => {
        duration -= 1000;
        confirmMessage.innerHTML = `${message} <br> ${duration / 1000} seconds left`;
        if (duration <= 0) {
          clearInterval(interval);
          resolve(defaultResult);
          confirmPanel.style.display = 'none';
        }
      }, 1000);
    });
  },
  
  hideAddressBar() {
    if (!window.location.hash) {
      if (document.height < window.outerHeight) {
        document.body.style.height = window.outerHeight + 50 + 'px';
      }
      setTimeout(() => {
        window.scrollTo(0, 1);
      }, 50);
    }
  },
  
  setBrightness(value) {
    document.body.style.filter = `brightness(${value}%)`;
    // Update the displayed value
    const brightnessValue = document.getElementById('brightnessValue');
    if (brightnessValue) {
      brightnessValue.textContent = `${value}%`;
    }
    // Save the brightness value to localStorage
    localStorage.setItem('brightness', value);
  },
  
  // Load saved brightness from localStorage
  loadBrightness() {
    const savedBrightness = localStorage.getItem('brightness');
    const brightnessSlider = document.getElementById('brightnessSlider');
    
    if (savedBrightness) {
      const brightnessValue = parseInt(savedBrightness, 10);
      // Apply the saved brightness
      this.setBrightness(brightnessValue);
      
      // Update the slider value if it exists
      if (brightnessSlider) {
        brightnessSlider.value = brightnessValue;
      }
    } else {
      // Default brightness is 100%
      this.setBrightness(100);
      if (brightnessSlider) {
        brightnessSlider.value = 100;
      }
    }
  },
  
  // Initialize brightness control
  initBrightnessControl() {
    const brightnessSlider = document.getElementById('brightnessSlider');
    if (!brightnessSlider) return;
    
    // For mobile devices: add specific touch handlers to prevent scrolling
    let touchActive = false;
    
    // Handle touch start on slider
    brightnessSlider.addEventListener('touchstart', (e) => {
      touchActive = true;
      // Update brightness based on touch position
      this.updateBrightnessFromTouch(e);
    }, { passive: false });
    
    // Handle touch move for continuous update
    brightnessSlider.addEventListener('touchmove', (e) => {
      if (touchActive) {
        e.preventDefault(); // Prevent scrolling while adjusting slider
        e.stopPropagation();
        this.updateBrightnessFromTouch(e);
      }
    }, { passive: false });
    
    // Handle touch end
    brightnessSlider.addEventListener('touchend', () => {
      touchActive = false;
    }, { passive: true });
    
    brightnessSlider.addEventListener('touchcancel', () => {
      touchActive = false;
    }, { passive: true });
    
    // Standard input event for both desktop and as backup for mobile
    brightnessSlider.addEventListener('input', (e) => {
      this.setBrightness(e.target.value);
    });
    
    // Change event for when the interaction ends
    brightnessSlider.addEventListener('change', (e) => {
      this.setBrightness(e.target.value);
    });
    
    // Load initial brightness
    this.loadBrightness();
    
    // Fix for iOS/Safari where the slider might not register properly
    setTimeout(() => {
      const currentValue = brightnessSlider.value;
      this.setBrightness(currentValue);
    }, 100);
  },
  
  // Helper function to get brightness value from touch position
  updateBrightnessFromTouch(e) {
    if (!e.touches || e.touches.length === 0) return;
    
    const slider = e.target;
    const touch = e.touches[0];
    const sliderRect = slider.getBoundingClientRect();
    
    // Calculate relative position within the slider (0 to 1)
    const relativePosition = Math.max(0, Math.min(1, 
      (touch.clientX - sliderRect.left) / sliderRect.width
    ));
    
    // Convert to slider value range
    const min = parseInt(slider.min, 10) || 30;
    const max = parseInt(slider.max, 10) || 150;
    const step = parseInt(slider.step, 10) || 5;
    
    // Calculate value based on position and step
    let value = min + (max - min) * relativePosition;
    
    // Round to nearest step
    value = Math.round(value / step) * step;
    
    // Update slider and apply brightness
    slider.value = value;
    this.setBrightness(value);
    
    // Debug output to console (can be removed in production)
    console.log(`Brightness updated from touch: ${value}%`);
  },

  togglePanel(panelId) {
    const panel = document.getElementById(panelId);
    const isVisible = panel.style.transform === 'translateX(0px)';
    
    // Hide all panels first
    this.hideAllPanels();
    
    // Toggle the selected panel
    if (!isVisible) {
      if (panelId === 'comics' || panelId === 'episodes') {
        panel.style.transform = 'translateX(0px)';
        // Add active class to help with styling and event detection
        panel.classList.add('active-panel');
      } else if (panelId === 'settingPanel') {
        panel.style.transform = 'translateX(0px)';
        panel.classList.add('active-panel');
      }
    }
    
    // Update the UI to reflect which panel is active
    this.updatePanelToggles(panelId, !isVisible);
  },
  
  hideAllPanels() {
    const panels = document.querySelectorAll('.list-panel');
    panels.forEach(panel => {
      if (panel.id === 'comics' || panel.id === 'episodes') {
        panel.style.transform = 'translateX(-100%)';
      } else if (panel.id === 'settingPanel') {
        panel.style.transform = 'translateX(100%)';
      }
      panel.classList.remove('active-panel');
    });
  },
  
  updatePanelToggles(activePanelId, isActive) {
    // Update toggle buttons to reflect active state
    const comicsToggle = document.getElementById('toggleComicsList');
    const episodesToggle = document.getElementById('toggleEpisodesList');
    
    if (activePanelId === 'comics' && isActive) {
      comicsToggle.classList.add('active');
      episodesToggle.classList.remove('active');
    } else if (activePanelId === 'episodes' && isActive) {
      episodesToggle.classList.add('active');
      comicsToggle.classList.remove('active');
    } else {
      comicsToggle.classList.remove('active');
      episodesToggle.classList.remove('active');
    }
  },
  
  setupMediaControls() {
    const video = document.createElement('video');
    video.setAttribute('playsinline', '');
    video.setAttribute('muted', '');
    video.setAttribute('loop', '');
    video.src = './demo.mp4';
    video.style.position = 'absolute';
    video.style.width = '1px';
    video.style.height = '1px';
    video.style.opacity = '0';
    document.body.appendChild(video);
    
    return {
      play: () => video.play().catch(e => console.error('Video play error:', e)),
      stop: () => video.pause()
    };
  }
};

export default ui;
