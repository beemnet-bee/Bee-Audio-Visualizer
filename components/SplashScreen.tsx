import React from 'react';
import Icon from './Icon';

const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col items-center justify-center z-50 animate-fadeIn">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .animate-fadeIn { animation: fadeIn 0.8s ease-in-out forwards; }
        .animate-pulseLogo { animation: pulse 2.5s ease-in-out infinite; }
      `}</style>
      <div className="w-24 h-24 bg-blue-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30 mb-6 animate-pulseLogo">
        <Icon name="logo" className="w-20 h-20 text-white" />
      </div>
      <h1 className="text-3xl font-bold text-gray-800 tracking-wide">GB - Audio Visualizer</h1>
      <p className="text-md text-gray-500 mt-2">Crafting your soundscape...</p>
    </div>
  );
};

export default SplashScreen;
