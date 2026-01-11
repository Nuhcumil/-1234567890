
/**
 * 单词核心数据接口
 */
export interface Word {
  id: string;          // 唯一标识符
  kanji: string;       // 汉字
  kana: string;        // 假名（读音）
  type: string;        // 词性
  meaning: string;     // 中文翻译
}

/**
 * 艾宾浩斯学习记录接口
 */
export interface LearningRecord {
  wordId: string;
  nextReviewTime: number; // 下次复习的时间戳
  intervalLevel: number;  // 当前处于遗忘曲线的第几个阶段
  isMastered: boolean;    // 是否已标记为熟练
  showCount: number;      // 展示次数
  isFavorite?: boolean;   // 是否收藏为重点词汇
}

/**
 * 用户偏好设置接口
 */
export interface UserPreferences {
  displayCount: number;   // 每次显示的单词数量 (1-5)
  visibleFields: string[]; // 勾选显示的字段
  floatingPos: { x: number; y: number }; // 悬浮窗位置
  floatingOpacity: number; // 悬浮窗透明度
  isFloating: boolean;     // 当前是否处于悬浮模式
  lastFilename?: string;   // 最后一次上传的文件名
  recordSortMode?: 'original' | 'alphabetical' | 'showCount'; // 学习记录排序模式
}

/**
 * 字段匹配映射
 */
export interface ColumnMapping {
  kanji: string;
  kana: string;
  type: string;
  meaning: string;
}
