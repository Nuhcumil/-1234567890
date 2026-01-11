
import React from 'react';
import { UserPreferences } from '../types';
import { REQUIRED_FIELDS, DEFAULT_VISIBLE_FIELDS } from '../constants';

interface SettingsProps {
  prefs: UserPreferences;
  onUpdate: (updates: Partial<UserPreferences>) => void;
  onClose: () => void;
  onReset: () => void;
}

const Settings: React.FC<SettingsProps> = ({ prefs, onUpdate, onClose, onReset }) => {
  const fieldLabels: Record<string, string> = {
    kanji: '汉字写法',
    kana: '假名(读音)',
    type: '词性',
    meaning: '中文翻译'
  };

  const handleFieldToggle = (field: string) => {
    if (REQUIRED_FIELDS.includes(field)) return;
    const newFields = prefs.visibleFields.includes(field)
      ? prefs.visibleFields.filter(f => f !== field)
      : [...prefs.visibleFields, field];
    onUpdate({ visibleFields: newFields });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">卡片设置</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="p-6 space-y-8">
          <div>
            <label className="block text-sm font-bold text-gray-500 uppercase mb-3">单页单词显示数量</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => onUpdate({ displayCount: n })} className={`flex-1 py-2 rounded-xl border-2 transition-all ${prefs.displayCount === n ? 'border-orange-500 bg-orange-50 text-orange-600 font-bold' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}>{n}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-500 uppercase mb-3">展示字段控制</label>
            <div className="grid grid-cols-2 gap-3">
              {DEFAULT_VISIBLE_FIELDS.map(field => (
                <label key={field} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${prefs.visibleFields.includes(field) ? 'border-orange-100 bg-orange-50' : 'border-gray-50'} ${REQUIRED_FIELDS.includes(field) ? 'opacity-60 cursor-not-allowed' : ''}`}>
                  <input type="checkbox" checked={prefs.visibleFields.includes(field)} onChange={() => handleFieldToggle(field)} disabled={REQUIRED_FIELDS.includes(field)} className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500" />
                  <span className={`text-sm font-medium ${prefs.visibleFields.includes(field) ? 'text-orange-700' : 'text-gray-500'}`}>{fieldLabels[field]}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="pt-4 flex flex-col gap-3">
            <button onClick={onReset} className="w-full py-3 rounded-2xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors">重置学习进度数据</button>
            <p className="text-[10px] text-gray-400 text-center">重置进度仅清空记忆曲线记录，不会删除上传的单词库。</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
