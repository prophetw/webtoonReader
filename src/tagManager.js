/**
 * Tag Manager module for handling tag operations
 */

const tagManager = {
  allTags: new Map(), // Store all tags with frequency
  currentTags: [],    // Currently selected tags
  currentTagSource: 'comic', // Source context for current tags
  categories: {
    story: ['剧情', '故事', '设定', '世界观', '精彩', '烂尾', '高潮', '反转'],
    character: ['角色', '主角', '配角', '帅', '美', '性格', '成长'],
    art: ['画风', '精美', '作画', '原创', '分镜', '色彩'],
    genre: ['动作', '冒险', '悬疑', '后宫','纯爱', '日常', '搞笑', '校园', '恋爱', '科幻'],
    rating: ['神作', '好看', '一般', '难看'],
    custom: [] // Added custom category for user-created tags
  },
  
  // Load all tags from local storage
  loadAllTags() {
    try {
      const savedTags = localStorage.getItem('allTags');
      if (savedTags) {
        this.allTags = new Map(JSON.parse(savedTags));
      } else {
        // Initialize with common tags if no saved tags
        this.initializeDefaultTags();
      }
    } catch (error) {
      console.error('Error loading tags:', error);
      this.initializeDefaultTags();
    }
  },
  
  // Initialize with some default tags
  initializeDefaultTags() {
    // Combine all category tags
    const defaultTags = Object.values(this.categories).flat();
    
    defaultTags.forEach(tag => {
      this.allTags.set(tag, 1);
    });
    
    this.saveAllTags();
  },
  
  // Save all tags to local storage
  saveAllTags() {
    try {
      localStorage.setItem('allTags', JSON.stringify([...this.allTags]));
    } catch (error) {
      console.error('Error saving tags:', error);
    }
  },
  
  // Set current tags
  setCurrentTags(tags, source = 'comic') {
    if (Array.isArray(tags)) {
      this.currentTags = [...tags];
      
      // Add any new tags to allTags and custom category
      tags.forEach(tag => {
        if (!this.allTags.has(tag)) {
          this.allTags.set(tag, 1);
          this.addToCustomCategory(tag);
        }
      });
      
      this.saveAllTags();
    }
    
    // Store the source context for this set of tags
    this.currentTagSource = source;
  },
  
  // Get current tags
  getCurrentTags() {
    return [...this.currentTags];
  },
  
  // Get current tag source
  getCurrentTagSource() {
    return this.currentTagSource || 'comic';
  },
  
  // Add a new tag - allows custom tags
  addTag(tag) {
    if (!tag || typeof tag !== 'string') return false;
    
    tag = tag.trim();
    if (tag === '') return false;
    
    if (!this.currentTags.includes(tag)) {
      this.currentTags.push(tag);
      
      // Update frequency in allTags
      const count = this.allTags.get(tag) || 0;
      this.allTags.set(tag, count + 1);
      
      // If it's a new tag, add to custom category
      if (count === 0) {
        this.addToCustomCategory(tag);
      }
      
      this.saveAllTags();
      return true;
    }
    
    return false;
  },
  
  // Add tag to custom category if it doesn't exist in any other category
  addToCustomCategory(tag) {
    // Check if the tag exists in any predefined category
    const existsInCategory = Object.entries(this.categories)
      .some(([category, tags]) => category !== 'custom' && tags.includes(tag));
    
    // If not found in predefined categories, add to custom
    if (!existsInCategory && !this.categories.custom.includes(tag)) {
      this.categories.custom.push(tag);
    }
  },
  
  // Remove a tag
  removeTag(tag) {
    const index = this.currentTags.indexOf(tag);
    if (index !== -1) {
      this.currentTags.splice(index, 1);
      return true;
    }
    return false;
  },
  
  // Clear all current tags
  clearTags() {
    this.currentTags = [];
  },
  
  // Get tag suggestions sorted by frequency
  getSuggestions(query) {
    if (!query) return [];
    
    query = query.toLowerCase();
    
    // Filter and sort tags by frequency
    const suggestions = [...this.allTags.keys()]
      .filter(tag => tag.toLowerCase().includes(query))
      .sort((a, b) => {
        // Sort by frequency, higher first
        return this.allTags.get(b) - this.allTags.get(a);
      });
    
    return suggestions;
  },
  
  // Determine tag category - includes custom category
  getTagCategory(tag) {
    for (const [category, tags] of Object.entries(this.categories)) {
      if (tags.includes(tag)) {
        return category;
      }
    }
    
    // If not found in any category, it's a custom tag
    return 'custom';
  },
  
  // Initialize the tag input UI
  initializeTagInput(inputId, chipsId, suggestionsId, saveButtonId, clearButtonId) {
    const input = document.getElementById(inputId);
    const chipsContainer = document.getElementById(chipsId);
    const suggestionsContainer = document.getElementById(suggestionsId);
    const saveButton = document.getElementById(saveButtonId);
    const clearButton = document.getElementById(clearButtonId);
    
    if (!input || !chipsContainer || !suggestionsContainer) {
      console.error("Missing tag UI elements");
      return;
    }
    
    // Load all tags
    this.loadAllTags();
    
    // Render initial tags
    this.renderTagChips(chipsContainer);
    
    // Input event listeners
    input.addEventListener('input', () => {
      const query = input.value.trim();
      if (query) {
        this.showSuggestions(query, suggestionsContainer, input);
      } else {
        suggestionsContainer.classList.remove('active');
      }
    });
    
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const tag = input.value.trim();
        if (tag && this.addTag(tag)) {
          this.renderTagChips(chipsContainer);
          input.value = '';
          suggestionsContainer.classList.remove('active');
        }
      } else if (e.key === 'Escape') {
        suggestionsContainer.classList.remove('active');
      }
    });
    
    // Handle clicking outside to close suggestions
    document.addEventListener('click', (e) => {
      if (!suggestionsContainer.contains(e.target) && e.target !== input) {
        suggestionsContainer.classList.remove('active');
      }
    });
    
    // Save button
    if (saveButton) {
      saveButton.addEventListener('click', () => {
        // Determine if this is for comic or episode based on the input ID
        const source = inputId.includes('episode') ? 'episode' : 'comic';
        
        // Dispatch event with current tags and source context
        const event = new CustomEvent('tagsUpdated', {
          detail: { 
            tags: this.getCurrentTags(),
            source: source
          }
        });
        document.dispatchEvent(event);
      });
    }
    
    // Clear button
    if (clearButton) {
      clearButton.addEventListener('click', () => {
        this.clearTags();
        this.renderTagChips(chipsContainer);
      });
    }
    
    // Update placeholder to clarify custom tags are supported
    if (input) {
      input.placeholder = "输入标签按回车添加，支持自定义";
    }
  },
  
  // Render tag chips based on current tags
  renderTagChips(container) {
    if (!container) return;
    
    container.innerHTML = '';
    
    this.currentTags.forEach(tag => {
      const chip = document.createElement('span');
      chip.className = 'tag-chip';
      
      // Add category-based styling
      const category = this.getTagCategory(tag);
      chip.classList.add(category);
      
      // Tag content
      const tagText = document.createElement('span');
      tagText.textContent = tag;
      chip.appendChild(tagText);
      
      // Remove button
      const removeBtn = document.createElement('span');
      removeBtn.className = 'remove';
      removeBtn.innerHTML = '×';
      removeBtn.addEventListener('click', () => {
        this.removeTag(tag);
        this.renderTagChips(container);
      });
      
      chip.appendChild(removeBtn);
      container.appendChild(chip);
    });
  },
  
  // Show suggestions based on query
  showSuggestions(query, container, inputElement) {
    if (!container || !inputElement) return;
    
    const suggestions = this.getSuggestions(query);
    
    container.innerHTML = '';
    
    // 确定当前是哪个输入框，episode还是comic
    const isEpisode = inputElement.id.includes('episode');
    const chipsContainerId = isEpisode ? 'episodeTagChips' : 'tagChips';
    
    if (suggestions.length === 0) {
      // Show hint for creating a new tag
      const newTagHint = document.createElement('div');
      newTagHint.className = 'tag-suggestion';
      newTagHint.textContent = `创建新标签: "${query}"`;
      
      newTagHint.addEventListener('click', () => {
        if (this.addTag(query)) {
          this.renderTagChips(document.getElementById(chipsContainerId));
          inputElement.value = '';
          container.classList.remove('active');
        }
      });
      
      container.appendChild(newTagHint);
    } else {
      suggestions.forEach(tag => {
        const item = document.createElement('div');
        item.className = 'tag-suggestion';
        item.textContent = tag;
        
        item.addEventListener('click', () => {
          if (this.addTag(tag)) {
            this.renderTagChips(document.getElementById(chipsContainerId));
            inputElement.value = '';
            container.classList.remove('active');
          }
        });
        
        container.appendChild(item);
      });
    }
    
    container.classList.add('active');
  }
};

export default tagManager;
