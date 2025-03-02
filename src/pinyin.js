/**
 * Enhanced pinyin utility for handling various character types in manga titles
 * Handles Chinese, English, numbers, and special characters
 */

// Common first letters map (expanded for manga titles)
const commonFirstLetters = {
  // Simplified Chinese characters by pinyin first letter
  '啊': 'A', '爱': 'A', '安': 'A', '奥': 'A', '阿': 'A',
  '巴': 'B', '白': 'B', '百': 'B', '宝': 'B', '保': 'B', '暴': 'B', '北': 'B', '贝': 'B', '本': 'B', '比': 'B', '毕': 'B',
  '不': 'B', '部': 'B', '步': 'B',
  '超': 'C', '超人': 'C', '成': 'C', '诚': 'C', '城': 'C', '吃': 'C', '初': 'C', '创': 'C', '传': 'C',
  '大': 'D', '代': 'D', '刀': 'D', '的': 'D', '帝': 'D', '第': 'D', '地': 'D', '东': 'D', '冬': 'D', '都': 'D', '斗': 'D',
  '队': 'D', '对': 'D', '多': 'D',
  '恶': 'E', '二': 'E', '儿': 'E',
  '发': 'F', '法': 'F', '反': 'F', '饭': 'F', '方': 'F', '房': 'F', '非': 'F', '飞': 'F', '斐': 'F', '分': 'F', '风': 'F',
  '封': 'F', '疯': 'F', '凤': 'F', '佛': 'F', '夫': 'F', '父': 'F', '付': 'F', '妇': 'F',
  '改': 'G', '概': 'G', '干': 'G', '刚': 'G', '高': 'G', '搞': 'G', '哥': 'G', '个': 'G', '跟': 'G', '工': 'G', '公': 'G',
  '功': 'G', '古': 'G', '怪': 'G', '关': 'G', '鬼': 'G', '国': 'G',
  '哈': 'H', '海': 'H', '害': 'H', '含': 'H', '韩': 'H', '和': 'H', '黑': 'H', '红': 'H', '后': 'H', '虎': 'H', '护': 'H',
  '话': 'H', '幻': 'H', '换': 'H', '皇': 'H', '黄': 'H', '回': 'H', '魂': 'H',
  
  // Japanese common words in manga titles (romanized)
  '鬼': 'O', // Oni
  '忍': 'N', // Ninja/Shinobi
  '剣': 'K', // Ken (sword)
  '魔': 'M', // Ma (magic/demon)
  '竜': 'R', // Ryu (dragon)
  '龍': 'R', // Ryu (dragon traditional)
  '神': 'S', // Kami/Shin
  '影': 'K', // Kage (shadow)
  '少女': 'S', // Shoujo
  '王': 'O', // Ou (king)
  '学園': 'G', // Gakuen
  '学院': 'G', // Gakuin
  '死': 'S', // Shi (death)
  '命': 'I', // Inochi (life)
  
  // Numbers (both Arabic and Chinese)
  '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
  '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
  '零': '0', '一': '1', '二': '2', '三': '3', '四': '4',
  '五': '5', '六': '6', '七': '7', '八': '8', '九': '9', 
  '十': '1', // Group "十" (10) with '1' for simplicity
  '百': '1', // Group "百" (100) with '1'
  '千': '1', // Group "千" (1000) with '1'
  '万': '1', // Group "万" (10000) with '1'
  '亿': '1'  // Group "亿" (100M) with '1'
};

// Traditional to simplified conversion for common manga-related characters
const traditionalToSimplified = {
  '漫畫': '漫画', '動漫': '动漫', '冒險': '冒险', '戰鬥': '战斗',
  '魔法': '魔法', '戀愛': '恋爱', '格鬥': '格斗', '神鬼': '神鬼',
  '科幻': '科幻', '奇幻': '奇幻', '熱血': '热血', '推理': '推理',
  '懸疑': '悬疑', '恐怖': '恐怖', '日常': '日常', '搞笑': '搞笑',
  '後宮': '后宫', '校園': '校园', '少年': '少年', '少女': '少女',
  '青年': '青年', '武俠': '武侠', '機戰': '机战', '競技': '竞技',
  '運動': '运动', '歷史': '历史', '社會': '社会', '職場': '职场',
  '勵志': '励志', '美食': '美食', '治癒': '治愈', '萌系': '萌系',
  '四格': '四格', '短篇': '短篇', '長篇': '长篇', '單行本': '单行本',
  '漢化': '汉化', '彩色': '彩色', '連載': '连载', '完結': '完结',
  '東方': '东方', '西方': '西方', '南方': '南方', '北方': '北方',
  '魂': '魂', '傳': '传', '鬼': '鬼', '風': '风', '無': '无', '開': '开',
  '電': '电', '發': '发', '問': '问', '學': '学', '這': '这', '還': '还'
};

// Sorting categories with their display names
const categorySortOrder = {
  // Display name for categories
  '#': '特殊符号',
  '0': '数字0',
  '1': '数字1',
  '2': '数字2',
  '3': '数字3',
  '4': '数字4',
  '5': '数字5',
  '6': '数字6',
  '7': '数字7',
  '8': '数字8',
  '9': '数字9',
  'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D', 'E': 'E', 'F': 'F', 'G': 'G',
  'H': 'H', 'I': 'I', 'J': 'J', 'K': 'K', 'L': 'L', 'M': 'M', 'N': 'N',
  'O': 'O', 'P': 'P', 'Q': 'Q', 'R': 'R', 'S': 'S', 'T': 'T', 'U': 'U',
  'V': 'V', 'W': 'W', 'X': 'X', 'Y': 'Y', 'Z': 'Z'
};

// Order of categories for UI display
const categoryDisplayOrder = [
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  '#'
];

// Character categorization helper
function getCategoryFromChar(char) {
  if (!char) return '#';
  
  // Numbers get their own category
  if (/[0-9]/.test(char)) return char; 
  
  // Latin letters are uppercase for category
  if (/[a-zA-Z]/.test(char)) return char.toUpperCase();
  
  // Try direct lookup in mapping
  if (commonFirstLetters[char]) return commonFirstLetters[char];
  
  // Check if it's a Chinese/Japanese/Korean character
  if (/[\u4e00-\u9fff\u3400-\u4dbf\uac00-\ud7af]/.test(char)) {
    return 'C'; // Default category for CJK without specific mapping
  }
  
  // Any other character
  return '#';
}

const pinyin = {
  /**
   * Convert a traditional Chinese character to simplified if possible
   * @param {string} char - Character to convert
   * @returns {string} Simplified version or original
   */
  toSimplified(char) {
    return traditionalToSimplified[char] || char;
  },
  
  /**
   * Clean a title for better categorization
   * @param {string} title - Title to clean
   * @returns {string} Cleaned title
   */
  cleanTitle(title) {
    if (!title) return '';
    
    // Remove common leading symbols that shouldn't affect sorting
    return title.replace(/^[\s《【「『（([{~～_\-]+/, '');
  },

  /**
   * Get the first letter/category for a manga title
   * @param {string} title - The title to categorize
   * @returns {string} The category letter (A-Z, 0-9, or #)
   */
  getFirstLetter(title) {
    if (!title || typeof title !== 'string' || title.length === 0) return '#';
    
    // Clean the title first
    const cleanedTitle = this.cleanTitle(title);
    if (!cleanedTitle) return '#';
    
    // Get first character for categorization
    const firstChar = cleanedTitle.charAt(0);
    
    // Try to categorize the character
    return getCategoryFromChar(firstChar);
  },
  
  /**
   * Get display name for a category
   * @param {string} category - Single-character category code
   * @returns {string} Human-readable category name
   */
  getCategoryName(category) {
    return categorySortOrder[category] || category;
  },
  
  /**
   * Get sorted list of category codes in display order
   * @returns {string[]} Array of category codes
   */
  getSortedCategories() {
    return [...categoryDisplayOrder];
  },
  
  /**
   * Compare two manga titles for sorting
   * @param {string} a - First title
   * @param {string} b - Second title
   * @returns {number} Sort comparison result
   */
  compare(a, b) {
    // Clean titles first
    const cleanA = this.cleanTitle(a);
    const cleanB = this.cleanTitle(b);
    
    // Get categories for comparison
    const catA = this.getFirstLetter(cleanA);
    const catB = this.getFirstLetter(cleanB);
    
    // If categories differ, sort by category
    if (catA !== catB) {
      // Get index in display order
      const indexA = categoryDisplayOrder.indexOf(catA);
      const indexB = categoryDisplayOrder.indexOf(catB);
      
      // Sort by display order
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      
      // Handle cases where category might not be in display order
      if (catA === '#') return 1; // Special chars last
      if (catB === '#') return -1;
      
      return catA.localeCompare(catB);
    }
    
    // Same category - try natural sorting for titles with numbers
    if (/\d/.test(cleanA) && /\d/.test(cleanB)) {
      return this.naturalCompare(cleanA, cleanB);
    }
    
    // Default to locale-aware comparison
    try {
      return cleanA.localeCompare(cleanB, 'zh-CN');
    } catch (e) {
      // Fallback if locale not supported
      return cleanA.localeCompare(cleanB);
    }
  },
  
  /**
   * Natural sort comparison (1, 2, 10 instead of 1, 10, 2)
   * @param {string} a - First string
   * @param {string} b - Second string
   * @returns {number} Sort comparison result
   */
  naturalCompare(a, b) {
    // Split strings into text and numeric parts
    const splitA = a.match(/(\d+|\D+)/g) || [];
    const splitB = b.match(/(\d+|\D+)/g) || [];
    
    // Compare each part
    const minLength = Math.min(splitA.length, splitB.length);
    
    for (let i = 0; i < minLength; i++) {
      let partA = splitA[i];
      let partB = splitB[i];
      
      // Check if both parts are numbers
      const numA = /^\d+$/.test(partA) ? parseInt(partA, 10) : NaN;
      const numB = /^\d+$/.test(partB) ? parseInt(partB, 10) : NaN;
      
      if (!isNaN(numA) && !isNaN(numB)) {
        // Compare as numbers
        if (numA !== numB) {
          return numA - numB;
        }
      } else {
        // Compare as strings
        const comparison = partA.localeCompare(partB, 'zh-CN');
        if (comparison !== 0) {
          return comparison;
        }
      }
    }
    
    // If all compared parts are equal, compare by length
    return splitA.length - splitB.length;
  }
};

export default pinyin;
