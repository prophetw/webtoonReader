const pinyinLoader = require('pinyin');
const pinyin = typeof pinyinLoader === 'function' ? pinyinLoader : pinyinLoader.default;
const { letters } = require('./sortAry');

function groupByLetters(words) {
  // 初始化分组
  const groups = {};
  letters.forEach(letter => { groups[letter] = []; });
  
  words.forEach(word => {
    if (!word || !word.length) return;
    
    // 获取首字符并转换为大写
    let ch = word.charAt(0);
    let initial = ch.toUpperCase();
    
    // 若首字符为中文，则转换为拼音首字母
    if (/[\u4e00-\u9fa5]/.test(ch)) {
      const py = pinyin(ch, { style: pinyin.STYLE_NORMAL, heteronym: false });
      if (py && py[0] && py[0][0]) {
        initial = py[0][0].charAt(0).toUpperCase();
      }
    }
    
    // 若初始字母不在预设范围内，则归入 '#' 分组
    if (!groups.hasOwnProperty(initial)) {
      initial = '#';
    }
    groups[initial].push(word);
  });
  
  return groups;
}

const testData = [
    "科技",
    "音乐",
    "书籍",
    "書籍",
    "手机",
    "音樂",
    "音樂",
    "計算機",
    "苹果",
    "网络",
    "科技",
    "电影",
    "书籍",
    "遊戲",
    "音乐",
    "手機",
    "电视",
    "音樂",
    "蘋果",
    "手機",
    "蘋果",
    "汽车",
    "歷史",
    "音乐",
    "音樂",
    "电影",
    "計算機",
    "书籍",
    "教育",
    "风景",
    "旅遊",
    "网络",
    "手机",
    "蘋果",
    "書籍",
    "遊戲",
    "网络",
    "旅遊",
    "计算机",
    "书籍",
    "音樂",
    "文化",
    "科技",
    "科技",
    "历史",
    "電視",
    "網絡",
    "人工智慧",
    "教育",
    "书籍"
]

const res = groupByLetters(testData);
console.log(res);

module.exports = { groupByLetters };
