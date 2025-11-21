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
    <div className={`emotion-meter ${className} bg-white border border-neutral-200 rounded-2xl shadow-sm p-6`}>
      <h3 className="text-[17px] font-semibold text-neutral-800 mb-5">Emotional Intensity</h3>
      
      <div className="flex flex-col items-center space-y-4">
        {/* Circular meter */}
        <div className="relative w-52 h-52 drop-shadow-md">
          {/* Background circle */}
          <div className="absolute inset-0 rounded-full border-[10px] border-gray-200 shadow-inner" aria-hidden="true"></div>
          
          {/* Progress circle - using semi-circle */}
           <div
            className="absolute inset-0 rounded-full transition-all duration-500 ease-out overflow-hidden"
             aria-hidden="true"
           >
             <div
               className="absolute inset-0"
               style={{
                 background: `conic-gradient(from -90deg, ${emotionIntensity >= 80 ? '#ef4444' : emotionIntensity >= 60 ? '#f97316' : emotionIntensity >= 40 ? '#f59e0b' : emotionIntensity >= 20 ? '#22c55e' : '#3b82f6'} 0deg, ${emotionIntensity >= 80 ? '#ef4444' : emotionIntensity >= 60 ? '#f97316' : emotionIntensity >= 40 ? '#f59e0b' : emotionIntensity >= 20 ? '#22c55e' : '#3b82f6'} ${rotation}deg, transparent ${rotation}deg)`,
                 clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)'
               }}
             ></div>
           </div>
          
          {/* Center content */}
          <div className="absolute inset-[20px] bg-white/90 backdrop-blur-sm rounded-full flex flex-col items-center justify-center shadow-lg z-10">
            <div className="text-4xl font-bold text-gray-800">{emotionIntensity}</div>
            <div className="text-xs text-gray-500 tracking-wide uppercase">intensity</div>
          </div>
          
          {/* Needle - positioned at center */}
           <div
            className="absolute top-1/2 left-1/2 w-1 h-24 bg-gray-800 rounded-full transition-transform duration-500 ease-out"
             style={{
               transform: `translate(-50%, -100%) rotate(${rotation - 90}deg)`,
               transformOrigin: 'bottom center'
             }}
             aria-hidden="true"
           >
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-800 rounded-full"></div>
           </div>
        </div>
      
        {/* Intensity label and description */}
        <div className="text-center w-full">
          <div className={`inline-flex items-center px-4 py-2 rounded-lg border border-neutral-200 bg-white text-[14px] font-semibold ${getColor(emotionIntensity)}`}>
            {getIntensityLabel(emotionIntensity)} Intensity
          </div>
          <div className={`mt-4 p-4 rounded-xl border ${getBgColor(emotionIntensity)}`}> 
            <p className="text-[14px] text-neutral-700 leading-relaxed">{emotionDescription}</p>
          </div>
        </div>
      
        {/* Communication tips for high intensity */}
        {emotionIntensity > 70 && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl w-full">
             <div className="flex items-start gap-3">
               <span className="text-amber-600 text-lg flex-shrink-0" aria-hidden="true">💡</span>
               <div>
                 <h4 className="font-semibold text-amber-800 text-[14px]">High Intensity Detected</h4>
                 <p className="text-[13px] text-amber-700 mt-1 leading-relaxed">
                   Consider taking a break, using calming techniques, or communicating in a quieter environment.
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
