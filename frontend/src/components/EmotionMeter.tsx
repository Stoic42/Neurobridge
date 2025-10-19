import React from 'react';
import type { TranslationResult } from '../types/index.ts';

interface EmotionMeterProps {
  result: TranslationResult;
  className?: string;
}

const EmotionMeter: React.FC<EmotionMeterProps> = ({ result, className = '' }) => {
  const { emotionIntensity, emotionDescription } = result;
  
  // Calculate color based on intensity
  const getColor = (intensity: number) => {
    if (intensity >= 80) return 'text-red-600';
    if (intensity >= 60) return 'text-orange-600';
    if (intensity >= 40) return 'text-yellow-600';
    if (intensity >= 20) return 'text-green-600';
    return 'text-blue-600';
  };

  const getBgColor = (intensity: number) => {
    if (intensity >= 80) return 'bg-red-100';
    if (intensity >= 60) return 'bg-orange-100';
    if (intensity >= 40) return 'bg-yellow-100';
    if (intensity >= 20) return 'bg-green-100';
    return 'bg-blue-100';
  };

  const getIntensityLabel = (intensity: number) => {
    if (intensity >= 80) return 'Very High';
    if (intensity >= 60) return 'High';
    if (intensity >= 40) return 'Moderate';
    if (intensity >= 20) return 'Low';
    return 'Very Low';
  };

  // Calculate rotation for the needle (0-180 degrees)
  const rotation = (emotionIntensity / 100) * 180;

  return (
    <div className={`emotion-meter ${className} bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-xl p-6`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Emotional Intensity</h3>
      
      <div className="flex flex-col items-center space-y-4">
        {/* Circular meter */}
        <div className="relative w-52 h-52 drop-shadow-md">
          {/* Background circle */}
          <div className="absolute inset-0 rounded-full border-[10px] border-gray-200 shadow-inner" aria-hidden="true"></div>
          
          {/* Progress circle */}
           <div
            className="absolute inset-0 rounded-full border-[10px] border-transparent transition-all duration-500 ease-out"
             style={{
               background: `conic-gradient(from 0deg, ${emotionIntensity >= 80 ? '#ef4444' : emotionIntensity >= 60 ? '#f97316' : emotionIntensity >= 40 ? '#f59e0b' : emotionIntensity >= 20 ? '#22c55e' : '#3b82f6'} 0deg, ${emotionIntensity >= 80 ? '#ef4444' : emotionIntensity >= 60 ? '#f97316' : emotionIntensity >= 40 ? '#f59e0b' : emotionIntensity >= 20 ? '#22c55e' : '#3b82f6'} ${rotation}deg, #e5e7eb ${rotation}deg, #e5e7eb 360deg)`
             }}
             aria-hidden="true"
           ></div>
          
          {/* Center content */}
          <div className="absolute inset-5 bg-white/80 backdrop-blur-sm rounded-full flex flex-col items-center justify-center shadow-md">
            <div className="text-3xl font-bold text-gray-800">{emotionIntensity}</div>
            <div className="text-xs text-gray-500 tracking-wide">intensity</div>
          </div>
          
          {/* Needle */}
           <div
            className="absolute top-2 left-1/2 w-1 h-20 bg-gray-800 origin-bottom transform -translate-x-1/2 transition-transform duration-500 ease-out"
             style={{
               transform: `translateX(-50%) rotate(${rotation}deg)`,
               transformOrigin: 'bottom center'
             }}
             aria-hidden="true"
           ></div>
        </div>
      
        {/* Intensity label and description */}
        <div className="text-center">
          <div className={`inline-flex items-center px-3 py-1 rounded-full border border-white/40 bg-white/60 backdrop-blur-sm shadow-md text-sm font-semibold ${getColor(emotionIntensity)}`}>{getIntensityLabel(emotionIntensity)} Intensity</div>
          <div className={`mt-3 p-4 rounded-2xl border ${getBgColor(emotionIntensity)} border-opacity-60 shadow-md`}> 
            <p className="text-sm text-gray-700 leading-relaxed">{emotionDescription}</p>
          </div>
        </div>
      
        {/* Communication tips for high intensity */}
        {emotionIntensity > 70 && (
          <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl shadow-md">
             <div className="flex items-start space-x-2">
               <span className="text-amber-600 text-lg" aria-hidden="true">💡</span>
               <div>
                 <h4 className="font-medium text-amber-800">Communication Tips</h4>
                 <p className="text-sm text-amber-700 mt-1">
                   High emotional intensity detected. Consider taking a break, using calming techniques, or communicating in a quieter environment.
                 </p>
               </div>
             </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default EmotionMeter;
