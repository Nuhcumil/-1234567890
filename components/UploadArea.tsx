
import React, { useState, useRef } from 'react';
import { Word, ColumnMapping } from '../types';

interface UploadAreaProps {
  onSuccess: (words: Word[], resetLearning: boolean, filename: string) => void;
}

const UploadArea: React.FC<UploadAreaProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [tempHeaders, setTempHeaders] = useState<string[]>([]);
  const [tempDataRows, setTempDataRows] = useState<any[][]>([]);
  const [currentFilename, setCurrentFilename] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCurrentFilename(file.name);
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        // @ts-ignore
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // 获取原始二维数组
        // @ts-ignore
        const rawData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (!rawData || rawData.length === 0) {
          alert("Excel 为空，请检查文件");
          setLoading(false);
          return;
        }

        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(rawData.length, 10); i++) {
          const row = rawData[i];
          const filledCells = row.filter(cell => cell !== null && cell !== undefined && String(cell).trim() !== '');
          if (filledCells.length >= 2) {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1) headerRowIndex = 0;

        const headers = rawData[headerRowIndex].map(h => String(h || '').trim());
        const validHeaders = headers.filter(h => h !== '');

        if (validHeaders.length === 0) {
           alert("未识别到有效的表头，请检查 Excel 格式");
           setLoading(false);
           return;
        }

        setTempHeaders(headers); 
        setTempDataRows(rawData.slice(headerRowIndex + 1)); 

        const guessedMapping: ColumnMapping = {
          kanji: headers.find(h => h.includes('汉字') || h.includes('词汇') || h.toLowerCase() === 'kanji') || '',
          kana: headers.find(h => h.includes('假名') || h.includes('读音') || h.toLowerCase() === 'kana') || '',
          type: headers.find(h => h.includes('词性') || h.toLowerCase() === 'type') || '',
          meaning: headers.find(h => h.includes('翻译') || h.includes('词义') || h.includes('解释') || h.includes('词意') || h.toLowerCase() === 'meaning') || ''
        };

        setMapping(guessedMapping);
      } catch (err) {
        console.error(err);
        alert("读取文件失败，请确保格式正确（.xlsx 或 .xls）");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const finalizeUpload = (resetLearning: boolean) => {
    if (!mapping?.kanji || !mapping?.kana) {
      alert("请至少匹配 [汉字] 和 [假名] 两列");
      return;
    }

    const kanjiIdx = tempHeaders.indexOf(mapping.kanji);
    const kanaIdx = tempHeaders.indexOf(mapping.kana);
    const typeIdx = mapping.type ? tempHeaders.indexOf(mapping.type) : -1;
    const meaningIdx = mapping.meaning ? tempHeaders.indexOf(mapping.meaning) : -1;

    const words: Word[] = tempDataRows.map((row, idx) => ({
      id: `w-${idx}-${Date.now()}`,
      kanji: String(row[kanjiIdx] || '').trim(),
      kana: String(row[kanaIdx] || '').trim(),
      type: typeIdx !== -1 ? String(row[typeIdx] || '无').trim() : '无',
      meaning: meaningIdx !== -1 ? String(row[meaningIdx] || '无').trim() : '无'
    })).filter(w => w.kanji !== '');

    if (words.length === 0) {
      alert("未识别到有效的单词行");
      return;
    }

    onSuccess(words, resetLearning, currentFilename);
    setMapping(null);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center p-12 border-4 border-dashed border-gray-100 rounded-3xl bg-white transition-all hover:border-orange-200">
      <div className="bg-orange-50 p-4 rounded-full mb-6">
        <svg className="w-12 h-12 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
      </div>
      <h3 className="text-2xl font-bold text-gray-800 mb-2">上传您的日语单词表</h3>
      <p className="text-gray-400 mb-8 text-center max-w-sm">
        支持 .xlsx 或 .xls 格式。<br/>我们会智能识别列名（如“汉字”、“假名”等）。
      </p>
      
      <button 
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="px-8 py-4 bg-orange-600 text-white rounded-2xl font-bold shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95 disabled:opacity-50"
      >
        {loading ? '正在解析...' : '选择文件上传'}
      </button>

      <input ref={fileInputRef} type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileChange} />

      {mapping && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl">
            <h4 className="text-xl font-bold mb-6 text-gray-800">确认列对应关系</h4>
            <div className="space-y-4 mb-8">
              {[
                { field: 'kanji', label: '汉字写法 (必填)' },
                { field: 'kana', label: '假名/读音 (必填)' },
                { field: 'type', label: '词性' },
                { field: 'meaning', label: '中文翻译' }
              ].map((item) => (
                <div key={item.field} className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">
                    系统字段: {item.label}
                  </label>
                  <select 
                    value={(mapping as any)[item.field]} 
                    onChange={(e) => setMapping({...mapping, [item.field]: e.target.value})}
                    className="w-full p-3 rounded-xl border-2 border-gray-100 bg-gray-50 focus:border-orange-500 outline-none transition-all"
                  >
                    <option value="">-- 请选择 Excel 中的列 --</option>
                    {tempHeaders.filter(h => h && h.trim() !== '').map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <button onClick={() => finalizeUpload(false)} className="py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all">保存单词并保留已有进度</button>
              <button onClick={() => finalizeUpload(true)} className="py-3 bg-white border-2 border-gray-100 text-gray-500 rounded-xl font-bold hover:bg-gray-50 transition-all">保存单词并重置学习进度</button>
              <button onClick={() => setMapping(null)} className="py-3 text-sm text-gray-400 hover:text-gray-600 font-medium text-center">取消上传</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadArea;
