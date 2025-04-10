import config from './config.js';
import api from './api.js';
import ui from './ui.js';
import scroll from './scroll.js';
import imageLoader from './imageLoader.js';
import utils from './utils.js';
import groupByLetters from './groupByLettersESM.js';
import tagManager from './tagManager.js';  // Add the tagManager import

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
  maxTapDuration: 300,
  sectionPositions: new Map()
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
  
  // Group comics by first letter using groupByLetters
  const comicsByCategory = groupByLetters(comics);
  
  // Get categories in display order (letters array from groupByLettersESM)
  const letters = [
    // Numbers first
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    // Then alphabetical
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    // Special chars last
    '#'
  ];
  
  // Filter categories to only those that have comics
  const categories = letters.filter(
    category => comicsByCategory[category] && comicsByCategory[category].length > 0
  );
  
  // Create index buttons for categories that have comics
  categories.forEach(category => {
    const letterButton = document.createElement('span');
    letterButton.className = 'index-letter';
    letterButton.textContent = category;
    letterButton.setAttribute('data-letter', category);
    
    // Add appropriate title/tooltip based on category
    if (category === '#') {
      letterButton.title = "特殊字符";
    } else if (/^\d$/.test(category)) {
      letterButton.title = "数字";
    } else {
      letterButton.title = category;
    }
    
    indexContainer.appendChild(letterButton);
  });
  
  // Add click/touch events for index buttons
  indexContainer.addEventListener(action, (e) => {
    const target = e.target;
    if (target.classList.contains('index-letter')) {
      const letter = target.getAttribute('data-letter');
      const section = document.getElementById(`section-${letter}`);
      if (section) {
        // Replace scrollIntoView with precise scrolling
        scrollToSection(comicsContainer, section);
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
      
      // Get category name and count
      let categoryName = category;
      if (category === '#') {
        categoryName = "特殊字符";
      } else if (/^\d$/.test(category)) {
        categoryName = "数字";
      }
      
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
              const starDisplay = formatStarRating(score);
              summary.innerHTML = `${comic} <span class="tags">${tags.join(',')}</span> <span class="score">评分：${score} <span class="stars">${starDisplay}</span></span>`;
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
  
  // Calculate and store initial section positions after rendering
  calculateSectionPositions(comicsContainer);
  
  ui.hideAddressBar();
}

// Add this new function to calculate and store section positions
function calculateSectionPositions(container) {
  // Clear existing positions
  state.sectionPositions.clear();
  
  // Get all section headers
  const sections = container.querySelectorAll('.section-header');
  
  // Get sticky elements heights
  const header = document.querySelector('header');
  const headerHeight = header ? header.offsetHeight : 0;
  
  const alphabetIndex = container.querySelector('.alphabet-index');
  const indexHeight = alphabetIndex ? alphabetIndex.offsetHeight : 0;
  
  // Calculate total offset for sticky elements
  const totalOffset = headerHeight + indexHeight;
  
  // Store the position for each section
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const targetPosition = Math.max(0, sectionTop - totalOffset);
    state.sectionPositions.set(section.id, targetPosition);
  });
  
  // console.log('Section positions calculated:', 
  //   Array.from(state.sectionPositions.entries()).map(([id, pos]) => `${id}: ${pos}`).join(', ')
  // );
}

// Replace the scrollToSection function with this version that uses cached positions
function scrollToSection(container, section) {
  // Get section ID
  const sectionId = section.id;
  
  // If we don't have the position cached, recalculate all positions
  if (!state.sectionPositions.has(sectionId)) {
    calculateSectionPositions(container);
  }
  
  // Get the cached position
  let targetPosition = state.sectionPositions.get(sectionId);
  
  console.log('Scrolling to section using cached position:', {
    section: sectionId,
    targetPosition
  });
  
  // Safety check - if the position seems wrong, recalculate
  if (targetPosition > container.scrollHeight - container.clientHeight) {
    console.log('Position seems incorrect, recalculating...');
    calculateSectionPositions(container);
    targetPosition = state.sectionPositions.get(sectionId);
  }
  
  // Do a direct scroll without animation first to ensure reliability
  container.scrollTop = targetPosition;
  
  // Then apply smooth scrolling for visual polish
  requestAnimationFrame(() => {
    container.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
  });
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
      episodeDiv.setAttribute('data-index', index);
      episodeDiv.setAttribute('data-episode', episode);
      
      // Basic episode display
      let episodeHTML = episode;
      
      // Check if we have metadata for this episode
      if (state.comicMetaInfo && 
          state.comicMetaInfo[comicName] && 
          state.comicMetaInfo[comicName].episodes && 
          state.comicMetaInfo[comicName].episodes[episode]) {
        
        const episodeMeta = state.comicMetaInfo[comicName].episodes[episode];
        
        // Add score if available
        if (episodeMeta.score) {
          const starDisplay = formatStarRating(episodeMeta.score);
          episodeHTML += ` <span class="score">评分：${episodeMeta.score} <span class="stars">${starDisplay}</span></span>`;
        }
        
        // Add tags if available
        if (episodeMeta.tags && episodeMeta.tags.length > 0) {
          episodeHTML += ` <span class="tags">${episodeMeta.tags.join(',')}</span>`;
        }
      }
      
      episodeDiv.innerHTML = episodeHTML;
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
    document.getElementById('curEpisodeName').textContent = episode;
    
    // Load episode-specific metadata if available
    if (state.comicMetaInfo && state.comicMetaInfo[comicName] && 
        state.comicMetaInfo[comicName].episodes && 
        state.comicMetaInfo[comicName].episodes[episode]) {
      
      const episodeMeta = state.comicMetaInfo[comicName].episodes[episode];
      
      // Update episode tags display
      if (episodeMeta.tags && Array.isArray(episodeMeta.tags)) {
        tagManager.setCurrentTags(episodeMeta.tags, 'episode');
        tagManager.renderTagChips(document.getElementById('episodeTagChips'));
      } else {
        tagManager.setCurrentTags([], 'episode');
        tagManager.renderTagChips(document.getElementById('episodeTagChips'));
      }
      
      // Update episode rating display
      if (typeof episodeMeta.score !== 'undefined') {
        updateStarRatingDisplay(episodeMeta.score, 'episodeRatingStars');
        document.getElementById('episodeRatingValue').textContent = episodeMeta.score;
        document.getElementById('episodeScoreInput').value = episodeMeta.score;
      } else {
        updateStarRatingDisplay(0, 'episodeRatingStars');
        document.getElementById('episodeRatingValue').textContent = '0';
        document.getElementById('episodeScoreInput').value = '0';
      }
    } else {
      // Reset episode tags and rating if no metadata exists
      tagManager.setCurrentTags([], 'episode');
      tagManager.renderTagChips(document.getElementById('episodeTagChips'));
      updateStarRatingDisplay(0, 'episodeRatingStars');
      document.getElementById('episodeRatingValue').textContent = '0';
      document.getElementById('episodeScoreInput').value = '0';
    }
    
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

// Update episode tags function
async function updateEpisodeTags(comicName, episode, tags) {
  if (!comicName || !episode) return;
  
  try {
    // Call the server API to update episode tags
    const success = await api.updateEpisodeTags(comicName, episode, tags);
    
    // Update local state if available
    if (success && state.comicMetaInfo && state.comicMetaInfo[comicName]) {
      // Initialize episodes object if not exists
      if (!state.comicMetaInfo[comicName].episodes) {
        state.comicMetaInfo[comicName].episodes = {};
      }
      
      // Initialize episode entry if not exists
      if (!state.comicMetaInfo[comicName].episodes[episode]) {
        state.comicMetaInfo[comicName].episodes[episode] = { tags: [], score: 0 };
      }
      
      // Update tags in local state
      state.comicMetaInfo[comicName].episodes[episode].tags = tags;
    }
    
    return success;
  } catch (error) {
    console.error(`Failed to update tags for ${comicName} - ${episode}:`, error);
    throw error;
  }
}

// Initialize tag managers for both comic and episode levels
function updateComicMeta() {
  const scoreInputEle = document.getElementById('scoreInput');
  const episodeScoreInputEle = document.getElementById('episodeScoreInput');
  
  // Initialize the comic tag manager
  tagManager.initializeTagInput(
    'tagInput',
    'tagChips',
    'tagSuggestions',
    'saveTag',
    'clearTags'
  );
  
  // Initialize the episode tag manager
  tagManager.initializeTagInput(
    'episodeTagInput',
    'episodeTagChips',
    'episodeTagSuggestions',
    'saveEpisodeTag',
    'clearEpisodeTags'
  );
  
  // Listen for comic tagsUpdated event from tagManager
  document.addEventListener('tagsUpdated', (e) => {
    const tags = e.detail.tags;
    const source = e.detail.source || 'comic'; // Default to comic level if not specified
    
    if (source === 'comic') {
      // Update comic tags
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
    } else if (source === 'episode' && state.curComicName && state.curEpisodesAry) {
      // Update episode tags
      const episodeName = state.curEpisodesAry[state.curComicEpisode];
      
      if (episodeName) {
        updateEpisodeTags(state.curComicName, episodeName, tags)
          .then(() => {
            ui.warning('集数标签更新成功', 2000, 'top');
          })
          .catch(err => {
            console.error('Failed to update episode tags:', err);
            ui.warning('集数标签更新失败', 2000, 'top');
          });
      }
    }
  });
  
  // Initialize comic level star rating system
  initStarRating('ratingStars', 'ratingValue', 'scoreInput', (rating) => {
    saveRating(rating);
  });
  
  // Initialize episode level star rating system
  initStarRating('episodeRatingStars', 'episodeRatingValue', 'episodeScoreInput', (rating) => {
    saveEpisodeRating(rating);
  });
  
  const updateSummaryElement = () => {
    const summaryEle = state.summaryEleMap.get(state.curComicName);
    if (summaryEle && state.comicMetaInfo[state.curComicName]) {
      const { tags = [], score = 0 } = state.comicMetaInfo[state.curComicName];
      const starDisplay = formatStarRating(score);
      summaryEle.innerHTML = `${state.curComicName} <span class="tags">${tags.join(',')}</span> <span class="score">评分：${score} <span class="stars">${starDisplay}</span></span>`;
    }
  };
}

// Helper function to format star rating for display
function formatStarRating(score) {
  // Convert score (0-5) to star characters
  const normalizedScore = Math.min(5, Math.max(0, score));
  const fullStars = Math.floor(normalizedScore);
  const halfStar = normalizedScore % 1 >= 0.5 ? 1 : 0;
  const emptyStars = 5 - fullStars - halfStar;
  
  return '★'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(emptyStars);
}

// Initialize star rating system
function initStarRating(starContainerId, ratingValueId, scoreInputId, saveCallback) {
  const starContainer = document.getElementById(starContainerId);
  const ratingValue = document.getElementById(ratingValueId);
  const scoreInput = document.getElementById(scoreInputId);
  
  if (!starContainer) return;
  
  // Add click handlers for stars
  const stars = starContainer.querySelectorAll('.star');
  stars.forEach(star => {
    star.addEventListener(action, function() {
      const rating = parseInt(this.getAttribute('data-rating'));
      
      // Update hidden input value
      scoreInput.value = rating;
      
      // Update visual display
      ratingValue.textContent = rating;
      
      // Update active state of stars - fix the logic here
      stars.forEach(s => {
        const starRating = parseInt(s.getAttribute('data-rating'));
        if (starRating <= rating) {
          s.classList.add('active');
        } else {
          s.classList.remove('active');
        }
      });
      
      // Save the rating
      saveCallback(rating);
    });
  });
  
  // Add hover effects
  if (!isMobile) {
    stars.forEach(star => {
      // On mouse enter, highlight this star and all stars before it
      star.addEventListener('mouseenter', function() {
        const hoverRating = parseInt(this.getAttribute('data-rating'));
        
        stars.forEach(s => {
          const starRating = parseInt(s.getAttribute('data-rating'));
          if (starRating <= hoverRating) {
            s.style.color = '#ffcc00'; // Highlight color
          } else {
            s.style.color = ''; // Reset to default CSS color
          }
        });
      });
      
      // On mouse leave, restore the active state
      star.addEventListener('mouseleave', function() {
        stars.forEach(s => {
          s.style.color = ''; // Reset to CSS-controlled color
        });
      });
    });
    
    // When mouse leaves the entire container, ensure we reset to saved state
    starContainer.addEventListener('mouseleave', function() {
      const currentRating = parseInt(scoreInput.value || '0');
      updateStarRatingDisplay(currentRating, starContainerId);
    });
  }
}

// Helper function to update star rating display
function updateStarRatingDisplay(score, containerId) {
  const stars = document.querySelectorAll(`#${containerId || 'ratingStars'} .star`);
  const valueId = containerId === 'episodeRatingStars' ? 'episodeRatingValue' : 'ratingValue';
  const inputId = containerId === 'episodeRatingStars' ? 'episodeScoreInput' : 'scoreInput';
  
  const ratingValue = document.getElementById(valueId);
  const scoreInput = document.getElementById(inputId);
  
  // Update hidden input value
  if (scoreInput) scoreInput.value = score;
  
  // Update rating value display
  if (ratingValue) ratingValue.textContent = score;
  
  // Update stars display
  if (stars && stars.length) {
    stars.forEach(star => {
      const rating = parseInt(star.getAttribute('data-rating'));
      if (rating <= score) {
        star.classList.add('active');
      } else {
        star.classList.remove('active');
      }
    });
  }
}

function saveRating(rating) {
  if (state.comicMetaInfo && state.curComicName) {
    if (!state.comicMetaInfo[state.curComicName]) {
      state.comicMetaInfo[state.curComicName] = { tags: [], score: 0 };
    }
    state.comicMetaInfo[state.curComicName].score = rating;
    
    api.updateComicScore(state.curComicName, rating)
      .then(() => {
        ui.warning('评分更新成功', 2000, 'top');
        
        // Update the comic list display
        const summaryEle = state.summaryEleMap.get(state.curComicName);
        if (summaryEle) {
          const { tags = [] } = state.comicMetaInfo[state.curComicName];
          const starDisplay = formatStarRating(rating);
          summaryEle.innerHTML = `${state.curComicName} <span class="tags">${tags.join(',')}</span> <span class="score">评分：${rating} <span class="stars">${starDisplay}</span></span>`;
        }
      })
      .catch(err => {
        console.error('Failed to update score:', err);
        ui.warning('评分更新失败', 2000, 'top');
      });
  }
}

function saveEpisodeRating(rating) {
  if (state.comicMetaInfo && state.curComicName && state.curEpisodesAry) {
    const episodeName = state.curEpisodesAry[state.curComicEpisode];
    
    if (!episodeName) {
      ui.warning('没有选择集数', 2000, 'top');
      return;
    }
    
    // Ensure the episode metadata structure exists
    if (!state.comicMetaInfo[state.curComicName]) {
      state.comicMetaInfo[state.curComicName] = { tags: [], score: 0, episodes: {} };
    }
    
    if (!state.comicMetaInfo[state.curComicName].episodes) {
      state.comicMetaInfo[state.curComicName].episodes = {};
    }
    
    if (!state.comicMetaInfo[state.curComicName].episodes[episodeName]) {
      state.comicMetaInfo[state.curComicName].episodes[episodeName] = { tags: [], score: 0 };
    }
    
    // Update the score in local state
    state.comicMetaInfo[state.curComicName].episodes[episodeName].score = rating;
    
    // Save to server
    api.updateEpisodeScore(state.curComicName, episodeName, rating)
      .then(() => {
        ui.warning('集数评分更新成功', 2000, 'top');
      })
      .catch(err => {
        console.error('Failed to update episode score:', err);
        ui.warning('集数评分更新失败', 2000, 'top');
      });
  }
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
        
        // Set tags in the tagManager
        tagManager.setCurrentTags(tags);
        tagManager.renderTagChips(document.getElementById('tagChips'));
        
        // Update star rating display
        updateStarRatingDisplay(score, 'ratingStars');
      } else {
        // Reset star rating display if no meta info
        updateStarRatingDisplay(0, 'ratingStars');
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
          // Replace scrollIntoView with the new scrolling function
          scrollToSection(document.getElementById('comics'), section);
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
  // document.getElementById('dim').addEventListener(action, () => {
  //   ui.setBrightness(50);
  // });
  
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
  
  // Add resize handler to recalculate positions
  window.addEventListener('resize', utils.debounce(() => {
    const comicsContainer = document.getElementById('comics');
    if (comicsContainer) {
      calculateSectionPositions(comicsContainer);
    }
  }, 250));
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
    // Initialize brightness control right away with a more reliable approach
    setTimeout(() => {
      ui.loadBrightness();
      ui.initBrightnessControl();
      console.log('Brightness control initialized');
    }, 0);
    
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
