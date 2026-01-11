
import React, { useMemo, useState } from 'react';
import { Word, LearningRecord, UserPreferences } from '../types';

interface LearningRecordsProps {
  words: Word[];
  records: LearningRecord[];
  filename?: string;
  onBack: () => void;
  sortMode: UserPreferences['recordSortMode'];
  onSortChange: (mode: UserPreferences['recordSortMode']) => void;
}

const MAX_SHOW_COUNT = 10; // 展示次数上限，用于进度条计算 (默认10次)

const LearningRecords: React.FC<LearningRecordsProps> = ({ 
  words, 
  records, 
  filename, 
  onBack,
  sortMode = 'showCount', // 默认按展示次数排序
  onSortChange
}) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const ttsSupported = 'speechSynthesis' in window;

  const getShowCount = (wordId: string) => {
    const record = records.find(r => r.wordId === wordId);
    return record?.showCount || 0;
  };

  const sortedWords = useMemo(() => {
    const list = [...words];
    if (sortMode === 'alphabetical') {
      return list.sort((a, b) => a.kana.localeCompare(b.kana, 'ja'));
    } else if (sortMode === 'showCount') {
      return list.sort((a, b) => getShowCount(b.id) - getShowCount(a.id));
    }
    return list;
  }, [words, sortMode, records]);

  const handlePlaySpeech = (id: string, text: string) => {
    if (!ttsSupported) return;

    if (playingId === id) {
      window.speechSynthesis.cancel();
      setPlayingId(null);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = 1.0;
      utterance.onstart = () => setPlayingId(id);
      utterance.onend = () => setPlayingId(null);
      utterance.onerror = () => setPlayingId(null);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      <div className="max-w-4xl w-full bg-white rounded-[40px] border-[3px] border-black shadow-xl overflow-hidden flex flex-col h-[85vh]">
        {/* Header */}
        <div className="p-8 border-b-4 border-black bg-orange-50 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-black text-gray-900">学习管理</h2>
            <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              {filename || '未命名词表'}
            </p>
          </div>
          <button 
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 bg-white text-gray-800 rounded-2xl border-2 border-black font-bold hover:bg-gray-100 transition-all active:scale-95"
          >
            返回卡片
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-8 py-4 bg-gray-50 border-b border-gray-200 flex justify-end items-center gap-4 shrink-0">
          <span className="text-xs font-bold text-gray-400 uppercase">排序方式:</span>
          <div className="flex bg-gray-200 p-1 rounded-xl">
            <button 
              onClick={() => onSortChange('original')}
              className={`px-4 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all ${sortMode === 'original' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              原始顺序
            </button>
            <button 
              onClick={() => onSortChange('alphabetical')}
              className={`px-4 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all ${sortMode === 'alphabetical' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              假名顺序
            </button>
            <button 
              onClick={() => onSortChange('showCount')}
              className={`px-4 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all ${sortMode === 'showCount' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              展示次数 (高→低)
            </button>
          </div>
        </div>

        {/* List Content Wrapper */}
        <div className="flex-1 overflow-hidden bg-white px-2">
          <div className="h-full overflow-y-auto reveal-scrollbar mt-2 p-4 pr-6">
            <div className="space-y-3">
              {sortedWords.map((word) => {
                const count = getShowCount(word.id);
                const percentage = Math.min((count / MAX_SHOW_COUNT) * 100, 100);
                const isPlaying = playingId === word.id;
                
                return (
                  <div 
                    key={word.id} 
                    className="relative flex items-center justify-between p-5 rounded-2xl border border-gray-100 bg-white group transition-all overflow-hidden"
                  >
                    {/* 背景进度条填充层 */}
                    <div 
                      className="absolute left-0 top-0 bottom-0 bg-[#FFE0B2] transition-all duration-700 ease-out z-0" 
                      style={{ width: `${percentage}%` }}
                    ></div>

                    {/* 文字内容层 */}
                    <div className="relative z-10 flex flex-col flex-1">
                      <span className="text-xl font-black text-gray-900 leading-tight drop-shadow-sm">{word.kanji}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-orange-700 font-bold text-sm">{word.kana}</span>
                        {ttsSupported && (
                          <button 
                            onClick={() => handlePlaySpeech(word.id, word.kana)}
                            className={`shrink-0 transition-colors ${isPlaying ? 'text-orange-600' : 'text-[#CCCCCC] hover:text-[#FF9800]'}`}
                            title={isPlaying ? "停止播放" : "播放语音"}
                          >
                            {isPlaying ? (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                            ) : (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="relative z-10 flex items-center gap-6 shrink-0">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">展示次数</span>
                        <span className="text-2xl font-black text-gray-900 leading-none">
                          {count}<small className="text-xs ml-0.5 font-bold">次</small>
                        </span>
                      </div>
                      
                      <div className={`w-2 h-2 rounded-full ${percentage >= 100 ? 'bg-orange-600 shadow-lg shadow-orange-300' : 'bg-orange-300'} transition-colors`}></div>
                    </div>
                  </div>
                );
              })}

              {sortedWords.length === 0 && (
                <div className="py-20 text-center">
                  <p className="text-gray-400 font-medium">还没有上传任何单词</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer info */}
        <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 text-center shrink-0">
          <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">总计 {sortedWords.length} 个单词</span>
        </div>
      </div>
    </div>
  );
};

export default LearningRecords;
