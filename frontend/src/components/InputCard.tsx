import React, { useState } from 'react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

  const characterCount = inputText.length;
  const isOverLimit = characterCount > 2000;

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
            placeholder="Type your message here... The AI will help translate it to be clearer for others to understand."
            className={`
              w-full p-4 border-2 rounded-lg resize-none transition-colors
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${isOverLimit ? 'border-red-300 bg-red-50' : 'border-gray-300'}
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            rows={4}
            disabled={isLoading}
            maxLength={2000}
          />
          
          <div className="flex justify-between items-center mt-2">
            <div className="text-sm text-gray-500">
              {characterCount}/2000 characters
            </div>
            {isOverLimit && (
              <div className="text-sm text-red-600 font-medium">
                Text is too long!
              </div>
            )}
          </div>
        </div>

        {(localError || error) && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
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
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Translating...</span>
            </div>
          ) : (
            'Translate Message'
          )}
        </button>
      </form>
    </div>
  );
};

export default InputCard;
