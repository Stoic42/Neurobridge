import { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import RoleSelector from './components/RoleSelector';
import InputCard from './components/InputCard';
import ResultCard from './components/ResultCard';
import EmotionMeter from './components/EmotionMeter';
import HistoryPanel from './components/HistoryPanel';
import PrivacyNotice from './components/PrivacyNotice';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const { 
    translationResult, 
    isLoading, 
    error, 
    privacyAccepted, 
    showPrivacyNotice
  } = useAppStore();

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
      
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        {/* Header */}
        <header className="bg-gradient-to-r from-primary-50 to-blue-50 shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200" aria-hidden="true">🌉</div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900">NeuroBridge</h1>
                  <p className="text-sm text-gray-600">AI Communication Bridge</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">Bridging ASD & NT Communication</div>
                <button
                  onClick={() => useAppStore.getState().setShowPrivacyNotice(true)}
                  className="p-2 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label="Open privacy and settings"
                  title="Privacy & Settings"
                >
                  ⚙️
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Input Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Role Selection */}
              <div className="bg-transparent p-0 border-0 shadow-none">
                <RoleSelector />
              </div>

              {/* Text Input */}
              <div className="bg-transparent p-0 border-0 shadow-none">
                <InputCard />
              </div>

              {/* Helpful Empty State */}
              {!translationResult && !isLoading && (
                <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/40 p-6 shadow-xl" role="region" aria-label="Helpful tips">
                  <div className="flex items-center space-x-2">
                    <span className="text-yellow-500" aria-hidden="true">💡</span>
                    <h2 className="text-lg font-semibold text-gray-900">Tips & Examples</h2>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Try typing a message and click "Translate". You can preview the intent as you type.</p>
                  <ul className="mt-3 space-y-2 text-sm text-gray-700 list-disc list-inside">
                    <li>ASD → NT: "I prefer written instructions because verbal ones are hard to follow."</li>
                    <li>NT → ASD: "Lets meet at 3 PM. Ill send a bullet list of topics in advance."</li>
                    <li>Uncertain: "Im not sure how to ask for more details without sounding demanding."</li>
                  </ul>
                  <p className="text-sm text-gray-600 mt-3">Use the tone tabs to see Direct, Gentle, and Empathetic versions. Your preferred tone will be remembered.</p>
                </div>
              )}

              {/* Results */}
              {translationResult && (
                <div className="bg-transparent p-0 border-0 shadow-none">
                  <ResultCard 
                    result={translationResult} 
                    originalText={useAppStore.getState().inputText}
                  />
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert" aria-live="polite">
                  <div className="flex items-center space-x-2">
                    <span className="text-red-600 text-lg" aria-hidden="true">⚠️</span>
                    <div>
                      <h4 className="font-medium text-red-800">Error</h4>
                      <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="space-y-4" aria-busy="true" aria-live="polite">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
                      <span className="text-blue-800 font-medium">Processing your message...</span>
                    </div>
                  </div>
                  {/* Skeletons for translation result sections */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" aria-hidden="true"></div>
                    <div className="mt-4 space-y-2">
                      <div className="h-4 w-full bg-gray-200 rounded animate-pulse" aria-hidden="true"></div>
                      <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" aria-hidden="true"></div>
                      <div className="h-4 w-4/6 bg-gray-200 rounded animate-pulse" aria-hidden="true"></div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="h-5 w-56 bg-gray-200 rounded animate-pulse" aria-hidden="true"></div>
                    <div className="mt-4 space-y-2">
                      <div className="h-4 w-full bg-gray-200 rounded animate-pulse" aria-hidden="true"></div>
                      <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" aria-hidden="true"></div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" aria-hidden="true"></div>
                    <div className="mt-4 space-y-2">
                      <div className="h-4 w-full bg-gray-200 rounded animate-pulse" aria-hidden="true"></div>
                      <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" aria-hidden="true"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Emotion Meter */}
              {translationResult && (
                <div className="bg-transparent p-0 border-0 shadow-none">
                  <EmotionMeter result={translationResult} />
                </div>
              )}

              {/* History Panel */}
              <div className="bg-transparent p-0 border-0 shadow-none">
                <HistoryPanel />
              </div>

              {/* Privacy Notice */}
              <div className="bg-transparent p-0 border-0 shadow-none">
                <PrivacyNotice />
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="text-sm text-gray-600">
                <p>NeuroBridge - AI-powered communication bridge for neurodiversity</p>
                <p className="mt-1">This tool is for educational purposes only and not a substitute for professional medical advice.</p>
              </div>
              <div className="text-sm text-gray-500">
                <p>Built with ❤️ for the neurodiverse community</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}

export default App;
