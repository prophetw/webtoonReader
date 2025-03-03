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
    if (brightnessSlider) {
      // Use both input and change events for different scenarios
      // 'input' fires continuously as the user drags the slider
      brightnessSlider.addEventListener('input', (e) => {
        this.setBrightness(e.target.value);
      });
      
      // 'change' fires when the slider is released
      brightnessSlider.addEventListener('change', (e) => {
        this.setBrightness(e.target.value);
      });
      
      // For touch devices, add touch events for better response
      brightnessSlider.addEventListener('touchmove', (e) => {
        // Prevent default to avoid page scrolling while adjusting brightness
        e.preventDefault();
        this.setBrightness(e.target.value);
      }, { passive: false });
      
      // Load initial brightness
      this.loadBrightness();
    }
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
