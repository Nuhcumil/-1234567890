
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Word, LearningRecord, UserPreferences } from './types';
import { dataService } from './services/dataService';
import { ebbinghausLogic } from './services/ebbinghaus';
import WordRow from './components/WordCard';
import Settings from './components/Settings';
import UploadArea from './components/UploadArea';
import LearningRecords from './components/LearningRecords';

const App: React.FC = () => {
  const [words, setWords] = useState<Word[]>([]);
  const [records, setRecords] = useState<LearningRecord[]>([]);
  const [currentBatch, setCurrentBatch] = useState<Word[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'records'>('cards');
  const [playingId, setPlayingId] = useState<string | null>(null); // 新增：记录当前正在朗读的单词ID
  const [prefs, setPrefs] = useState<UserPreferences>({
    displayCount: 3,
    visibleFields: ['kanji', 'kana', 'type', 'meaning'],
    floatingPos: { x: window.innerWidth - 270, y: window.innerHeight - 420 },
    floatingOpacity: 0.9,
    isFloating: false,
    recordSortMode: 'showCount' // 默认排序改为“展示次数”
  });

  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const scrollCooldownRef = useRef(false);

  useEffect(() => {
    const init = async () => {
      const savedWords = await dataService.getWords();
      const savedRecords = await dataService.getLearningRecords();
      const savedPrefs = await dataService.getPreferences();
      setWords(savedWords);
      setRecords(savedRecords);
      if (savedPrefs) {
        setPrefs(prev => ({
          ...prev,
          ...savedPrefs,
          floatingPos: savedPrefs.floatingPos || prev.floatingPos,
          recordSortMode: savedPrefs.recordSortMode || 'showCount'
        }));
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const loadNextBatch = useCallback(() => {
    if (words.length === 0) return;
    const next = ebbinghausLogic.getNextBatch(words, records, prefs.displayCount);
    setCurrentBatch(next);
    let updatedRecords = [...records];
    next.forEach(word => {
      updatedRecords = ebbinghausLogic.updateRecord(word.id, updatedRecords, 'view');
    });
    setRecords(updatedRecords);
    dataService.saveLearningRecords(updatedRecords);
  }, [words, records, prefs.displayCount]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (scrollCooldownRef.current || isMinimized || viewMode === 'records') return;
    
    if (Math.abs(e.deltaY) > 30) {
      loadNextBatch();
      scrollCooldownRef.current = true;
      setTimeout(() => {
        scrollCooldownRef.current = false;
      }, 800); 
    }
  }, [loadNextBatch, isMinimized, viewMode]);

  useEffect(() => {
    if (words.length > 0 && currentBatch.length === 0) {
      loadNextBatch();
    }
  }, [words, loadNextBatch, currentBatch.length]);

  const handleMaster = (id: string) => {
    const updatedRecords = ebbinghausLogic.updateRecord(id, records, 'master');
    setRecords(updatedRecords);
    dataService.saveLearningRecords(updatedRecords);
    setCurrentBatch(prev => prev.filter(w => w.id !== id));
  };

  const handleToggleFavorite = (id: string) => {
    const updatedRecords = ebbinghausLogic.updateRecord(id, records, 'toggle_favorite');
    setRecords(updatedRecords);
    dataService.saveLearningRecords(updatedRecords);
  };

  // 语音朗读逻辑实现
  const handlePlaySpeech = (id: string, text: string) => {
    if (!window.speechSynthesis) return;

    if (playingId === id) {
      window.speechSynthesis.cancel();
      setPlayingId(null);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = 1.0; // 语速调节入口: 0.5 - 2.0
      utterance.onstart = () => setPlayingId(id);
      utterance.onend = () => setPlayingId(null);
      utterance.onerror = () => setPlayingId(null);
      window.speechSynthesis.speak(utterance);
    }
  };

  const updatePrefs = (newPrefs: Partial<UserPreferences>) => {
    const updated = { ...prefs, ...newPrefs };
    setPrefs(updated);
    dataService.savePreferences(updated);
  };

  const [isDragging, setIsDragging] = useState(false);
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
    }
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        updatePrefs({ floatingPos: { x: e.clientX - 130, y: e.clientY - 15 } });
      }
    };
    const onMouseUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging]);

  const VocabularySheet = ({ children, isFloating }: { children: React.ReactNode, isFloating: boolean }) => (
    <div 
      onWheel={handleWheel}
      style={!isFloating ? { resize: 'horizontal', width: '450px', minWidth: '320px', maxWidth: '95vw' } : {}}
      className={`
        relative bg-white rounded-[40px] border-[3px] border-black shadow-xl overflow-hidden flex flex-col transition-shadow
        ${isFloating ? 'w-full h-full' : 'mx-auto h-fit'}
      `}
    >
      {!isMinimized && (
        <button 
          onClick={loadNextBatch}
          className={`absolute top-0 left-1/2 -translate-x-1/2 p-2 text-gray-300 hover:text-orange-500 transition-colors z-20 ${isFloating ? 'scale-75 mt-4' : 'scale-100'}`}
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7" /></svg>
        </button>
      )}
      
      <div className={`flex flex-col flex-1 overflow-hidden ${isFloating ? 'p-6 pt-12 pb-12' : 'p-8 pt-12 pb-12'}`}>
        {children}
      </div>

      {!isMinimized && (
        <button 
          onClick={loadNextBatch}
          className={`absolute bottom-0 left-1/2 -translate-x-1/2 p-2 text-gray-300 hover:text-orange-500 transition-colors z-20 ${isFloating ? 'scale-75 mb-4' : 'scale-100'}`}
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
        </button>
      )}

      {!isFloating && (
        <div className="absolute bottom-1 right-1 w-4 h-4 cursor-nwse-resize opacity-20 group-hover:opacity-100 pointer-events-none">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M22,22H20V20H22V22M22,18H20V16H22V18M18,22H16V16H18V22M18,18H16V16H18V18M14,22H12V20H14V22M22,14H20V12H22V14Z" /></svg>
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="text-center animate-pulse">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 font-medium">应用启动中...</p>
        </div>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col p-6 items-center justify-center">
        <div className="max-w-2xl w-full">
          <header className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">日语记忆助手</h1>
            <p className="text-lg text-gray-500">上传您的 Excel 单词表，开启艾宾浩斯科学记忆之旅</p>
          </header>
          <UploadArea onSuccess={(newWords, reset, filename) => {
            setWords(newWords);
            dataService.saveWords(newWords);
            if (reset) {
              setRecords([]);
              dataService.resetLearningData();
            }
            setCurrentBatch([]);
            updatePrefs({ lastFilename: filename });
          }} />
        </div>
      </div>
    );
  }

  if (viewMode === 'records') {
    return (
      <LearningRecords 
        words={words} 
        records={records} 
        filename={prefs.lastFilename} 
        onBack={() => setViewMode('cards')} 
        sortMode={prefs.recordSortMode}
        onSortChange={(mode) => updatePrefs({ recordSortMode: mode })}
      />
    );
  }

  return (
    <div className={`min-h-screen bg-gray-100 select-none ${prefs.isFloating ? 'overflow-hidden' : 'p-6'}`}>
      
      {!prefs.isFloating && (
        <nav className="max-w-md mx-auto mb-10 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
              <span className="text-white font-bold text-xl">日</span>
            </div>
            <h1 className="text-2xl font-black text-gray-800 tracking-tighter">VocabFlow</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setViewMode('records')} title="学习记录" className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </button>
            <button onClick={() => setShowSettings(true)} title="设置" className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
            <button 
              onClick={() => updatePrefs({ isFloating: true })} 
              title="开启悬浮窗" 
              className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-all active:scale-95"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h5v5h-5v-5z" />
              </svg>
            </button>
            <button onClick={() => { if(confirm("确定要移除当前单词库吗？")) setWords([]); }} title="卸载词库" className="p-3 bg-white text-gray-400 rounded-2xl border border-dashed border-gray-200 hover:text-red-500 hover:border-red-200 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg></button>
          </div>
        </nav>
      )}

      {!prefs.isFloating && (
        <VocabularySheet isFloating={false}>
          <div className="flex flex-col w-full h-full">
            {currentBatch.length > 0 ? (
              currentBatch.map((word, idx) => {
                const record = records.find(r => r.wordId === word.id);
                return (
                  <WordRow 
                    key={word.id} 
                    word={word} 
                    visibleFields={prefs.visibleFields} 
                    isFloating={false} 
                    isFavorite={record?.isFavorite || false}
                    isPlaying={playingId === word.id} // 新增：朗读状态
                    onPlaySpeech={handlePlaySpeech} // 新增：朗读回调
                    onMaster={handleMaster} 
                    onToggleFavorite={handleToggleFavorite}
                    isLast={idx === currentBatch.length - 1} 
                  />
                );
              })
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 py-10 font-medium">
                暂无单词
              </div>
            )}
          </div>
        </VocabularySheet>
      )}

      {prefs.isFloating && (
        <div 
          style={{ 
            position: 'fixed', left: prefs.floatingPos.x, top: prefs.floatingPos.y, 
            width: '260px', 
            height: isMinimized ? '32px' : 'auto', 
            minHeight: isMinimized ? '32px' : '150px', 
            zIndex: 9999,
            resize: isMinimized ? 'none' : 'both', 
            overflow: 'hidden'
          }}
          className="group"
          onMouseDown={handleMouseDown}
        >
          <div 
            style={{ 
              backgroundColor: `rgba(255, 255, 255, ${prefs.floatingOpacity})`,
              borderColor: `rgba(0, 0, 0, ${prefs.floatingOpacity})`,
              boxShadow: (prefs.floatingOpacity > 0.05 && !isMinimized) ? `0 20px 25px -5px rgba(0, 0, 0, ${prefs.floatingOpacity * 0.1}), 0 10px 10px -5px rgba(0, 0, 0, ${prefs.floatingOpacity * 0.04})` : 'none'
            }}
            className={`w-full h-full relative rounded-[30px] border-[2px] flex flex-col transition-all ${isMinimized ? 'rounded-[16px]' : ''}`}
            onWheel={handleWheel}
          >
            <div className="drag-handle h-8 shrink-0 flex items-center justify-end px-4 cursor-move group/header relative gap-1">
               <button 
                 onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} 
                 className="opacity-0 group-hover/header:opacity-100 text-orange-600 hover:text-orange-700 transition-all p-1"
                 title={isMinimized ? "展开" : "最小化"}
               >
                 {isMinimized ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                    </svg>
                 ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 12H4" />
                    </svg>
                 )}
               </button>
               <button 
                 onClick={() => updatePrefs({ isFloating: false })} 
                 className="opacity-0 group-hover/header:opacity-100 text-orange-600 hover:text-orange-700 transition-all p-1"
                 title="退出悬浮模式"
               >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
            </div>

            {!isMinimized && (
              <>
                <div className="flex-1 relative overflow-hidden flex flex-col px-4 pb-2">
                  <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col justify-center py-6">
                    {currentBatch.map((word, idx) => {
                      const record = records.find(r => r.wordId === word.id);
                      return (
                        <WordRow 
                          key={word.id} 
                          word={word} 
                          visibleFields={prefs.visibleFields} 
                          isFloating={true} 
                          isFavorite={record?.isFavorite || false}
                          isPlaying={playingId === word.id}
                          onPlaySpeech={handlePlaySpeech}
                          onMaster={handleMaster} 
                          onToggleFavorite={handleToggleFavorite}
                          isLast={idx === currentBatch.length - 1} 
                        />
                      );
                    })}
                  </div>
                  
                  <button onClick={loadNextBatch} className="absolute top-0 left-1/2 -translate-x-1/2 p-1 text-gray-200 hover:text-orange-500 transition-colors z-20"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7" /></svg></button>
                  <button onClick={loadNextBatch} className="absolute bottom-0 left-1/2 -translate-x-1/2 p-1 text-gray-200 hover:text-orange-500 transition-colors z-20"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg></button>
                </div>

                <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-2 opacity-0 hover:opacity-100 transition-opacity">
                  <span className="text-[10px] text-gray-500 font-bold whitespace-nowrap">透明度</span>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.05" 
                    value={prefs.floatingOpacity} 
                    onChange={(e) => updatePrefs({ floatingOpacity: parseFloat(e.target.value) })} 
                    className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-600" 
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showSettings && <Settings prefs={prefs} onUpdate={updatePrefs} onClose={() => setShowSettings(false)} onReset={async () => { if (confirm("确定要重置学习进度吗？")) { await dataService.resetLearningData(); setRecords([]); setShowSettings(false); setCurrentBatch([]); alert("已重置进度。"); } }} />}
    </div>
  );
};

export default App;
