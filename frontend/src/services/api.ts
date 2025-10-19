import axios from 'axios';
import type { AxiosResponse } from 'axios';
import type { TranslationRequest, TranslationResult, ToneAdjustmentRequest, ToneAdjustmentResult, ApiResponse } from '../types/index.ts';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error);
    
    // Handle different error types
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Please try again.');
    }
    
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.detail || error.response.data?.error || 'Server error occurred';
      throw new Error(message);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Unable to connect to server. Please check your connection.');
    } else {
      // Something else happened
      throw new Error('An unexpected error occurred.');
    }
  }
);

export class ApiService {
  /**
   * Translate text between communication styles
   */
  static async translate(request: TranslationRequest): Promise<TranslationResult> {
    try {
      const response: AxiosResponse<TranslationResult> = await api.post('/api/v1/translate', request);
      return response.data;
    } catch (error) {
      console.error('Translation API error:', error);
      throw error;
    }
  }

  /**
   * Adjust text tone
   */
  static async adjustTone(request: ToneAdjustmentRequest): Promise<ToneAdjustmentResult> {
    try {
      const response: AxiosResponse<ToneAdjustmentResult> = await api.post('/api/v1/tone-adjust', request);
      return response.data;
    } catch (error) {
      console.error('Tone adjustment API error:', error);
      throw error;
    }
  }

  /**
   * Check API health
   */
  static async checkHealth(): Promise<any> {
    try {
      const response = await api.get('/api/v1/health');
      return response.data;
    } catch (error) {
      console.error('Health check error:', error);
      throw error;
    }
  }

  /**
   * Get API status
   */
  static async getStatus(): Promise<any> {
    try {
      const response = await api.get('/api/v1/status');
      return response.data;
    } catch (error) {
      console.error('Status check error:', error);
      throw error;
    }
  }
}

export default ApiService;
