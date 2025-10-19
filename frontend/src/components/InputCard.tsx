import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { ApiService } from '../services/api';

interface InputCardProps {
  className?: string;
}

const InputCard: React.FC<InputCardProps> = ({ className = '' }) => {
  const { 
    inputText, 
    setInputText, 
    userRole, 
    setLoading, 
    setError, 
    setTranslationResult,
    addToHistory,
    isLoading,
    error,
    clearError
  } = useAppStore();

  const [localError, setLocalError] = useState<string | null>(null);
  // Live preview states
  const [previewIntent, setPreviewIntent] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent | KeyboardEvent) => {
    if (e && 'preventDefault' in e) {
      e.preventDefault();
    }
    
    if (!inputText.trim()) {
      setLocalError('Please enter some text to translate');
      return;
    }

    if (inputText.length > 2000) {
      setLocalError('Text is too long. Please keep it under 2000 characters.');
      return;
    }

    setLocalError(null);
    clearError();
    setLoading(true);

    try {
      // Determine target role (opposite of user role)
      const targetRole = userRole === 'ASD' ? 'NT' : userRole === 'NT' ? 'ASD' : 'NT';
      
      const result = await ApiService.translate({
        text: inputText,
        userRole,
        targetRole
      });

      setTranslationResult(result);
      addToHistory(result, inputText);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Translation failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (localError) setLocalError(null);
  };

  // Debounced live intent preview
  useEffect(() => {
    setPreviewError(null);
    setPreviewIntent(null);

    const text = inputText.trim();
    if (!text || text.length < 10) {
      setIsPreviewLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsPreviewLoading(true);
    const timer = setTimeout(async () => {
      try {
        const targetRole = userRole === 'ASD' ? 'NT' : userRole === 'NT' ? 'ASD' : 'NT';
        const result = await ApiService.translate({
          text,
          userRole,
          targetRole
        });
        setPreviewIntent(result.intent);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Preview failed';
        setPreviewError(msg);
      } finally {
        setIsPreviewLoading(false);
      }
    }, 800);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [inputText, userRole]);

  const characterCount = inputText.length;
  const isOverLimit = characterCount > 2000;
  const isApproachingLimit = characterCount >= 1800 && characterCount < 1950;
  const isNearHardLimit = characterCount >= 1950 && characterCount <= 2000;

  return (
    <div className={`input-card ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="input-text" className="block text-sm font-medium text-gray-700 mb-2">
            Enter your message:
          </label>
          <textarea
            id="input-text"
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                if (!isLoading) {
                  handleSubmit(e);
                }
              }
            }}
            placeholder="Type your message here... The AI will help translate it to be clearer for others to understand."
            className={`
              w-full p-4 border-2 rounded-lg resize-none transition-colors
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${isOverLimit ? 'border-red-300 bg-red-50' : isNearHardLimit ? 'border-red-200 bg-red-50' : isApproachingLimit ? 'border-yellow-200 bg-yellow-50' : 'border-gray-300'}
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            rows={4}
            disabled={isLoading}
            maxLength={2000}
            aria-label="Message input"
          />
          
          <div className="flex justify-between items-center mt-2">
            <div className={`text-sm ${isOverLimit ? 'text-red-600' : isNearHardLimit ? 'text-red-600' : isApproachingLimit ? 'text-yellow-600' : 'text-gray-500'}`}>
              {characterCount}/2000 characters
            </div>
            {isApproachingLimit && !isOverLimit && (
              <div className="text-xs text-yellow-700 font-medium">
                Approaching the limit
              </div>
            )}
            {isNearHardLimit && (
              <div className="text-xs text-red-700 font-medium">
                Near the maximum limit
              </div>
            )}
            {isOverLimit && (
              <div className="text-sm text-red-600 font-medium">
                Text is too long!
              </div>
            )}
          </div>
        </div>

        {(localError || error) && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg" role="alert" aria-live="polite">
            <p className="text-sm text-red-800">
              {localError || error}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={!inputText.trim() || isLoading || isOverLimit}
          className={`
            w-full py-3 px-6 rounded-lg font-medium transition-all duration-200
            ${(!inputText.trim() || isLoading || isOverLimit)
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md active:scale-95'
            }
          `}
          aria-label="Translate message"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2" aria-busy="true" aria-live="polite">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
              <span>Translating...</span>
            </div>
          ) : (
            'Translate Message'
          )}
        </button>

        {/* Live Intent Preview */}
        <div className="mt-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xl">🔎</span>
              <h4 className="font-semibold text-gray-800">Intent Preview</h4>
            </div>
            {isPreviewLoading && (
              <div className="animate-pulse space-y-2" aria-busy="true">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            )}
            {!isPreviewLoading && previewIntent && (
              <p className="text-gray-700 text-sm" aria-live="polite">{previewIntent}</p>
            )}
            {!isPreviewLoading && !previewIntent && !previewError && (
              <p className="text-gray-500 text-sm">Start typing to see a preview of your message's intent.</p>
            )}
            {previewError && (
              <p className="text-red-700 text-sm">{previewError}</p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default InputCard;
