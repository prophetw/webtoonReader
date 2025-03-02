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
      } else if (panelId === 'settingPanel') {
        panel.style.transform = 'translateX(0px)';
      }
    }
  },
  
  hideAllPanels() {
    document.getElementById('comics').style.transform = 'translateX(-100%)';
    document.getElementById('episodes').style.transform = 'translateX(-100%)';
    document.getElementById('settingPanel').style.transform = 'translateX(100%)';
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
