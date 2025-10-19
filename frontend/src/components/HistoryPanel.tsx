import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { TranslationHistory } from '../types/index.ts';

interface HistoryPanelProps {
  className?: string;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ className = '' }) => {
  const { history, removeFromHistory, clearHistory, setTranslationResult, setInputText } = useAppStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const handleRestoreTranslation = (historyItem: TranslationHistory) => {
    setInputText(historyItem.originalText);
    setTranslationResult(historyItem.result);
  };

  const handleDeleteItem = (id: string) => {
    removeFromHistory(id);
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all history?')) {
      clearHistory();
    }
  };

  if (history.length === 0) {
    return (
      <div className={`history-panel ${className}`}>
        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 text-center border border-white/40 shadow-xl">
          <div className="text-gray-400 text-4xl mb-2">📝</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2 tracking-wide">No History Yet</h3>
          <p className="text-sm text-gray-500">
            Your translation history will appear here after you make your first translation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`history-panel ${className}`}>
      <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/40">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
           <h3 className="text-lg font-semibold text-gray-800">Translation History ({history.length})</h3>
           <div className="flex items-center space-x-2">
             <button
               onClick={() => setIsExpanded(!isExpanded)}
              className="px-2 py-1 rounded-full text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors shadow-sm"
               title={isExpanded ? 'Collapse' : 'Expand'}
               aria-expanded={isExpanded}
             >
               {isExpanded ? '▼' : '▶'}
             </button>
             <button
               onClick={handleClearAll}
              className="px-2 py-1 rounded-full text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors text-sm shadow-sm"
               title="Clear all history"
               aria-label="Clear all history"
             >
               🗑️
             </button>
           </div>
        </div>

        {/* History Items */}
        {isExpanded && (
          <div className="max-h-96 overflow-y-auto">
            {history.map((item) => (
              <div key={item.id} className="border-b border-gray-100 last:border-b-0">
                <div className="p-4 hover:bg-gray-50 transition-colors">
                   {/* Header with timestamp and actions */}
                   <div className="flex items-center justify-between mb-2">
                     <div className="flex items-center space-x-2">
                       <span className="text-xs text-gray-500">{formatTimestamp(item.timestamp)}</span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{item.userRole}</span>
                     </div>
                     <div className="flex items-center space-x-1">
                       <button
                         onClick={() => handleRestoreTranslation(item)}
                        className="px-2 py-1 rounded-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors text-sm shadow-sm"
                         title="Restore this translation"
                         aria-label="Restore this translation"
                       >
                         ↻
                       </button>
                       <button
                         onClick={() => handleDeleteItem(item.id)}
                        className="px-2 py-1 rounded-full text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors text-sm shadow-sm"
                         title="Delete this item"
                         aria-label="Delete this item"
                       >
                         ×
                       </button>
                     </div>
                   </div>

                   {/* Original text preview */}
                   <div className="mb-2">
                     <p className="text-sm text-gray-600 line-clamp-2">
                       "{item.originalText.length > 100 ? item.originalText.substring(0, 100) + '...' : item.originalText}"
                     </p>
                   </div>

                   {/* Result preview */}
                   <div className="text-sm">
                     <div className="flex items-center space-x-4 text-gray-500">
                       <span>🎯 Intent: {item.result.intent.substring(0, 50)}...</span>
                       <span>📊 Emotion: {item.result.emotionIntensity}/100</span>
                     </div>
                   </div>
                 </div>
               </div>
             ))}
           </div>
        )}

        {/* Collapsed view */}
        {!isExpanded && (
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">{history.length} translation{history.length !== 1 ? 's' : ''} saved</div>
              <button
                onClick={() => setIsExpanded(true)}
                className="text-blue-600 hover:text-blue-700 hover:underline transition-colors text-sm"
              >
                View all →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;
