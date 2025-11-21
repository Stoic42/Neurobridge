// Core type definitions for NeuroBridge application

export type UserRole = 'ASD' | 'NT' | 'UNCERTAIN';

export type ToneType = 'direct' | 'gentle' | 'empathetic';

export interface TranslationRequest {
  text: string;
  userRole: UserRole;
  targetRole: UserRole;
}

export interface TranslationResult {
  intent: string;
  misunderstanding: string;
  rewrite: string;
  emotionIntensity: number; // 0-100
  emotionDescription: string;
  communicationTips?: string;
}

export interface ToneAdjustmentRequest {
  text: string;
  tone: ToneType;
  userRole: UserRole;
}

export interface ToneAdjustmentResult {
  adjustedText: string;
  tone: ToneType;
  originalText: string;
}

export interface TranslationHistory {
  id: string;
  timestamp: number;
  originalText: string;
  userRole: UserRole;
  result: TranslationResult;
  toneAdjustments?: ToneAdjustmentResult[];
}

export interface AppState {
  userRole: UserRole;
  inputText: string;
  translationResult: TranslationResult | null;
  isLoading: boolean;
  error: string | null;
  history: TranslationHistory[];
  privacyAccepted: boolean;
  showPrivacyNotice: boolean;
  preferredTone?: ToneType; // remember user's preferred tone
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}
