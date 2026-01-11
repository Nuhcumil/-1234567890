
import { Word, LearningRecord, UserPreferences } from '../types';
import { STORAGE_KEYS } from '../constants';

/**
 * 数据交互层 (Service Layer)
 * 作用：将 UI 与 具体的存储逻辑解耦，未来如果要换成 API 请求，只需修改此处
 */
export const dataService = {
  /**
   * 获取所有单词数据
   */
  async getWords(): Promise<Word[]> {
    const data = localStorage.getItem(STORAGE_KEYS.WORDS);
    return data ? JSON.parse(data) : [];
  },

  /**
   * 保存单词数据
   */
  async saveWords(words: Word[]): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.WORDS, JSON.stringify(words));
  },

  /**
   * 获取学习进度
   */
  async getLearningRecords(): Promise<LearningRecord[]> {
    const data = localStorage.getItem(STORAGE_KEYS.LEARNING);
    return data ? JSON.parse(data) : [];
  },

  /**
   * 保存学习进度
   */
  async saveLearningRecords(records: LearningRecord[]): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.LEARNING, JSON.stringify(records));
  },

  /**
   * 获取用户偏好设置
   */
  async getPreferences(): Promise<UserPreferences | null> {
    const data = localStorage.getItem(STORAGE_KEYS.PREFS);
    return data ? JSON.parse(data) : null;
  },

  /**
   * 保存偏好设置
   */
  async savePreferences(prefs: UserPreferences): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.PREFS, JSON.stringify(prefs));
  },

  /**
   * 重置学习数据
   */
  async resetLearningData(): Promise<void> {
    localStorage.removeItem(STORAGE_KEYS.LEARNING);
  }
};
