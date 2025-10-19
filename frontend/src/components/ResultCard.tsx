import React, { useState } from 'react';
import type { TranslationResult, ToneType } from '../types/index.ts';
import { useAppStore } from '../store/useAppStore';
import { ApiService } from '../services/api';

interface ResultCardProps {
  result: TranslationResult;
  originalText: string;
  className?: string;
}

const ResultCard: React.FC<ResultCardProps> = ({ result, originalText, className = '' }) => {
  const { userRole, setLoading, setError } = useAppStore();
  const [toneAdjustments, setToneAdjustments] = useState<Record<ToneType, string | null>>({
    direct: null,
    gentle: null,
    empathetic: null
  });
  const [adjustingTone, setAdjustingTone] = useState<ToneType | null>(null);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleToneAdjustment = async (tone: ToneType) => {
    if (toneAdjustments[tone]) {
      // Already adjusted, just show the result
      return;
    }

    setAdjustingTone(tone);
    setLoading(true);

    try {
      const adjustment = await ApiService.adjustTone({
        text: result.rewrite,
        tone,
        userRole
      });

      setToneAdjustments(prev => ({
        ...prev,
        [tone]: adjustment.adjustedText
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Tone adjustment failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setAdjustingTone(null);
    }
  };

  const toneButtons: { tone: ToneType; label: string; description: string; color: string }[] = [
    {
      tone: 'direct',
      label: 'Direct',
      description: 'Straightforward and clear',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      tone: 'gentle',
      label: 'Gentle',
      description: 'Kind and considerate',
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      tone: 'empathetic',
      label: 'Empathetic',
      description: 'Understanding and supportive',
      color: 'bg-purple-600 hover:bg-purple-700'
    }
  ];

  const ResultSection: React.FC<{ title: string; content: string; icon: string }> = ({ 
    title, 
    content, 
    icon 
  }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center space-x-2 mb-3">
        <span className="text-xl">{icon}</span>
        <h4 className="font-semibold text-gray-800">{title}</h4>
        <button
          onClick={() => copyToClipboard(content)}
          className="ml-auto text-gray-500 hover:text-gray-700 transition-colors"
          title="Copy to clipboard"
        >
          📋
        </button>
      </div>
      <p className="text-gray-700 leading-relaxed">{content}</p>
    </div>
  );

  return (
    <div className={`result-card ${className}`}>
      <h3 className="text-xl font-bold text-gray-800 mb-6">Translation Results</h3>
      
      <div className="space-y-6">
        {/* Intent Analysis */}
        <ResultSection
          title="Intent Analysis"
          content={result.intent}
          icon="🎯"
        />

        {/* Potential Misunderstanding */}
        <ResultSection
          title="Potential Misunderstanding"
          content={result.misunderstanding}
          icon="⚠️"
        />

        {/* Improved Version */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-xl">✨</span>
            <h4 className="font-semibold text-gray-800">Improved Version</h4>
            <button
              onClick={() => copyToClipboard(result.rewrite)}
              className="ml-auto text-gray-500 hover:text-gray-700 transition-colors"
              title="Copy to clipboard"
            >
              📋
            </button>
          </div>
          <p className="text-gray-700 leading-relaxed mb-4">{result.rewrite}</p>
          
          {/* Tone Adjustment Buttons */}
          <div className="border-t pt-4">
            <h5 className="font-medium text-gray-700 mb-3">Adjust Tone:</h5>
            <div className="flex flex-wrap gap-2">
              {toneButtons.map(({ tone, label, description, color }) => (
                <button
                  key={tone}
                  onClick={() => handleToneAdjustment(tone)}
                  disabled={adjustingTone === tone}
                  className={`
                    px-4 py-2 rounded-lg text-white text-sm font-medium transition-all
                    ${toneAdjustments[tone] ? 'opacity-75' : color}
                    ${adjustingTone === tone ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {adjustingTone === tone ? 'Adjusting...' : label}
                </button>
              ))}
            </div>
            
            {/* Show tone adjustments */}
            {Object.entries(toneAdjustments).map(([tone, adjustedText]) => {
              if (!adjustedText) return null;
              
              const toneInfo = toneButtons.find(t => t.tone === tone);
              return (
                <div key={tone} className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h6 className="font-medium text-gray-700">{toneInfo?.label} Version:</h6>
                    <button
                      onClick={() => copyToClipboard(adjustedText)}
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                      title="Copy to clipboard"
                    >
                      📋
                    </button>
                  </div>
                  <p className="text-gray-600 text-sm">{adjustedText}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Communication Tips */}
        {result.communicationTips && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <span className="text-blue-600 text-lg">💡</span>
              <div>
                <h4 className="font-medium text-blue-800">Communication Tips</h4>
                <p className="text-sm text-blue-700 mt-1">{result.communicationTips}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultCard;
