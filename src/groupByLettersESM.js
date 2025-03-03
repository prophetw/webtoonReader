import { pinyin, Pinyin } from 'pinyin';


const letters = [
	// Numbers first
	'0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
	// Then alphabetical
	'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
	'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
	// Special chars last
	'#'
];

// Helper function to remove tone marks from pinyin letters
function normalizePinyin(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function groupByLetters(words) {
  // 初始化分组
  const groups = {};
  letters.forEach(letter => { groups[letter] = []; });
  
  words.forEach(word => {
    if (!word || !word.length) return;
    
    word = word.trim();
    
    // 获取首字符并转换为大写
    let ch = word.charAt(0);
    let initial = ch.toUpperCase();
    
    // 若首字符为中文，则转换为拼音首字母
    if (/[\u4e00-\u9fff]/.test(ch)) {
      let pinyinOptions = {
        style: Pinyin.STYLE_NORMAL,
        heteronym: false
      };
      const py = pinyin(ch, pinyinOptions);
      if (py && py[0] && py[0][0]) {
        // Normalize to remove tone marks
        initial = normalizePinyin(py[0][0].charAt(0).toUpperCase());
        // console.log(`Character ${ch}: original pinyin: ${py[0][0]}, normalized initial: ${initial}`);
      }
    }
    // console.log(' --- initial --- ', initial);
    
    // 若初始字母不在预设范围内，则归入 '#' 分组
    if (!groups.hasOwnProperty(initial)) {
      initial = '#';
    }
    groups[initial].push(word);
  });
  
  return groups;
}

const testData = [
  "阿姨",
  "偶像",
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

// const res = groupByLetters(testData);
// console.log(res);

export default groupByLetters;