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
      {showPrivacyNotice && !privacyAccepted && (
        <PrivacyNotice showAsModal={true} />
      )}
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">🌉</div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">NeuroBridge</h1>
                  <p className="text-sm text-gray-600">AI Communication Bridge</p>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Bridging ASD & NT Communication
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
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <RoleSelector />
              </div>

              {/* Text Input */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <InputCard />
              </div>

              {/* Results */}
              {translationResult && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <ResultCard 
                    result={translationResult} 
                    originalText={useAppStore.getState().inputText}
                  />
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-red-600 text-lg">⚠️</span>
                    <div>
                      <h4 className="font-medium text-red-800">Error</h4>
                      <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-blue-800 font-medium">Processing your message...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Emotion Meter */}
              {translationResult && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <EmotionMeter result={translationResult} />
                </div>
              )}

              {/* History Panel */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <HistoryPanel />
              </div>

              {/* Privacy Notice */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
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
