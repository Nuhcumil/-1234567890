
import React from 'react';
import { Word } from '../types';

interface WordCardProps {
  word: Word;
  visibleFields: string[];
  isFloating: boolean;
  isFavorite: boolean;
  isPlaying?: boolean; // 新增：当前是否正在朗读
  onPlaySpeech?: (id: string, text: string) => void; // 新增：朗读触发回调
  onMaster: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  isLast?: boolean;
}

const WordRow: React.FC<WordCardProps> = ({ 
  word, 
  visibleFields, 
  isFloating, 
  isFavorite,
  isPlaying,
  onPlaySpeech,
  onMaster, 
  onToggleFavorite,
  isLast 
}) => {
  const ttsSupported = 'speechSynthesis' in window;

  return (
    <div className={`relative w-full ${!isLast ? 'border-b border-dashed border-gray-300' : ''} ${isFloating ? 'py-3 px-2' : 'py-6 px-4'}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0 flex flex-col">
          
          {/* 第一行：汉字 + 假名 */}
          <div className={`flex items-baseline gap-x-4 ${isFloating ? 'mb-4' : 'mb-6'}`}>
            {visibleFields.includes('kanji') && (
              <div className={`font-bold text-gray-900 leading-none truncate ${isFloating ? 'text-lg' : 'text-3xl'}`}>
                {word.kanji}
              </div>
            )}
            
            {visibleFields.includes('kana') && (
              <div className="flex items-center gap-2 overflow-hidden">
                <div className={`text-orange-600 font-medium leading-none truncate ${isFloating ? 'text-sm' : 'text-xl'}`}>
                  {word.kana}
                </div>
                
                {/* 语音朗读按钮 */}
                {ttsSupported && (
                  <button 
                    onClick={() => onPlaySpeech?.(word.id, word.kana)}
                    className={`shrink-0 transition-colors p-0.5 rounded-full hover:bg-orange-50 group/play ${isPlaying ? 'text-orange-500' : 'text-[#CCCCCC] hover:text-[#FF9800]'}`}
                    title={isPlaying ? "停止播放" : "播放语音"}
                  >
                    {isPlaying ? (
                      <svg className={`${isFloating ? 'w-3.5 h-3.5' : 'w-5 h-5'}`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                      </svg>
                    ) : (
                      <svg className={`${isFloating ? 'w-3.5 h-3.5' : 'w-5 h-5'}`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                      </svg>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 第二行：词性 + 中文翻译 */}
          <div className="flex items-center gap-x-2">
            {visibleFields.includes('type') && word.type && word.type !== '无' && (
              <div className="shrink-0">
                <span className="text-[10px] bg-orange-50 text-orange-400 px-1.5 py-0.5 rounded-sm font-bold uppercase whitespace-nowrap border border-orange-100">
                  {word.type}
                </span>
              </div>
            )}

            {visibleFields.includes('meaning') && word.meaning && (
              <div className={`text-gray-700 font-medium truncate ${isFloating ? 'text-xs' : 'text-lg'}`}>
                {word.meaning}
              </div>
            )}
          </div>
        </div>

        {/* 操作区：收藏与掌握按钮 */}
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {/* 收藏按钮 (星星) */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(word.id);
            }}
            className={`
              p-1.5 rounded-full transition-all border border-transparent
              ${isFavorite ? 'text-yellow-500 bg-yellow-50' : 'text-gray-300 hover:text-yellow-400 hover:bg-gray-50'}
            `}
            title="收藏为重点词汇"
          >
            <svg className={`${isFloating ? 'w-4 h-4' : 'w-6 h-6'}`} fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.921-.755 1.688-1.54 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.784.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>

          {/* 掌握按钮 (X) */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onMaster(word.id);
            }}
            className={`
              p-1.5 rounded-full transition-all border border-gray-200
              text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200
            `}
            title="标记为已掌握（不再出现）"
          >
            <svg className={`${isFloating ? 'w-4 h-4' : 'w-6 h-6'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WordRow;
