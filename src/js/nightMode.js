/**
 * Night Mode Module - Handles brightness control for reading comfort
 */

class NightMode {
  constructor() {
    this.nightModeToggle = document.getElementById('nightModeToggle');
    this.brightnessSlider = document.getElementById('brightnessSlider');
    this.brightnessValue = document.getElementById('brightnessValue');
    
    // Default values
    this.isNightModeActive = false;
    this.brightness = 80;
    
    // Load saved settings
    this.loadSettings();
    
    // Initialize UI
    this.updateUI();
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  loadSettings() {
    try {
      const savedNightMode = localStorage.getItem('nightMode');
      const savedBrightness = localStorage.getItem('brightness');
      
      if (savedNightMode !== null) {
        this.isNightModeActive = savedNightMode === 'true';
      }
      
      if (savedBrightness !== null) {
        this.brightness = parseInt(savedBrightness, 10);
      }
    } catch (e) {
      console.warn('Failed to load night mode settings from localStorage:', e);
    }
  }
  
  saveSettings() {
    try {
      localStorage.setItem('nightMode', this.isNightModeActive);
      localStorage.setItem('brightness', this.brightness);
    } catch (e) {
      console.warn('Failed to save night mode settings to localStorage:', e);
    }
  }
  
  updateUI() {
    // Update toggle button
    this.nightModeToggle.checked = this.isNightModeActive;
    
    // Update slider
    this.brightnessSlider.value = this.brightness;
    this.brightnessValue.textContent = `亮度: ${this.brightness}%`;
    
    // Apply night mode if active
    this.applyNightMode();
  }
  
  applyNightMode() {
    const html = document.documentElement;
    
    if (this.isNightModeActive) {
      // Set custom CSS variable for brightness
      html.style.setProperty('--brightness', this.brightness / 100);
      html.classList.add('night-mode-active');
    } else {
      html.classList.remove('night-mode-active');
    }
  }
  
  setupEventListeners() {
    // Night mode toggle
    this.nightModeToggle.addEventListener('change', () => {
      this.isNightModeActive = this.nightModeToggle.checked;
      this.applyNightMode();
      this.saveSettings();
    });
    
    // Brightness slider
    this.brightnessSlider.addEventListener('input', () => {
      this.brightness = this.brightnessSlider.value;
      this.brightnessValue.textContent = `亮度: ${this.brightness}%`;
      
      if (this.isNightModeActive) {
        document.documentElement.style.setProperty('--brightness', this.brightness / 100);
      }
    });
    
    // Save brightness setting when slider interaction ends
    this.brightnessSlider.addEventListener('change', () => {
      this.saveSettings();
    });
    
    // Add touch event support for mobile
    this.setupTouchEvents();
  }
  
  setupTouchEvents() {
    let startX;
    let startBrightness;
    
    // Adjust brightness with touch swipe
    this.brightnessSlider.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startBrightness = parseInt(this.brightnessSlider.value, 10);
      e.preventDefault(); // Prevent default behavior
    }, { passive: false });
    
    this.brightnessSlider.addEventListener('touchmove', (e) => {
      if (!startX) return;
      
      const touch = e.touches[0];
      const sliderWidth = this.brightnessSlider.offsetWidth;
      const deltaX = touch.clientX - startX;
      const deltaPercent = Math.round((deltaX / sliderWidth) * 90); // 90% range for sensitivity
      
      let newBrightness = Math.min(Math.max(startBrightness + deltaPercent, 10), 100);
      
      this.brightness = newBrightness;
      this.brightnessSlider.value = newBrightness;
      this.brightnessValue.textContent = `亮度: ${newBrightness}%`;
      
      if (this.isNightModeActive) {
        document.documentElement.style.setProperty('--brightness', newBrightness / 100);
      }
      
      e.preventDefault(); // Prevent scrolling while adjusting
    }, { passive: false });
    
    this.brightnessSlider.addEventListener('touchend', () => {
      startX = null;
      this.saveSettings();
    });
  }
}

export default NightMode;
