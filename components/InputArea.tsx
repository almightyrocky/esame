import React, { useState, useRef } from 'react';

interface Props {
  onSendMessage: (text: string, files: File[]) => void;
  isLoading: boolean;
}

const InputArea: React.FC<Props> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && files.length === 0) || isLoading) return;
    onSendMessage(text, files);
    setText('');
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-4 bg-white border-t border-slate-200">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-4xl mx-auto">
        
        {/* File Preview */}
        {files.length > 0 && (
          <div className="flex gap-2 overflow-x-auto py-2">
            {files.map((file, idx) => (
              <div key={idx} className="relative bg-slate-100 p-2 rounded-md flex items-center gap-2 border border-slate-300">
                 <span className="text-xs truncate max-w-[100px] text-slate-600">{file.name}</span>
                 <button 
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="text-slate-400 hover:text-red-500"
                 >
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 items-end">
            {/* File Upload Button */}
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                title="Allega foto o video"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                multiple 
                accept="image/*,video/*"
            />

            {/* Text Input */}
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Descrivi il problema, carica una foto o un video..."
                className="flex-1 resize-none bg-slate-50 border border-slate-300 text-slate-800 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[50px] max-h-[120px]"
                rows={1}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                    }
                }}
            />

            {/* Send Button */}
            <button
                type="submit"
                disabled={isLoading || (!text.trim() && files.length === 0)}
                className={`
                    p-3 rounded-full flex items-center justify-center transition-all
                    ${isLoading || (!text.trim() && files.length === 0)
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                    }
                `}
            >
                {isLoading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <svg className="w-6 h-6 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                )}
            </button>
        </div>
      </form>
    </div>
  );
};

export default InputArea;