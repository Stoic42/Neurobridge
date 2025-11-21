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
  const [previewIntent, setPreviewIntent] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

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
    setPreviewIntent(null);

    const text = inputText.trim();
    if (!text || text.length < 10) {
      setIsPreviewLoading(false);
      return;
    }

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
      } catch {
        // Silently fail for preview
      } finally {
        setIsPreviewLoading(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [inputText, userRole]);

  const characterCount = inputText.length;
  const isOverLimit = characterCount > 2000;

  return (
    <div className={`input-card ${className} bg-white border border-neutral-200 rounded-2xl shadow-lg p-8`}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="input-text" className="block text-[17px] font-semibold text-neutral-800 mb-3">
            Enter your message
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
              w-full p-4 border-2 rounded-xl resize-none transition-all bg-neutral-50
              focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300 focus:bg-white
              ${isOverLimit ? 'border-red-300 bg-red-50' : 'border-neutral-200'}
              ${isLoading ? 'opacity-60 cursor-not-allowed' : 'hover:border-neutral-300'}
              text-[15px] text-neutral-700 placeholder:text-neutral-400
            `}
            rows={6}
            disabled={isLoading}
            maxLength={2000}
            aria-label="Message input"
          />
          <div className="flex justify-between items-center mt-2 px-1">
            <div className={`text-[13px] ${isOverLimit ? 'text-red-600 font-medium' : 'text-neutral-500'}`}>
              {characterCount}/2000 characters
            </div>
            {isOverLimit && (
              <div className="text-[13px] text-red-600 font-medium">Text is too long!</div>
            )}
          </div>
        </div>

        {(localError || error) && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl" role="alert" aria-live="polite">
            <p className="text-[14px] text-red-700">
              {localError || error}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={!inputText.trim() || isLoading || isOverLimit}
          className={`
            w-full py-3.5 px-6 rounded-xl font-semibold text-[15px] transition-all duration-200 
            focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2
            ${(!inputText.trim() || isLoading || isOverLimit)
              ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
              : 'bg-primary-500 text-white hover:bg-primary-600 shadow-sm hover:shadow-md active:scale-98'
            }
          `}
          aria-label="Translate message"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2" aria-busy="true" aria-live="polite">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
              <span>Translating...</span>
            </div>
          ) : (
            'Translate Message'
          )}
        </button>

        {/* Live Intent Preview */}
        <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🔎</span>
            <h4 className="font-semibold text-neutral-800 text-[15px]">Intent Preview</h4>
          </div>
          {isPreviewLoading && (
            <div className="animate-pulse space-y-2" aria-busy="true">
              <div className="h-3 bg-neutral-200 rounded"></div>
              <div className="h-3 bg-neutral-200 rounded w-5/6"></div>
            </div>
          )}
          {!isPreviewLoading && previewIntent && (
            <p className="text-neutral-700 text-[14px] leading-relaxed" aria-live="polite">{previewIntent}</p>
          )}
          {!isPreviewLoading && !previewIntent && (
            <p className="text-neutral-500 text-[14px]">Start typing to see a preview of your message's intent.</p>
          )}
        </div>
      </form>
    </div>
  );
};

export default InputCard;
