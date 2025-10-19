import React, { useState, useEffect } from 'react';
import type { TranslationResult, ToneType } from '../types/index.ts';
import { useAppStore } from '../store/useAppStore';
import { ApiService } from '../services/api';

interface ResultCardProps {
  result: TranslationResult;
  originalText: string;
  className?: string;
}

const ResultCard: React.FC<ResultCardProps> = ({ result, originalText, className = '' }) => {
  const { userRole, setLoading, setError, preferredTone, setPreferredTone } = useAppStore();
  const [toneAdjustments, setToneAdjustments] = useState<Record<ToneType, string | null>>({
    direct: null,
    gentle: null,
    empathetic: null
  });
  const [adjustingTone, setAdjustingTone] = useState<ToneType | null>(null);
  const [activeToneTab, setActiveToneTab] = useState<ToneType>(preferredTone || 'direct');

  useEffect(() => {
    if (preferredTone) {
      setActiveToneTab(preferredTone);
    }
  }, [preferredTone]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleToneAdjustment = async (tone: ToneType) => {
    if (toneAdjustments[tone]) {
      setActiveToneTab(tone);
      return;
    }

    setActiveToneTab(tone);
    setPreferredTone(tone);
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

  const toneButtons: { tone: ToneType; label: string; description: string; color: string; icon: string }[] = [
    {
      tone: 'direct',
      label: 'Direct',
      description: 'Straightforward and clear',
      color: 'bg-blue-600 hover:bg-blue-700',
      icon: '🎯'
    },
    {
      tone: 'gentle',
      label: 'Gentle',
      description: 'Kind and considerate',
      color: 'bg-green-600 hover:bg-green-700',
      icon: '🌿'
    },
    {
      tone: 'empathetic',
      label: 'Empathetic',
      description: 'Understanding and supportive',
      color: 'bg-purple-600 hover:bg-purple-700',
      icon: '💜'
    }
  ];

  const ResultSection: React.FC<{ title: string; content: string; icon: string }> = ({ 
    title, 
    content, 
    icon 
  }) => (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/40 p-5 shadow-xl" aria-live="polite">
      <div className="flex items-center space-x-2 mb-3">
        <span className="text-xl" aria-hidden="true">{icon}</span>
        <h4 className="font-semibold text-gray-800">{title}</h4>
        <button
          onClick={() => copyToClipboard(content)}
          className="ml-auto text-gray-500 hover:text-gray-700 transition-colors hover:underline"
          title="Copy to clipboard"
          aria-label={`Copy ${title} text to clipboard`}
        >
          📋
        </button>
      </div>
      <p className="text-gray-700 leading-relaxed">{content && content.trim() ? content : 'No analysis available yet.'}</p>
    </div>
  );

  // Reverse translate: translate improved text back to original role
  const handleReverseTranslate = async () => {
    setLoading(true);
    try {
      // Determine target role back to original
      const targetRole = userRole === 'ASD' ? 'NT' : userRole === 'NT' ? 'ASD' : 'NT';
      const reverseTarget = targetRole === 'ASD' ? 'NT' : 'ASD';
      const reverse = await ApiService.translate({
        text: result.rewrite,
        userRole: targetRole,
        targetRole: reverseTarget,
      });
      // Show reverse intent in a temporary section or alert
      alert(`Reverse translation intent: ${reverse.intent}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Reverse translation failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`result-card ${className}`}>
      <h3 className="text-xl font-bold text-gray-800 mb-6">Translation Results</h3>
      
      <div className="space-y-6">
        {/* Intent Analysis */}
        <ResultSection
          title="Intent Analysis"
          content={/无法解析意图|分析不可用/.test(result.intent) ? 'Analysis currently unavailable.' : result.intent}
          icon="🎯"
        />

        {/* Potential Misunderstanding */}
        <ResultSection
          title="Potential Misunderstanding"
          content={/无法解析意图|分析不可用/.test(result.misunderstanding) ? 'No potential misunderstanding identified.' : result.misunderstanding}
          icon="⚠️"
        />

        {/* Improved Version */}
          <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/40 p-5 shadow-xl" aria-live="polite">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-xl" aria-hidden="true">✨</span>
            <h4 className="font-semibold text-gray-800">Improved Version</h4>
            <button
              onClick={() => copyToClipboard(result.rewrite)}
              className="ml-auto text-gray-500 hover:text-gray-700 transition-colors hover:underline"
              title="Copy to clipboard"
              aria-label="Copy improved version to clipboard"
            >
              📋
            </button>
          </div>
          <p className="text-gray-700 leading-relaxed mb-4">{result.rewrite || 'No improved version available.'}</p>
          <div className="flex justify-end mb-4">
            <button
              onClick={handleReverseTranslate}
              className="px-3 py-2 rounded-full text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors shadow-md"
              aria-label="Reverse translate the improved text back"
            >
              🔄 Reverse Translate
            </button>
          </div>
            <div className="border-t pt-4">
            <h5 className="font-medium text-gray-700 mb-3">Adjust Tone:</h5>
            <div role="tablist" aria-label="Tone options" className="flex flex-wrap gap-2">
              {toneButtons.map(({ tone, label, description, color, icon }) => (
                <button
                  key={tone}
                  onClick={() => handleToneAdjustment(tone)}
                  disabled={adjustingTone === tone}
                  role="tab"
                  aria-selected={activeToneTab === tone}
                  className={`
                    px-4 py-2 rounded-full text-white text-sm font-semibold transition-all shadow-md
                    ${toneAdjustments[tone] ? 'opacity-75' : color}
                    ${adjustingTone === tone ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <span className="mr-1" aria-hidden="true">{icon}</span>
                  {adjustingTone === tone ? 'Adjusting...' : label}
                </button>
              ))}
            </div>
            <div className="mt-4">
              {toneButtons.map(({ tone, label }) => (
                <div
                  key={tone}
                  role="tabpanel"
                  aria-labelledby={`tone-${tone}`}
                  hidden={activeToneTab !== tone}
                  className="mt-2 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 shadow-md"
                >
                  {adjustingTone === tone && (
                    <div className="animate-pulse space-y-2" aria-busy="true">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  )}
                  {!adjustingTone && toneAdjustments[tone] && (
                    <div className="flex items-center justify-between mb-2">
                      <h6 className="font-medium text-gray-700">{label} Version:</h6>
                      <button
                        onClick={() => copyToClipboard(toneAdjustments[tone] as string)}
                        className="text-gray-500 hover:text-gray-700 transition-colors hover:underline"
                        title="Copy to clipboard"
                        aria-label={`Copy ${label} version to clipboard`}
                      >
                        📋
                      </button>
                    </div>
                  )}
                  {!adjustingTone && !toneAdjustments[tone] && (
                    <p className="text-gray-500 text-sm">Select a tone above to generate an adjusted version.</p>
                  )}
                  {toneAdjustments[tone] && (
                    <p className="text-gray-700 text-sm leading-relaxed">{toneAdjustments[tone]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Communication Tips */}
        {result.communicationTips && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 shadow-md">
            <div className="flex items-start space-x-2">
              <span className="text-blue-600 text-lg" aria-hidden="true">💡</span>
              <div>
                <h4 className="font-medium text-blue-800">Communication Tips</h4>
                <p className="text-sm text-blue-700 mt-1 leading-relaxed">{result.communicationTips}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultCard;
