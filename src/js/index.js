/**
 * Main entry point for the Webtoon Reader application
 */

import NightMode from './nightMode.js';

// DOM Content Loaded - Initialize all modules
document.addEventListener('DOMContentLoaded', () => {
  // Initialize night mode
  const nightMode = new NightMode();
  
  // Navigation button event listeners
  const settingBtn = document.getElementById('setting');
  const settingPanel = document.getElementById('settingPanel');
  
  settingBtn.addEventListener('click', () => {
    settingPanel.style.transform = settingPanel.style.transform === 'translateX(0px)' 
      ? 'translateX(100%)' 
      : 'translateX(0px)';
  });
  
  // Back to top/bottom buttons
  document.getElementById('back-to-top').addEventListener('click', () => {
    document.querySelector('.content-area').scrollTo({ top: 0, behavior: 'smooth' });
  });
  
  document.getElementById('back-to-bottom').addEventListener('click', () => {
    const contentArea = document.querySelector('.content-area');
    contentArea.scrollTo({ top: contentArea.scrollHeight, behavior: 'smooth' });
  });
  
  // Mobile touch feedback
  document.body.addEventListener('touchstart', (e) => {
    if (e.target.classList.contains('floating-button') || 
        e.target.tagName === 'BUTTON') {
      e.target.classList.add('active');
    }
  });
  
  document.body.addEventListener('touchend', (e) => {
    const buttons = document.querySelectorAll('.active');
    buttons.forEach(button => button.classList.remove('active'));
  });
});
