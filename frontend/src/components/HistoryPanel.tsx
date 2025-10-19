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
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <div className="text-gray-400 text-4xl mb-2">📝</div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">No History Yet</h3>
          <p className="text-sm text-gray-500">
            Your translation history will appear here after you make your first translation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`history-panel ${className}`}>
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Translation History ({history.length})
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
            <button
              onClick={handleClearAll}
              className="text-red-500 hover:text-red-700 transition-colors text-sm"
              title="Clear all history"
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
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(item.timestamp)}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {item.userRole}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleRestoreTranslation(item)}
                        className="text-blue-500 hover:text-blue-700 transition-colors text-sm"
                        title="Restore this translation"
                      >
                        ↻
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-500 hover:text-red-700 transition-colors text-sm"
                        title="Delete this item"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {/* Original text preview */}
                  <div className="mb-2">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      "{item.originalText.length > 100 
                        ? item.originalText.substring(0, 100) + '...' 
                        : item.originalText}"
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
              <div className="text-sm text-gray-600">
                {history.length} translation{history.length !== 1 ? 's' : ''} saved
              </div>
              <button
                onClick={() => setIsExpanded(true)}
                className="text-blue-500 hover:text-blue-700 transition-colors text-sm"
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
