import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { TranslationHistory } from '../types/index.ts';

interface HistoryPanelProps {
  className?: string;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ className = '' }) => {
  const { history, removeFromHistory, clearHistory, setTranslationResult, setInputText } = useAppStore();
  const [isExpanded, setIsExpanded] = useState(true);

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
      <div className={`history-panel ${className} bg-white border border-neutral-200 rounded-xl p-6`}>
        <h3 className="text-[17px] font-semibold text-neutral-800 mb-4">Translation History</h3>
        <div className="text-center py-6">
          <span className="text-3xl" aria-hidden="true">📝</span>
          <p className="text-neutral-600 text-[14px] mt-2">No history yet</p>
          <p className="text-[13px] text-neutral-500 mt-1">Your translations will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`history-panel ${className}`}>
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-200">
          <h3 className="text-[17px] font-semibold text-neutral-800">
            History ({history.length})
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 transition-colors text-sm"
              title={isExpanded ? 'Collapse' : 'Expand'}
              aria-expanded={isExpanded}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
            <button
              onClick={handleClearAll}
              className="p-1.5 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors text-sm"
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
              <div key={item.id} className="border-b border-neutral-100 last:border-b-0">
                <div className="p-4 hover:bg-neutral-50 transition-colors">
                  {/* Header with timestamp and actions */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-neutral-500">{formatTimestamp(item.timestamp)}</span>
                      <span className="text-[11px] bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                        {item.userRole}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleRestoreTranslation(item)}
                        className="p-1.5 rounded-lg text-primary-600 hover:text-primary-700 hover:bg-primary-50 transition-colors text-sm"
                        title="Restore this translation"
                        aria-label="Restore this translation"
                      >
                        ↻
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors text-sm"
                        title="Delete this item"
                        aria-label="Delete this item"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {/* Original text preview */}
                  <div className="mb-2">
                    <p className="text-[13px] text-neutral-600 line-clamp-2">
                      "{item.originalText.length > 100 ? item.originalText.substring(0, 100) + '...' : item.originalText}"
                    </p>
                  </div>

                  {/* Result preview */}
                  <div className="flex items-center gap-3 text-[12px] text-neutral-500">
                    <span className="flex items-center gap-1">
                      <span>🎯</span>
                      <span className="line-clamp-1">{item.result.intent.substring(0, 40)}...</span>
                    </span>
                    <span>📊 {item.result.emotionIntensity}/100</span>
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
              <div className="text-[14px] text-neutral-600">
                {history.length} translation{history.length !== 1 ? 's' : ''} saved
              </div>
              <button
                onClick={() => setIsExpanded(true)}
                className="text-primary-600 hover:text-primary-700 hover:underline transition-colors text-[14px]"
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
