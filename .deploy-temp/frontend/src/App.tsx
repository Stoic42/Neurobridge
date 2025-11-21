import { useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import RoleSelector from './components/RoleSelector';
import InputCard from './components/InputCard';
import ResultCard from './components/ResultCard';
import EmotionMeter from './components/EmotionMeter';
import HistoryPanel from './components/HistoryPanel';
import PrivacyNotice from './components/PrivacyNotice';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

function App() {
  const { 
    translationResult, 
    isLoading, 
    error, 
    privacyAccepted, 
    showPrivacyNotice
  } = useAppStore();

  const [showSidebar, setShowSidebar] = useState(false);
  const [showTips, setShowTips] = useState(false);

  // Show privacy notice on first visit
  useEffect(() => {
    if (!privacyAccepted) {
      useAppStore.getState().setShowPrivacyNotice(true);
    }
  }, [privacyAccepted]);

  return (
    <ErrorBoundary>
      {/* Privacy Consent Modal */}
      {showPrivacyNotice && (
        <PrivacyNotice showAsModal={true} />
      )}
      
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        {/* Header - Minimal and Clean */}
        <header className="bg-white border-b border-neutral-200 flex-shrink-0 shadow-sm">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="text-3xl" aria-hidden="true">🌉</span>
                <h1 className="text-2xl font-semibold text-neutral-800 tracking-tight">NeuroBridge</h1>
              </div>
              <p className="text-[15px] text-neutral-600 leading-relaxed">
                Let AI help you be understood, and understand others.
              </p>
            </div>
            
            {/* Header Actions */}
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={() => setShowTips(!showTips)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                aria-label="Toggle tips"
                title="Tips & Examples"
              >
                💡 <span>Tips</span>
              </button>
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                aria-label="Toggle history and settings"
              >
                📋 <span>History & Settings</span>
              </button>
              <button
                onClick={() => useAppStore.getState().setShowPrivacyNotice(true)}
                className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                aria-label="Privacy settings"
                title="Privacy & Settings"
              >
                ⚙️
              </button>
            </div>
          </div>
        </header>

        {/* Main Content - Centered */}
        <main className="flex-grow px-4 py-8 w-full relative">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Role Selection - Inline */}
            <RoleSelector />

            {/* Tips Tooltip */}
            {showTips && (
              <div className="bg-white border border-neutral-200 rounded-2xl shadow-lg p-6 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-[17px] font-semibold text-neutral-800">💡 Tips & Examples</h3>
                  <button
                    onClick={() => setShowTips(false)}
                    className="text-neutral-400 hover:text-neutral-600 transition-colors"
                    aria-label="Close tips"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-[15px] text-neutral-600 mb-3">Try typing a message and click "Translate". You can preview the intent as you type.</p>
                <ul className="space-y-2 text-[15px] text-neutral-700">
                  <li className="pl-4 border-l-2 border-primary-200">
                    <span className="font-medium">ASD → NT:</span> "I prefer written instructions because verbal ones are hard to follow."
                  </li>
                  <li className="pl-4 border-l-2 border-accent-200">
                    <span className="font-medium">NT → ASD:</span> "Let's meet at 3 PM. I'll send a bullet list of topics in advance."
                  </li>
                  <li className="pl-4 border-l-2 border-neutral-200">
                    <span className="font-medium">Uncertain:</span> "I'm not sure how to ask for more details without sounding demanding."
                  </li>
                </ul>
              </div>
            )}

            {/* Main Input Card - Primary Focus */}
            <InputCard />

            {/* Results */}
            {translationResult && (
              <div className="space-y-6">
                <ResultCard 
                  result={translationResult} 
                  originalText={useAppStore.getState().inputText}
                />
                
                {/* Emotion Meter - Inline with results */}
                <EmotionMeter result={translationResult} />
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5 shadow-sm" role="alert" aria-live="polite">
                <div className="flex items-start gap-3">
                  <span className="text-red-600 text-xl flex-shrink-0" aria-hidden="true">⚠️</span>
                  <div>
                    <h4 className="font-semibold text-red-800 text-[15px]">Error</h4>
                    <p className="text-[15px] text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="space-y-4" aria-busy="true" aria-live="polite">
                <div className="bg-primary-50 border border-primary-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-3 border-primary-400 border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
                    <span className="text-primary-800 font-medium text-[15px]">Processing your message...</span>
                  </div>
                </div>
                
                {/* Skeleton Loaders */}
                <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
                  <div className="space-y-3">
                    <div className="h-5 w-48 bg-neutral-200 rounded-lg animate-pulse" aria-hidden="true"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-neutral-100 rounded animate-pulse" aria-hidden="true"></div>
                      <div className="h-4 w-5/6 bg-neutral-100 rounded animate-pulse" aria-hidden="true"></div>
                      <div className="h-4 w-4/6 bg-neutral-100 rounded animate-pulse" aria-hidden="true"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Collapsible Sidebar */}
          {showSidebar && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 bg-neutral-800/20 backdrop-blur-sm z-40 animate-in fade-in duration-200"
                onClick={() => setShowSidebar(false)}
                aria-hidden="true"
              ></div>
              
              {/* Sidebar Panel */}
              <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto animate-in slide-in-from-right duration-300">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-neutral-800">History & Settings</h2>
                    <button
                      onClick={() => setShowSidebar(false)}
                      className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-600 hover:text-neutral-800 transition-colors"
                      aria-label="Close sidebar"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    <HistoryPanel />
                    <PrivacyNotice />
                  </div>
                </div>
              </div>
            </>
          )}
        </main>

        {/* Footer - Minimal */}
        <footer className="bg-white border-t border-neutral-200 mt-auto flex-shrink-0">
          <div className="max-w-4xl mx-auto px-6 py-6 text-center">
            <p className="text-[13px] text-neutral-600">
              NeuroBridge - AI-powered communication bridge for neurodiversity
            </p>
            <p className="text-[13px] text-neutral-500 mt-1">
              This tool is for educational purposes only and not a substitute for professional medical advice.
            </p>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}

export default App;
