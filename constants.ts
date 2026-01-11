
/**
 * 艾宾浩斯复习间隔周期（单位：分钟）
 */
export const REVIEW_INTERVALS = [
  30,           // 30分钟
  12 * 60,      // 12小时
  24 * 60,      // 1天
  2 * 24 * 60,  // 2天
  4 * 24 * 60,  // 4天
  7 * 24 * 60,  // 7天
  15 * 24 * 60, // 15天
  30 * 24 * 60  // 30天
];

/**
 * 默认显示的字段
 */
export const DEFAULT_VISIBLE_FIELDS = ['kanji', 'kana', 'type', 'meaning'];

/**
 * 核心必选字段
 */
export const REQUIRED_FIELDS = ['kanji', 'kana'];

/**
 * 存储键名常量
 */
export const STORAGE_KEYS = {
  WORDS: 'jp_vocab_words',
  LEARNING: 'jp_vocab_learning',
  PREFS: 'jp_vocab_prefs'
};
