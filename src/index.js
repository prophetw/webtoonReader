import config from './config.js';
import api from './api.js';
import ui from './ui.js';
import scroll from './scroll.js';
import imageLoader from './imageLoader.js';
import utils from './utils.js';
import pinyin from './pinyin.js';

// Use more reliable touch detection
const isMobile = utils.isTouchDevice();
const action = isMobile ? 'touchend' : 'click';

// State management
const state = {
  curComicName: '',
  curComicEpisode: 0,
  curEpisodesAry: [],
  comicMetaInfo: {},
  summaryEleMap: new Map(),
  mediaControls: null,
  touchStartX: 0,
  touchStartY: 0,
  touchStartTime: 0,
  touchMoved: false,
  minSwipeDistance: 30,
  maxTapDistance: 10,
  maxTapDuration: 300
};

// Initialize media controls for keeping screen active
state.mediaControls = ui.setupMediaControls();

async function loadNecessaryData() {
  ui.showLoading();
  try {
    state.comicMetaInfo = await api.fetchComicsMetaInfo();
    return await api.fetchComics();
  } finally {
    ui.hideLoading();
  }
}

async function displayComics(comics) {
  const comicsContainer = document.getElementById('comics');
  comicsContainer.innerHTML = '';
  
  // Add alphabet index at the top
  const indexContainer = document.createElement('div');
  indexContainer.className = 'alphabet-index';
  comicsContainer.appendChild(indexContainer);
  
  // Sort comics using enhanced title handling
  const sortedComics = [...comics].sort((a, b) => pinyin.compare(a, b));
  
  // Group comics by category
  const comicsByCategory = {};
  
  // Process each comic for grouping
  sortedComics.forEach(comic => {
    const category = pinyin.getFirstLetter(comic);
    
    if (!comicsByCategory[category]) {
      comicsByCategory[category] = [];
    }
    
    comicsByCategory[category].push(comic);
  });
  
  // Get categories in display order
  const categories = pinyin.getSortedCategories().filter(
    category => comicsByCategory[category] && comicsByCategory[category].length > 0
  );
  
  // Create index buttons for categories that have comics
  categories.forEach(category => {
    const letterButton = document.createElement('span');
    letterButton.className = 'index-letter';
    letterButton.textContent = category;
    letterButton.setAttribute('data-letter', category);
    letterButton.title = pinyin.getCategoryName(category); // Add tooltip
    indexContainer.appendChild(letterButton);
  });
  
  // Add click/touch events for index buttons
  indexContainer.addEventListener(action, (e) => {
    const target = e.target;
    if (target.classList.contains('index-letter')) {
      const letter = target.getAttribute('data-letter');
      const section = document.getElementById(`section-${letter}`);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });
  
  // Create comic list with category sections
  categories.forEach(category => {
    const comics = comicsByCategory[category];
    
    if (comics && comics.length > 0) {
      // Create section header with count and name
      const sectionHeader = document.createElement('div');
      sectionHeader.className = 'section-header';
      sectionHeader.id = `section-${category}`;
      
      // Get nice category name and count
      const categoryName = pinyin.getCategoryName(category);
      const count = comics.length;
      
      sectionHeader.innerHTML = `
        <span class="section-title">${category}</span>
        <span class="section-name">${categoryName}</span>
        <span class="section-count">(${count})</span>
      `;
      
      comicsContainer.appendChild(sectionHeader);
      
      // Add comics in this category
      comics.forEach(comic => {
        const details = document.createElement('details');
        const summary = document.createElement('summary');
        summary.setAttribute('data-comic', comic);
        state.summaryEleMap.set(comic, summary);
        
        if (comic) {
          const meta = state.comicMetaInfo[comic];
          if (meta) {
            const { tags = [], score = 0 } = meta;
            if ((tags && tags.length > 0) || score !== 0) {
              summary.innerHTML = `${comic} <span class="tags">${tags.join(',')}</span> <span class="score">评分：${score}</span>`;
            } else {
              summary.textContent = comic;
            }
          } else {
            summary.textContent = comic;
          }
        }
        
        details.appendChild(summary);
        comicsContainer.appendChild(details);
      });
    }
  });
  
  ui.hideAddressBar();
}

async function checkLastRead() {
  const lastReadInfo = config.getLastReadInfo();
  if (!lastReadInfo) return;
  
  const { comicName, episode } = lastReadInfo;
  
  const isConfirmed = await ui.confirm(
    '请确认',
    `上次阅读到${comicName}-${episode}, 是否需要定位到该位置?`,
    4000,
    false
  );
  
  if (isConfirmed) {
    state.curComicName = comicName;
    await loadEpisodes(comicName);
    state.curComicEpisode = state.curEpisodesAry.indexOf(episode);
    loadImages(comicName, episode);
  }
}

async function loadEpisodes(comicName) {
  ui.showLoading();
  try {
    state.curEpisodesAry = await api.fetchEpisodes(comicName);
    
    const episodesDom = document.getElementById('episodes');
    episodesDom.innerHTML = '';
    
    // Add title for episodes panel
    const episodesTitle = document.createElement('div');
    episodesTitle.className = 'episodes-title';
    episodesTitle.textContent = `${comicName} 章节`;
    episodesDom.appendChild(episodesTitle);
    
    state.curEpisodesAry.forEach((episode, index) => {
      const episodeDiv = document.createElement('div');
      episodeDiv.textContent = episode;
      episodeDiv.setAttribute('data-index', index);
      episodeDiv.setAttribute('data-episode', episode);
      episodesDom.appendChild(episodeDiv);
    });
    
    ui.togglePanel('episodes');
  } catch (error) {
    console.error('Error fetching episodes:', error);
    ui.warning('加载章节列表失败', 2000);
  } finally {
    ui.hideLoading();
  }
}

// Keep track of scroll event handlers to avoid duplicates
const scrollHandlers = new WeakMap();

async function loadImages(comicName, episode, imagesContainer = null) {
  if (!episode) {
    ui.warning('没有找到该集', 2000);
    return;
  }
  
  config.saveLastReadInfo(comicName, episode);
  ui.showLoading();
  
  try {
    const images = await api.fetchImages(comicName, episode);
    
    document.title = `${comicName} - ${episode}`;
    document.getElementById('header').innerHTML = `${comicName} - ${episode}`;
    document.getElementById('curComicEpi').textContent = episode;
    
    const container = imagesContainer || document.getElementById('content');
    
    // Debug output
    console.log(`Fetched ${images.length} images for ${comicName} - ${episode}`);
    
    // Setup error handling for the container
    imageLoader.setupImageErrorHandling(container);
    
    // Make sure container is scrolled to top
    container.scrollTop = 0;
    
    // Remove any existing scroll handler to prevent duplicates
    const oldHandler = scrollHandlers.get(container);
    if (oldHandler) {
      container.removeEventListener('scroll', oldHandler);
      console.log('Removed old scroll handler');
    }
    
    // Load images with improved loader
    await imageLoader.loadImagesSequentially(images, container);
    
    // Add a throttled scroll event listener
    const scrollHandler = utils.throttle(() => {
      // Check if we're near bottom
      const scrollPosition = container.scrollTop + container.clientHeight;
      const scrollTotal = container.scrollHeight;
      const scrollPercent = (scrollPosition / scrollTotal) * 100;
      
      if (scrollPercent > 70) {
        console.log('Scroll threshold reached, loading more images');
        imageLoader.loadAllImages(container);
      }
    }, 250);
    
    // Store the handler so we can remove it later
    scrollHandlers.set(container, scrollHandler);
    container.addEventListener('scroll', scrollHandler);
    
    // Hide episodes panel
    ui.hideAllPanels();
    
    // Start auto-scrolling if autoPlay is enabled
    if (config.autoPlay) {
      scroll.smoothAutoScroll(container, loadNextEpisode);
    }
  } catch (error) {
    console.error('Error fetching images:', error);
    ui.warning('加载图片失败: ' + error.message, 3000);
  } finally {
    ui.hideLoading();
  }
}

function updateComicMeta() {
  const tagInputEle = document.getElementById('tagInput');
  const scoreInputEle = document.getElementById('scoreInput');
  const tagInputEpiEle = document.getElementById('tagInputEpi');
  const scoreInputEpiEle = document.getElementById('scoreInputEpi');
  
  const updateTagsAndUI = () => {
    const tags = tagInputEle.value.split(',').filter(tag => tag.trim());
    
    if (state.comicMetaInfo && state.curComicName) {
      if (!state.comicMetaInfo[state.curComicName]) {
        state.comicMetaInfo[state.curComicName] = { tags: [], score: 0 };
      }
      state.comicMetaInfo[state.curComicName].tags = tags;
      
      api.updateComicTags(state.curComicName, tags)
        .then(() => {
          ui.warning('标签更新成功', 2000, 'top');
          updateSummaryElement();
        })
        .catch(err => {
          console.error('Failed to update tags:', err);
          ui.warning('标签更新失败', 2000, 'top');
        });
    }
  };
  
  const updateScoreAndUI = () => {
    const score = parseInt(scoreInputEle.value) || 0;
    
    if (state.comicMetaInfo && state.curComicName) {
      if (!state.comicMetaInfo[state.curComicName]) {
        state.comicMetaInfo[state.curComicName] = { tags: [], score: 0 };
      }
      state.comicMetaInfo[state.curComicName].score = score;
      
      api.updateComicScore(state.curComicName, score)
        .then(() => {
          ui.warning('评分更新成功', 2000, 'top');
          updateSummaryElement();
        })
        .catch(err => {
          console.error('Failed to update score:', err);
          ui.warning('评分更新失败', 2000, 'top');
        });
    }
  };
  
  const updateSummaryElement = () => {
    const summaryEle = state.summaryEleMap.get(state.curComicName);
    if (summaryEle && state.comicMetaInfo[state.curComicName]) {
      const { tags = [], score = 0 } = state.comicMetaInfo[state.curComicName];
      summaryEle.innerHTML = `${state.curComicName} <span class="tags">${tags.join(',')}</span> <span class="score">评分：${score}</span>`;
    }
  };
  
  // Episode tag and score handling could be added here
  
  document.getElementById('saveTag').addEventListener(action, updateTagsAndUI);
  document.getElementById('saveScore').addEventListener(action, updateScoreAndUI);
}

function loadNextEpisode(needConfirm = false) {
  scroll.stopSmoothScroll();
  
  const nextEpisode = async () => {
    state.curComicEpisode = parseInt(state.curComicEpisode) + 1;
    if (state.curComicEpisode >= state.curEpisodesAry.length) {
      ui.warning('已经是最后一集了', 2000);
      return;
    }
    
    const episodeName = state.curEpisodesAry[state.curComicEpisode];
    if (episodeName) {
      await loadImages(state.curComicName, episodeName);
    } else {
      ui.warning('已经是最后一集了', 2000);
    }
  };
  
  if (needConfirm) {
    ui.confirm('自动播放下一集', '3秒之后自动播放下一集', 3000)
      .then(isConfirmed => {
        if (isConfirmed) {
          nextEpisode();
        }
      });
  } else {
    nextEpisode();
  }
}

function loadPreviousEpisode() {
  scroll.stopSmoothScroll();
  
  if (state.curComicEpisode > 0) {
    state.curComicEpisode = parseInt(state.curComicEpisode) - 1;
    const episodeName = state.curEpisodesAry[state.curComicEpisode];
    loadImages(state.curComicName, episodeName);
  } else {
    ui.warning('已经是第一集了', 2000);
  }
}

function handleTouchStart(e) {
  state.touchStartX = e.touches[0].clientX;
  state.touchStartY = e.touches[0].clientY;
  state.touchStartTime = Date.now();
  state.touchMoved = false;
}

function handleTouchMove(e) {
  if (!state.touchStartX) return;
  
  const moveX = e.touches[0].clientX;
  const moveY = e.touches[0].clientY;
  const distX = Math.abs(moveX - state.touchStartX);
  const distY = Math.abs(moveY - state.touchStartY);
  
  // If moved more than the threshold, mark as moved
  if (distX > state.maxTapDistance || distY > state.maxTapDistance) {
    state.touchMoved = true;
  }
}

function handleTouchEnd(e, elementHandler) {
  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;
  const touchEndTime = Date.now();
  
  const touchDuration = touchEndTime - state.touchStartTime;
  const horizontalDistance = touchEndX - state.touchStartX;
  const verticalDistance = touchEndY - state.touchStartY;
  const absHorizontal = Math.abs(horizontalDistance);
  const absVertical = Math.abs(verticalDistance);
  
  // Only process as a tap if:
  // 1. Didn't move much during touch
  // 2. Touch was short duration
  if (!state.touchMoved && touchDuration < state.maxTapDuration) {
    console.log("Processing as tap");
    if (elementHandler) {
      elementHandler(e);
    }
    return;
  }
  
  // Only process as a swipe if:
  // 1. Moved enough distance
  // 2. Horizontal movement was greater than vertical (to avoid triggering on normal scrolling)
  if (absHorizontal > state.minSwipeDistance && absHorizontal > absVertical * 1.2) {
    console.log("Processing as swipe");
    
    // Prevent default only for horizontal swipes to avoid interfering with vertical scrolling
    e.preventDefault();
    
    // Determine direction
    if (horizontalDistance > 0) {
      // Right swipe
      loadPreviousEpisode();
    } else {
      // Left swipe
      loadNextEpisode();
    }
  }
  
  // Reset touch state
  state.touchMoved = false;
}

function initMobileInteractions() {
  if (!isMobile) return;
  
  // Content area touch handling for navigation
  const content = document.getElementById('content');
  content.addEventListener('touchstart', handleTouchStart, { passive: true });
  content.addEventListener('touchmove', handleTouchMove, { passive: true });
  content.addEventListener('touchend', (e) => handleTouchEnd(e), { passive: false });
  
  // Handle comic selection with proper tap detection
  const comics = document.getElementById('comics');
  comics.addEventListener('touchstart', handleTouchStart, { passive: true });
  comics.addEventListener('touchmove', handleTouchMove, { passive: true });
  comics.addEventListener('touchend', (e) => {
    if (state.touchMoved) return; // Skip if this was a drag/scroll operation
    
    // Find the clicked comic summary
    const summary = e.target.closest('summary');
    if (summary) {
      const comicName = summary.getAttribute('data-comic');
      if (comicName) {
        state.curComicName = comicName;
        loadEpisodes(comicName);
      }
    }
  });
  
  // Handle episode selection with proper tap detection
  const episodes = document.getElementById('episodes');
  episodes.addEventListener('touchstart', handleTouchStart, { passive: true });
  episodes.addEventListener('touchmove', handleTouchMove, { passive: true });
  episodes.addEventListener('touchend', (e) => {
    if (state.touchMoved) return; // Skip if this was a drag/scroll operation
    
    if (e.target.tagName === 'DIV' && e.target.hasAttribute('data-episode')) {
      const index = e.target.getAttribute('data-index');
      const episode = e.target.getAttribute('data-episode');
      if (index !== null && episode) {
        state.curComicEpisode = parseInt(index);
        loadImages(state.curComicName, episode);
      }
    }
  });
  
  // Better button handling for mobile
  const buttons = document.querySelectorAll('.floating-button, button');
  buttons.forEach(button => {
    button.addEventListener('touchstart', handleTouchStart, { passive: true });
    button.addEventListener('touchmove', handleTouchMove, { passive: true });
    button.addEventListener('touchend', (e) => {
      if (state.touchMoved) {
        e.preventDefault(); // Prevent click if it was a drag
        return;
      }
      
      // Add visual feedback for buttons
      button.classList.add('active');
      setTimeout(() => button.classList.remove('active'), 200);
    }, { passive: false });
  });
  
  // Add touch feedback with better filtering
  document.body.addEventListener('touchstart', (e) => {
    // Only add feedback for certain elements
    if (e.target.classList.contains('floating-button') || 
        e.target.tagName === 'BUTTON' ||
        e.target.tagName === 'SUMMARY' || 
        (e.target.tagName === 'DIV' && e.target.parentElement.id === 'episodes') ||
        e.target.classList.contains('index-letter')) {
      utils.addTouchFeedback(e);
    }
  }, { passive: true });
}

function initEventListeners() {
  // Panel toggle buttons
  document.getElementById('toggleComicsList').addEventListener(action, () => {
    ui.togglePanel('comics');
  });
  
  document.getElementById('toggleEpisodesList').addEventListener(action, () => {
    ui.togglePanel('episodes');
  });
  
  document.getElementById('setting').addEventListener(action, () => {
    ui.togglePanel('settingPanel');
    
    if (state.curComicName) {
      document.getElementById('curComicName').textContent = state.curComicName;
      
      if (state.comicMetaInfo && state.comicMetaInfo[state.curComicName]) {
        const { tags = [], score = 0 } = state.comicMetaInfo[state.curComicName];
        document.getElementById('tagInput').value = tags.join(',');
        document.getElementById('scoreInput').value = score;
      }
    }
  });
  
  // For non-mobile devices, add regular click events
  if (!isMobile) {
    // Comics list click handler
    document.getElementById('comics').addEventListener('click', (e) => {
      const summary = e.target.closest('summary');
      if (summary) {
        const comicName = summary.getAttribute('data-comic');
        if (comicName) {
          state.curComicName = comicName;
          loadEpisodes(comicName);
        }
      } else if (e.target.classList.contains('index-letter')) {
        const letter = e.target.getAttribute('data-letter');
        const section = document.getElementById(`section-${letter}`);
        if (section) {
          section.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
    
    // Episodes list click handler
    document.getElementById('episodes').addEventListener('click', (e) => {
      if (e.target.tagName === 'DIV' && e.target.hasAttribute('data-episode')) {
        const index = e.target.getAttribute('data-index');
        const episode = e.target.getAttribute('data-episode');
        if (index !== null && episode) {
          state.curComicEpisode = parseInt(index);
          loadImages(state.curComicName, episode);
        }
      }
    });
  }
  
  // Navigation buttons
  document.getElementById('next').addEventListener(action, () => loadNextEpisode());
  document.getElementById('prev').addEventListener(action, () => loadPreviousEpisode());
  
  // Play/pause button
  document.getElementById('play').addEventListener(action, () => {
    const contentElement = document.getElementById('content');
    if (scroll.isScrolling) {
      scroll.stopSmoothScroll();
    } else {
      scroll.smoothAutoScroll(contentElement, loadNextEpisode);
    }
  });
  
  // Scroll buttons
  document.getElementById('back-to-top').addEventListener(action, () => {
    scroll.scrollToTop(document.getElementById('content'));
  });
  
  document.getElementById('back-to-bottom').addEventListener(action, () => {
    const contentElement = document.getElementById('content');
    scroll.scrollToBottom(contentElement);
    imageLoader.loadAllImages(contentElement);
  });
  
  // Settings checkboxes
  document.getElementById('autoNext').addEventListener('change', (e) => {
    config.toggleAutoNext(e.target.checked);
  });
  
  document.getElementById('autoPlay').addEventListener('change', (e) => {
    config.toggleAutoPlay(e.target.checked);
  });
  
  // Brightness control
  document.getElementById('dim').addEventListener(action, () => {
    ui.setBrightness(50);
  });
  
  // Speed settings
  const speedValListContainer = document.getElementById('speed-setting');
  speedValListContainer.addEventListener(action, (e) => {
    if (e.target.classList.contains('play-speed')) {
      const speed = parseInt(e.target.innerHTML);
      config.saveScrollSpeed(speed);
      
      // Update UI
      const speedElements = document.getElementsByClassName('play-speed');
      Array.from(speedElements).forEach(ele => {
        ele.classList.remove('active');
      });
      e.target.classList.add('active');
    }
  });
  
  // Initialize speed setting UI
  const speedElements = document.getElementsByClassName('play-speed');
  Array.from(speedElements).forEach(ele => {
    if (parseInt(ele.innerHTML) === config.scrollSpeed) {
      ele.classList.add('active');
    }
  });
  
  // Set initial checkbox states
  document.getElementById('autoNext').checked = config.autoNext;
  document.getElementById('autoPlay').checked = config.autoPlay;
  
  // Initialize mobile interactions
  initMobileInteractions();
}

function initSpeedSettings() {
  const speedValListContainer = document.getElementById('speed-setting');
  const speedList = [2, 3, 4, 5, 6, 7, 8, 16];
  
  speedValListContainer.innerHTML = '';
  speedList.forEach(speed => {
    const speedEle = document.createElement('span');
    speedEle.classList.add('play-speed');
    if (config.scrollSpeed === speed) {
      speedEle.classList.add('active');
    }
    speedEle.innerHTML = speed;
    speedValListContainer.appendChild(speedEle);
  });
}

async function initialize() {
  try {
    const comics = await loadNecessaryData();
    await displayComics(comics);
    await checkLastRead();
    
    updateComicMeta();
    initSpeedSettings();
    initEventListeners();
    
    state.mediaControls.play();
    
    console.log("App initialized, running on " + (isMobile ? "mobile" : "desktop"));
  } catch (error) {
    console.error('Initialization error:', error);
    ui.warning('初始化失败: ' + error.message, 3000);
  }
}

document.addEventListener('DOMContentLoaded', initialize);
