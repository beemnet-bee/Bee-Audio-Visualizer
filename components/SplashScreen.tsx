import React from 'react';
import Icon from './Icon';

const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-50 transition-opacity duration-500">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-blue-100 to-indigo-200"></div>
      <style>{`
        @keyframes scale-in {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
            animation: scale-in 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
      `}</style>
      <div className="relative z-10 text-center animate-scale-in">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30 mb-6 mx-auto">
          <Icon name="logo" className="w-20 h-20 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 tracking-wide">GB - Audio Visualizer</h1>
        <p className="text-md text-gray-500 mt-2">Crafting your soundscape...</p>
      </div>
    </div>
  );
};

export default SplashScreen;