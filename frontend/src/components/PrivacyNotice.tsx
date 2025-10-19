import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';

interface PrivacyNoticeProps {
  className?: string;
  showAsModal?: boolean;
}

const PrivacyNotice: React.FC<PrivacyNoticeProps> = ({ className = '', showAsModal = false }) => {
  const [isExpanded, setIsExpanded] = useState(showAsModal);
  const { privacyAccepted, acceptPrivacy, clearAllData, setShowPrivacyNotice } = useAppStore();
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (showAsModal && modalRef.current) {
      modalRef.current.focus();
    }
  }, [showAsModal]);

  // Modal overlay for initial consent
  if (showAsModal) {
    return (
      <div 
        className="fixed inset-0 bg-white z-[9999] flex items-center justify-center p-4" 
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(4px)' }}
        aria-hidden={!showAsModal}
      >
        <div
          ref={modalRef}
          className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl ring-1 ring-gray-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-modal-title"
          aria-describedby="privacy-modal-desc"
          tabIndex={-1}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 id="privacy-modal-title" className="text-2xl font-bold text-gray-900">Welcome to NeuroBridge</h2>
              <div className="text-3xl" aria-hidden="true">🌉</div>
            </div>

            <div id="privacy-modal-desc" className="mb-6">
              <p className="text-gray-700 mb-4">
                Before you start using NeuroBridge, please review our privacy practices and medical disclaimer.
              </p>
            </div>

            <PrivacyContent />

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={acceptPrivacy}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                aria-label="Accept privacy policy and start"
              >
                I Accept - Start Using NeuroBridge
              </button>
              <button
                onClick={() => setShowPrivacyNotice(false)}
                className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                aria-label="Close privacy notice"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`privacy-notice ${className}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">Privacy & Medical Notice</h3>
          <div className="flex items-center space-x-2">
            {privacyAccepted && (
              <span className="text-green-600 text-sm font-medium" aria-live="polite">✓ Accepted</span>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              title={isExpanded ? 'Collapse' : 'Expand'}
              aria-expanded={isExpanded}
              aria-controls="privacy-section"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div id="privacy-section" className="space-y-4">
            <PrivacyContent />

            {/* Data Management Controls */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-3">🛠️ Data Management</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Privacy Policy Status:</span>
                  <span className={`text-sm font-medium ${privacyAccepted ? 'text-green-600' : 'text-orange-600'}`}>
                    {privacyAccepted ? '✓ Accepted' : '⚠️ Not Accepted'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  {!privacyAccepted && (
                    <button
                      onClick={acceptPrivacy}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                      aria-label="Accept privacy policy"
                    >
                      Accept Privacy Policy
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (confirm('This will clear all your data including translation history. Are you sure?')) {
                        clearAllData();
                      }
                    }}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                    aria-label="Clear all local data"
                  >
                    Clear All Data
                  </button>
                </div>

                <p className="text-xs text-gray-500">
                  You can clear all locally stored data at any time. This includes your role preference and translation history.
                </p>
              </div>
            </div>
          </div>
        )}

        {!isExpanded && (
          <div className="text-sm text-gray-600">
            <p>Your privacy and data security are our top priorities. Click to learn more about how we protect your information.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Reusable privacy content component
const PrivacyContent: React.FC = () => (
  <div className="space-y-4 text-sm text-gray-700">
    {/* Privacy Notice */}
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
      <h4 className="font-medium text-blue-800 mb-2">🔒 Privacy Protection</h4>
      <ul className="space-y-1 text-blue-700">
        <li>• All data is processed locally on your device</li>
        <li>• No personal information is stored on our servers</li>
        <li>• Translation history is saved only in your browser's local storage</li>
        <li>• You can clear your data anytime using the controls below</li>
        <li>• No cookies or tracking technologies are used</li>
      </ul>
    </div>

    {/* Medical Disclaimer */}
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
      <h4 className="font-medium text-amber-800 mb-2">⚠️ Medical Disclaimer</h4>
      <ul className="space-y-1 text-amber-700">
        <li>• This tool is for educational and communication purposes only</li>
        <li>• Not a substitute for professional medical advice, diagnosis, or treatment</li>
        <li>• Not a diagnostic tool for autism or other neurodevelopmental conditions</li>
        <li>• Always consult qualified healthcare professionals for medical concerns</li>
        <li>• Individual communication needs may vary significantly</li>
      </ul>
    </div>

    {/* Data Usage */}
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
      <h4 className="font-medium text-gray-800 mb-2">📊 Data Usage</h4>
      <ul className="space-y-1 text-gray-700">
        <li>• We do not collect or share your personal data</li>
        <li>• Your translations are not stored or analyzed by external services</li>
        <li>• We strive to maintain your privacy and data security at all times</li>
      </ul>
    </div>
  </div>
);

export default PrivacyNotice;


