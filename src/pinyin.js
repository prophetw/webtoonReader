/**
 * Basic pinyin utility for handling Chinese characters
 * This is a simplified version - for production use, consider a complete library
 */

// Map of common Chinese characters to their pinyin first letter
const commonFirstLetters = {
  '阿': 'A', '八': 'B', '差': 'C', '大': 'D', '饿': 'E', '发': 'F', '搞': 'G', '哈': 'H',
  '机': 'J', '开': 'K', '拉': 'L', '妈': 'M', '那': 'N', '哦': 'O', '怕': 'P', '七': 'Q',
  '然': 'R', '三': 'S', '他': 'T', '哇': 'W', '下': 'X', '呀': 'Y', '咋': 'Z'
};

// Simple conversion map with some common Chinese characters
const pinyinMap = {
  '一': 'yi', '二': 'er', '三': 'san', '四': 'si', '五': 'wu', '六': 'liu', '七': 'qi', '八': 'ba', '九': 'jiu', '十': 'shi',
  '爱': 'ai', '安': 'an', '八': 'ba', '白': 'bai', '百': 'bai', '北': 'bei', '本': 'ben', '不': 'bu',
  '大': 'da', '的': 'de', '地': 'di', '东': 'dong', '都': 'dou',
  '儿': 'er',
  '方': 'fang', '分': 'fen', '风': 'feng', '佛': 'fo', '父': 'fu',
  '高': 'gao', '个': 'ge', '工': 'gong', '国': 'guo',
  '好': 'hao', '和': 'he', '红': 'hong', '后': 'hou', '话': 'hua', '会': 'hui',
  '家': 'jia', '见': 'jian', '就': 'jiu',
  '开': 'kai', '看': 'kan', '可': 'ke',
  '来': 'lai', '里': 'li', '两': 'liang',
  '妈': 'ma', '么': 'me', '没': 'mei', '面': 'mian',
  '你': 'ni', '年': 'nian',
  '朋': 'peng',
  '千': 'qian', '情': 'qing',
  '人': 'ren', '日': 'ri',
  '三': 'san', '上': 'shang', '说': 'shuo', '四': 'si', '岁': 'sui',
  '他': 'ta', '天': 'tian', '听': 'ting',
  '我': 'wo',
  '下': 'xia', '先': 'xian', '想': 'xiang', '小': 'xiao', '心': 'xin',
  '羊': 'yang', '也': 'ye', '一': 'yi', '应': 'ying', '用': 'yong', '有': 'you',
  '在': 'zai', '这': 'zhe', '中': 'zhong', '主': 'zhu'
};

const pinyin = {
  /**
   * Convert a Chinese character to its pinyin
   * @param {string} char - The character to convert
   * @returns {string} The pinyin, or the original character if not found
   */
  convert(char) {
    return pinyinMap[char] || char;
  },

  /**
   * Get the first letter of a string, handling Chinese characters
   * @param {string} str - The string to process
   * @returns {string} The first letter (capitalized)
   */
  getFirstLetter(str) {
    if (!str || str.length === 0) return '#';
    
    const firstChar = str.charAt(0);
    
    // If it's already a letter, return it capitalized
    if (/[A-Za-z]/.test(firstChar)) {
      return firstChar.toUpperCase();
    }
    
    // Check our common first letters map
    if (commonFirstLetters[firstChar]) {
      return commonFirstLetters[firstChar];
    }
    
    // Check our pinyin map
    const converted = pinyinMap[firstChar];
    if (converted) {
      return converted.charAt(0).toUpperCase();
    }
    
    // For any other character, return # (for grouping)
    return '#';
  },
  
  /**
   * Sort strings considering Chinese characters
   * @param {string} a - First string
   * @param {string} b - Second string
   * @returns {number} Sort comparison result
   */
  compare(a, b) {
    const aFirst = this.getFirstLetter(a);
    const bFirst = this.getFirstLetter(b);
    
    return aFirst.localeCompare(bFirst);
  }
};

export default pinyin;
