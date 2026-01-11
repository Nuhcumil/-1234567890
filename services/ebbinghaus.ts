
import { Word, LearningRecord } from '../types';
import { REVIEW_INTERVALS } from '../constants';

/**
 * 艾宾浩斯核心逻辑模块
 */
export const ebbinghausLogic = {
  /**
   * 筛选当前需要展示的单词组合
   */
  getNextBatch(
    allWords: Word[],
    learningRecords: LearningRecord[],
    count: number
  ): Word[] {
    const now = Date.now();
    
    const reviewIds = learningRecords
      .filter(r => r.nextReviewTime <= now && !r.isMastered)
      .sort((a, b) => a.nextReviewTime - b.nextReviewTime)
      .map(r => r.wordId);

    const learnedIds = new Set(learningRecords.map(r => r.wordId));
    const newWords = allWords.filter(w => !learnedIds.has(w.id));

    const result: Word[] = [];

    for (const id of reviewIds) {
      const word = allWords.find(w => w.id === id);
      if (word) result.push(word);
      if (result.length >= count) break;
    }

    if (result.length < count) {
      const needed = count - result.length;
      const shuffledNew = [...newWords].sort(() => Math.random() - 0.5);
      result.push(...shuffledNew.slice(0, needed));
    }

    if (result.length < count) {
      const alreadyInResult = new Set(result.map(r => r.id));
      const remaining = allWords.filter(w => !alreadyInResult.has(w.id));
      const shuffledRemaining = [...remaining].sort(() => Math.random() - 0.5);
      result.push(...shuffledRemaining.slice(0, count - result.length));
    }

    return result;
  },

  /**
   * 更新单词的学习进度或状态
   */
  updateRecord(
    wordId: string, 
    records: LearningRecord[],
    action: 'view' | 'master' | 'toggle_favorite'
  ): LearningRecord[] {
    const now = Date.now();
    const existingIndex = records.findIndex(r => r.wordId === wordId);
    let newRecords = [...records];

    if (existingIndex === -1) {
      const nextInterval = REVIEW_INTERVALS[0];
      newRecords.push({
        wordId,
        nextReviewTime: now + nextInterval * 60 * 1000,
        intervalLevel: 0,
        isMastered: action === 'master',
        showCount: 1,
        isFavorite: action === 'toggle_favorite'
      });
    } else {
      const record = { ...newRecords[existingIndex] };
      
      if (action === 'view') {
        record.showCount += 1;
        const nextLevel = Math.min(record.intervalLevel + 1, REVIEW_INTERVALS.length - 1);
        record.intervalLevel = nextLevel;
        record.nextReviewTime = now + REVIEW_INTERVALS[nextLevel] * 60 * 1000;
      } else if (action === 'master') {
        record.isMastered = true;
      } else if (action === 'toggle_favorite') {
        record.isFavorite = !record.isFavorite;
      }
      
      newRecords[existingIndex] = record;
    }

    return newRecords;
  }
};
