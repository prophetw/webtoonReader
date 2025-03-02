/**
 * Enhanced pinyin utility for handling Chinese characters
 * Handles simplified Chinese, traditional Chinese, numbers, and special characters
 */

// Common first letters map (expanded to include more characters)
const commonFirstLetters = {
  // Simplified Chinese first letters
  '阿': 'A', '八': 'B', '蔡': 'C', '曹': 'C', '岑': 'C', '常': 'C', '车': 'C', '陈': 'C', '程': 'C', '池': 'C', '崔': 'C', 
  '戴': 'D', '邓': 'D', '丁': 'D', '董': 'D', '窦': 'D', '杜': 'D', '段': 'D',  
  '范': 'F', '方': 'F', '房': 'F', '费': 'F', '冯': 'F', '符': 'F', '傅': 'F',
  '甘': 'G', '高': 'G', '戈': 'G', '葛': 'G', '龚': 'G', '宫': 'G', '顾': 'G', '广': 'G', '桂': 'G', '郭': 'G',
  '韩': 'H', '杭': 'H', '郝': 'H', '何': 'H', '洪': 'H', '侯': 'H', '胡': 'H', '华': 'H', '黄': 'H', '霍': 'H',
  '姬': 'J', '嵇': 'J', '纪': 'J', '季': 'J', '贾': 'J', '简': 'J', '江': 'J', '蒋': 'J', '焦': 'J', '金': 'J',
  '康': 'K', '柯': 'K', '孔': 'K', '寇': 'K',
  '赖': 'L', '兰': 'L', '蓝': 'L', '李': 'L', '梁': 'L', '廖': 'L', '林': 'L', '刘': 'L', '柳': 'L', '龙': 'L', '卢': 'L', '吕': 'L', '罗': 'L',
  '马': 'M', '麦': 'M', '毛': 'M', '梅': 'M', '孟': 'M', '莫': 'M',
  '倪': 'N', '牛': 'N',
  '欧': 'O',
  '潘': 'P', '彭': 'P', '蒲': 'P',
  '戚': 'Q', '钱': 'Q', '强': 'Q', '秦': 'Q', '邱': 'Q', '裘': 'Q', '曲': 'Q',
  '任': 'R', '荣': 'R',
  '沙': 'S', '邵': 'S', '沈': 'S', '盛': 'S', '施': 'S', '石': 'S', '宋': 'S', '苏': 'S', '孙': 'S',
  '谭': 'T', '汤': 'T', '唐': 'T', '陶': 'T', '田': 'T', '童': 'T',
  '汪': 'W', '王': 'W', '魏': 'W', '卫': 'W', '温': 'W', '文': 'W', '翁': 'W', '巫': 'W', '吴': 'W', '武': 'W',
  '夏': 'X', '项': 'X', '萧': 'X', '谢': 'X', '辛': 'X', '邢': 'X', '徐': 'X', '许': 'X', '薛': 'X',
  '严': 'Y', '颜': 'Y', '杨': 'Y', '姚': 'Y', '叶': 'Y', '伊': 'Y', '易': 'Y', '殷': 'Y', '尹': 'Y', '俞': 'Y', '于': 'Y', '余': 'Y', '袁': 'Y', '岳': 'Y',
  '曾': 'Z', '詹': 'Z', '张': 'Z', '章': 'Z', '赵': 'Z', '郑': 'Z', '钟': 'Z', '周': 'Z', '朱': 'Z', '祝': 'Z', '庄': 'Z', '卓': 'Z',
  
  // Traditional Chinese characters (common surnames and words)
  '陳': 'C', '鄭': 'Z', '黃': 'H', '林': 'L', '張': 'Z', '李': 'L', '王': 'W', '吳': 'W',
  '劉': 'L', '蔡': 'C', '楊': 'Y', '許': 'X', '鄧': 'D', '郭': 'G', '周': 'Z', '葉': 'Y',
  '蘇': 'S', '莊': 'Z', '呂': 'L', '趙': 'Z', '顏': 'Y', '柯': 'K', '翁': 'W', '魏': 'W',
  
  // Numbers (treat them separately so they sort correctly)
  '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
  '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
  '零': '0', '一': '1', '二': '2', '三': '3', '四': '4',
  '五': '5', '六': '6', '七': '7', '八': '8', '九': '9', '十': '10'
};

// Traditional to simplified Chinese conversion for common characters
const traditionalToSimplified = {
  '漢': '汉', '國': '国', '說': '说', '車': '车', '門': '门', '東': '东', '馬': '马',
  '長': '长', '時': '时', '書': '书', '見': '见', '風': '风', '無': '无', '開': '开',
  '電': '电', '發': '发', '問': '问', '學': '学', '這': '这', '還': '还', '對': '对',
  '麗': '丽', '華': '华', '實': '实', '點': '点', '經': '经', '樣': '样', '處': '处',
  '體': '体', '師': '师', '義': '义', '數': '数', '來': '来', '關': '关', '幾': '几',
  '後': '后', '語': '语', '當': '当', '頭': '头', '歲': '岁', '報': '报', '動': '动',
  '務': '务', '員': '员', '難': '难', '產': '产', '單': '单', '讓': '让', '致': '致',
  '兒': '儿', '鳥': '鸟', '專': '专', '區': '区', '決': '决', '萬': '万', '勝': '胜',
  '總': '总', '麼': '么', '醫': '医', '衛': '卫', '氣': '气', '業': '业', '聲': '声'
};

const pinyin = {
  /**
   * Convert a traditional Chinese character to simplified if possible
   */
  toSimplified(char) {
    return traditionalToSimplified[char] || char;
  },

  /**
   * Get the first letter of a string, handling various character types
   * @param {string} str - The string to process
   * @returns {string} The first letter (capitalized) or category
   */
  getFirstLetter(str) {
    if (!str || typeof str !== 'string' || str.length === 0) return '#';
    
    const firstChar = str.charAt(0);
    
    // Handle numbers at the beginning - keep them in the original numeric order
    if (/[0-9]/.test(firstChar)) {
      return firstChar;
    }
    
    // If it's already a latin letter, return it capitalized
    if (/[A-Za-z]/.test(firstChar)) {
      return firstChar.toUpperCase();
    }
    
    // Try direct lookup in common first letters map
    if (commonFirstLetters[firstChar]) {
      return commonFirstLetters[firstChar];
    }
    
    // For traditional Chinese, try to convert to simplified first
    const simplifiedChar = this.toSimplified(firstChar);
    if (simplifiedChar !== firstChar && commonFirstLetters[simplifiedChar]) {
      return commonFirstLetters[simplifiedChar];
    }
    
    // Check if it's a Chinese character (both simplified and traditional)
    if (/[\u4e00-\u9fff\u3400-\u4dbf]/.test(firstChar)) {
      // For Chinese characters without mapping, group under C for Chinese
      return 'C';
    }
    
    // For any other character (special chars, emoji, etc.)
    return '#';
  },
  
  /**
   * Sort strings considering character types for better organization
   * @param {string} a - First string
   * @param {string} b - Second string
   * @returns {number} Sort comparison result
   */
  compare(a, b) {
    // Get first letters (or sorting categories)
    const aFirst = this.getFirstLetter(a);
    const bFirst = this.getFirstLetter(b);
    
    // Different first letter/category - sort by that
    if (aFirst !== bFirst) {
      // Special sorting for numbers to ensure correct order (not alphabetical)
      if (/[0-9]/.test(aFirst) && /[0-9]/.test(bFirst)) {
        return parseInt(aFirst) - parseInt(bFirst);
      }
      
      // Special handling to ensure # comes last
      if (aFirst === '#') return 1;
      if (bFirst === '#') return -1;
      
      // Numbers come before letters
      if (/[0-9]/.test(aFirst) && /[A-Z]/.test(bFirst)) return -1;
      if (/[A-Z]/.test(aFirst) && /[0-9]/.test(bFirst)) return 1;
      
      // Otherwise use standard lexicographical comparison
      return aFirst.localeCompare(bFirst);
    }
    
    // Same first letter - sort by full string
    try {
      return a.localeCompare(b, 'zh-CN');
    } catch (e) {
      // Fallback if locale not supported
      return a.localeCompare(b);
    }
  }
};

export default pinyin;
