import React, { useState } from 'react';
import Icon from './Icon';
import { VisualizerType, BarStyle } from './Visualizer';
import { TimedLyric } from '../App';

export interface LyricSettings {
    fontSize: number;
    fontColor: string;
    highlightColor: string;
    position: 'top' | 'middle' | 'bottom';
}

interface ControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onSeek: (value: number) => void;
  progress: number;
  duration: number;
  isReady: boolean;
  color: string;
  onColorChange: (color: string) => void;
  color2: string;
  onColor2Change: (color: string) => void;
  useGradient: boolean;
  onUseGradientChange: (use: boolean) => void;
  barCount: number;
  onBarCountChange: (count: number) => void;
  onFileChange: () => void;
  isRecording: boolean;
  onExport: () => void;
  visualizerType: VisualizerType;
  onVisualizerTypeChange: (type: VisualizerType) => void;
  smoothing: number;
  onSmoothingChange: (value: number) => void;
  onBackgroundChange: (file: File) => void;
  onClearBackground: () => void;
  hasBackground: boolean;
  backgroundColor: string;
  onBackgroundColorChange: (color: string) => void;
  backgroundOpacity: number;
  onBackgroundOpacityChange: (value: number) => void;
  backgroundBlur: number;
  onBackgroundBlurChange: (value: number) => void;
  barStyle: BarStyle;
  onBarStyleChange: (style: BarStyle) => void;
  timedLyrics: TimedLyric[];
  onTimedLyricsChange: (lyrics: TimedLyric[]) => void;
  lyricSettings: LyricSettings;
  onLyricSettingsChange: (settings: LyricSettings) => void;
  activeLyricIndex: number;
}

type ActiveTab = 'visualizer' | 'background' | 'lyrics';

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds === Infinity) {
    return '00:00';
  }
  const date = new Date(0);
  date.setSeconds(seconds);
  return date.toISOString().substr(14, 5);
};

const Controls: React.FC<ControlsProps> = (props) => {
  const { isPlaying, onPlayPause, onSeek, progress, duration, isReady, isRecording, onExport, onFileChange, timedLyrics, onTimedLyricsChange } = props;
  const [activeTab, setActiveTab] = useState<ActiveTab>('visualizer');
  const [lyricsText, setLyricsText] = useState('');

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => onSeek(Number(e.target.value));
  
  const handleLyricsParse = () => {
    const lines = lyricsText.split('\n').filter(line => line.trim() !== '');
    const newTimedLyrics = lines.map((line, index) => ({
        time: timedLyrics[index]?.time || 0,
        text: line,
    }));
    onTimedLyricsChange(newTimedLyrics);
  };

  const syncLyricTime = (index: number) => {
    const newLyrics = [...timedLyrics];
    newLyrics[index].time = progress;
    onTimedLyricsChange(newLyrics.sort((a,b) => a.time - b.time));
  };
  
  const TabButton: React.FC<{tab: ActiveTab, label: string}> = ({tab, label}) => (
      <button 
        onClick={() => setActiveTab(tab)} 
        className={`relative px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab ? 'text-white' : 'text-gray-400 hover:text-white'}`}
      >
        {activeTab === tab && <div className="absolute inset-0 bg-white/10 rounded-md -z-10"></div>}
        {label}
      </button>
  );

  return (
    <div className="space-y-6">
      {/* Progress Bar & Timestamps */}
      <div className="flex items-center space-x-4">
        <span className="text-xs font-mono text-gray-400 w-12 text-center">{formatTime(progress)}</span>
        <input type="range" min="0" max={duration || 1} value={progress} onChange={handleSeekChange} disabled={!isReady || isRecording}
          className="w-full appearance-none cursor-pointer progress-bar disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <span className="text-xs font-mono text-gray-400 w-12 text-center">{formatTime(duration)}</span>
      </div>

      {/* Main Player Controls */}
      <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={onFileChange} disabled={isRecording} title="Change audio file" className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm border border-white/10">
              <Icon name="change" className="w-5 h-5 text-gray-300" />
            </button>
            <button onClick={onPlayPause} disabled={!isReady || isRecording} className={`p-4 rounded-full text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-16 h-16 bg-gradient-to-br from-fuchsia-500 to-purple-600 shadow-lg shadow-fuchsia-500/40 hover:shadow-xl hover:shadow-fuchsia-500/60 ${isPlaying ? 'animate-pulse' : ''}`}>
              <Icon name={isPlaying ? 'pause' : 'play'} className="w-7 h-7" />
            </button>
          </div>
          <button onClick={onExport} disabled={!isReady || isRecording} title="Export visualization as video" className="flex items-center gap-2 px-5 py-3 rounded-lg bg-teal-500/80 text-white hover:bg-teal-500/100 transition-colors duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed backdrop-blur-sm border border-white/10 shadow-lg shadow-teal-500/20">
              <Icon name="export" className="w-5 h-5" />
              <span className="text-sm font-bold tracking-wider">{isRecording ? 'RECORDING...' : 'EXPORT'}</span>
          </button>
      </div>

      {/* Settings Tabs */}
      <div className="p-1.5 bg-black/20 rounded-lg flex items-center justify-center space-x-2">
        <TabButton tab="visualizer" label="Visualizer"/>
        <TabButton tab="background" label="Background"/>
        <TabButton tab="lyrics" label="Lyrics"/>
      </div>
      
      {/* Settings Panels */}
      <fieldset disabled={isRecording} className="pt-2">
        {activeTab === 'visualizer' && <VisualizerSettings {...props} />}
        {activeTab === 'background' && <BackgroundSettings {...props} />}
        {activeTab === 'lyrics' && <LyricsSettings {...props} lyricsText={lyricsText} onLyricsTextChange={setLyricsText} onLyricsParse={handleLyricsParse} onSyncLyricTime={syncLyricTime} />}
      </fieldset>
    </div>
  );
};

const SettingGroup: React.FC<{title: string, children: React.ReactNode}> = ({title, children}) => (
    <div className="col-span-1 md:col-span-2 lg:col-span-3 border-t border-white/10 pt-4 mt-4 first:mt-0 first:pt-0 first:border-0">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            {children}
        </div>
    </div>
);

const FormLabel: React.FC<{htmlFor?: string, children: React.ReactNode, value?: string | number}> = ({htmlFor, children, value}) => (
    <label htmlFor={htmlFor} className="text-sm font-medium text-gray-300 flex justify-between items-center">
        <span>{children}</span>
        {value !== undefined && <span className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded">{value}</span>}
    </label>
);

const Select: React.FC<{value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, children: React.ReactNode}> = ({value, onChange, children}) => (
    <select value={value} onChange={onChange} className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-lg focus:ring-fuchsia-500 focus:border-fuchsia-500 p-2.5">
        {children}
    </select>
);

const VisualizerSettings: React.FC<ControlsProps> = ({ 
    visualizerType, onVisualizerTypeChange, barCount, onBarCountChange, 
    smoothing, onSmoothingChange, barStyle, onBarStyleChange,
    color, onColorChange, color2, onColor2Change, useGradient, onUseGradientChange
}) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <SettingGroup title="Shape & Style">
            <div className="space-y-2">
                <FormLabel>Style</FormLabel>
                <Select value={visualizerType} onChange={(e) => onVisualizerTypeChange(e.target.value as VisualizerType)}>
                    <option value="bar">Bars</option>
                    <option value="bar-center">Centered Bars</option>
                    <option value="circle">Circle</option>
                    <option value="wave">Wave</option>
                    <option value="wave-fill">Wave (Fill)</option>
                </Select>
            </div>
            { (visualizerType.includes('bar') || visualizerType.includes('circle')) && 
                <div className="space-y-2">
                    <FormLabel htmlFor="bar-count" value={barCount}>Bars</FormLabel>
                    <input id="bar-count" type="range" min="32" max="256" step="16" value={barCount} onChange={(e) => onBarCountChange(Number(e.target.value))} />
                </div>
            }
            { visualizerType.includes('bar') &&
                <div className="space-y-2">
                    <FormLabel>Bar Style</FormLabel>
                    <Select value={barStyle} onChange={(e) => onBarStyleChange(e.target.value as BarStyle)}>
                        <option value="rounded">Rounded</option>
                        <option value="sharp">Sharp</option>
                    </Select>
                </div>
            }
             <div className="space-y-2">
                <FormLabel htmlFor="smoothing" value={smoothing.toFixed(2)}>Smoothing</FormLabel>
                <input id="smoothing" type="range" min="0" max="0.95" step="0.05" value={smoothing} onChange={(e) => onSmoothingChange(Number(e.target.value))} />
            </div>
        </SettingGroup>
        
        <SettingGroup title="Color">
            <div className="space-y-2 col-span-1 md:col-span-2">
                <div className="flex items-center gap-4 p-2 bg-black/20 rounded-lg">
                    <input type="checkbox" id="gradient-toggle" checked={useGradient} onChange={(e) => onUseGradientChange(e.target.checked)} className="w-4 h-4 text-fuchsia-600 bg-gray-700 border-gray-600 rounded focus:ring-fuchsia-600 "/>
                    <label htmlFor="gradient-toggle" className="text-sm text-gray-300 font-medium">Gradient</label>
                    <div className="w-8 h-8 rounded-md overflow-hidden border-2 border-white/20"><input id="color-picker" type="color" value={color} onChange={(e) => onColorChange(e.target.value)} className="w-12 h-12 -translate-x-2 -translate-y-2 cursor-pointer" /></div>
                    {useGradient && <div className="w-8 h-8 rounded-md overflow-hidden border-2 border-white/20"><input id="color-picker-2" type="color" value={color2} onChange={(e) => onColor2Change(e.target.value)} className="w-12 h-12 -translate-x-2 -translate-y-2 cursor-pointer" /></div>}
                </div>
            </div>
        </SettingGroup>
    </div>
);

const BackgroundSettings: React.FC<ControlsProps> = ({
    onBackgroundChange, onClearBackground, hasBackground, backgroundColor,
    onBackgroundColorChange, backgroundOpacity, onBackgroundOpacityChange,
    backgroundBlur, onBackgroundBlurChange
}) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div className="space-y-2">
            <FormLabel>Background Image</FormLabel>
            <div className="flex items-center gap-2">
                <label htmlFor="bg-upload" className="flex-grow text-center px-4 py-2.5 text-sm font-medium text-white bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors border border-white/10">
                    Upload Image
                </label>
                <input id="bg-upload" type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && onBackgroundChange(e.target.files[0])} />
                {hasBackground && (
                    <button onClick={onClearBackground} className="p-2.5 rounded-full bg-red-800/50 hover:bg-red-700/50 transition-colors border border-white/10" title="Remove background">
                        <Icon name="close" className="w-5 h-5 text-gray-300"/>
                    </button>
                )}
            </div>
        </div>
        <div className="space-y-2">
             <FormLabel>Background Color</FormLabel>
             <input type="color" value={backgroundColor} onChange={(e) => onBackgroundColorChange(e.target.value)} className="w-full h-11 p-0 border-0 bg-transparent rounded cursor-pointer"/>
        </div>
        <div className="space-y-2">
            <FormLabel htmlFor="bg-opacity" value={backgroundOpacity.toFixed(2)}>Image Opacity</FormLabel>
            <input id="bg-opacity" type="range" min="0" max="1" step="0.05" value={backgroundOpacity} onChange={(e) => onBackgroundOpacityChange(Number(e.target.value))} />
        </div>
        <div className="space-y-2">
            <FormLabel htmlFor="bg-blur" value={`${backgroundBlur}px`}>Image Blur</FormLabel>
            <input id="bg-blur" type="range" min="0" max="20" step="1" value={backgroundBlur} onChange={(e) => onBackgroundBlurChange(Number(e.target.value))} />
        </div>
    </div>
);

interface LyricsSettingsProps extends ControlsProps {
    lyricsText: string;
    onLyricsTextChange: (text: string) => void;
    onLyricsParse: () => void;
    onSyncLyricTime: (index: number) => void;
}

const LyricsSettings: React.FC<LyricsSettingsProps> = ({
    timedLyrics, lyricSettings, onLyricSettingsChange, lyricsText, onLyricsTextChange, onLyricsParse, onSyncLyricTime, activeLyricIndex
}) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
            <div className="space-y-2">
                <FormLabel htmlFor="lyrics-input">Paste Lyrics</FormLabel>
                <textarea id="lyrics-input" rows={8} value={lyricsText} onChange={(e) => onLyricsTextChange(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-gray-200 text-sm rounded-lg focus:ring-fuchsia-500 focus:border-fuchsia-500 p-2.5"
                    placeholder="Paste your lyrics here, one line per entry..."
                />
            </div>
            <button onClick={onLyricsParse} className="w-full px-4 py-2.5 text-sm font-bold tracking-wider text-white bg-fuchsia-600 rounded-lg hover:bg-fuchsia-500 transition-colors">
                LOAD LYRICS
            </button>
        </div>
        <div className="space-y-2">
             <FormLabel>Synced Lyrics Editor</FormLabel>
             <div className="h-80 overflow-y-auto bg-black/20 rounded-lg p-2 space-y-2 border border-white/10">
                {timedLyrics.length > 0 ? timedLyrics.map((lyric, index) => (
                    <div key={index} className={`flex items-center gap-2 p-2 rounded transition-colors ${activeLyricIndex === index ? 'bg-fuchsia-500/30' : 'hover:bg-white/5'}`}>
                        <button onClick={() => onSyncLyricTime(index)} title="Sync to current time" className="p-1.5 rounded bg-white/10 hover:bg-white/20"><Icon name="clock" className="w-4 h-4 text-fuchsia-300"/></button>
                        <span className="text-xs font-mono text-gray-400">{formatTime(lyric.time)}</span>
                        <p className="text-sm text-gray-200 flex-grow truncate">{lyric.text}</p>
                    </div>
                )) : <p className="text-sm text-gray-500 text-center p-4 h-full flex items-center justify-center">Load lyrics to start syncing</p>}
             </div>
        </div>
        <div className="space-y-2">
            <FormLabel htmlFor="font-size" value={`${lyricSettings.fontSize}px`}>Font Size</FormLabel>
            <input id="font-size" type="range" min="12" max="64" step="1" value={lyricSettings.fontSize} onChange={(e) => onLyricSettingsChange({...lyricSettings, fontSize: Number(e.target.value)})} />
        </div>
        <div className="space-y-2">
            <FormLabel>Position</FormLabel>
            <Select value={lyricSettings.position} onChange={(e) => onLyricSettingsChange({...lyricSettings, position: e.target.value as LyricSettings['position']})}>
                <option value="top">Top</option>
                <option value="middle">Middle</option>
                <option value="bottom">Bottom</option>
            </Select>
        </div>
        <div className="space-y-2 col-span-1 lg:col-span-2">
             <FormLabel>Colors</FormLabel>
             <div className="flex items-center gap-4 p-2 bg-black/20 rounded-lg">
                <label htmlFor="font-color" className="text-sm text-gray-300 font-medium">Font:</label>
                <div className="w-8 h-8 rounded-md overflow-hidden border-2 border-white/20"><input id="font-color" type="color" value={lyricSettings.fontColor} onChange={(e) => onLyricSettingsChange({...lyricSettings, fontColor: e.target.value})} className="w-12 h-12 -translate-x-2 -translate-y-2 cursor-pointer" /></div>
                 <label htmlFor="highlight-color" className="text-sm text-gray-300 font-medium">Highlight:</label>
                <div className="w-8 h-8 rounded-md overflow-hidden border-2 border-white/20"><input id="highlight-color" type="color" value={lyricSettings.highlightColor} onChange={(e) => onLyricSettingsChange({...lyricSettings, highlightColor: e.target.value})} className="w-12 h-12 -translate-x-2 -translate-y-2 cursor-pointer" /></div>
            </div>
        </div>
    </div>
);

export default Controls;