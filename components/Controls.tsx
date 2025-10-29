import React, { useState } from 'react';
import Icon from './Icon';
import { VisualizerType, BarStyle } from './Visualizer';
import { TimedLyric, Resolution } from '../App';

export interface LyricSettings {
    fontSize: number;
    fontColor: string;
    highlightColor: string;
    positionY: number; // 0-100
    positionX: number; // 0-100
    fontFamily: string;
}

export interface LogoSettings {
    size: number;
    opacity: number;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
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
  resolution: Resolution;
  onResolutionChange: (res: Resolution) => void;
  visualizerPosition: number;
  onVisualizerPositionChange: (pos: number) => void;
  // New props for Overlays
  onLogoChange: (file: File) => void;
  onClearLogo: () => void;
  hasLogo: boolean;
  logoSettings: LogoSettings;
  onLogoSettingsChange: (settings: LogoSettings) => void;
  showTimer: boolean;
  onShowTimerChange: (show: boolean) => void;
  showProgressBar: string;
  onShowProgressBarChange: (pos: string) => void;
}

type ActiveTab = 'visualizer' | 'background' | 'lyrics' | 'overlays' | 'output';

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
  
  const TabButton: React.FC<{tab: ActiveTab, label: string, icon: React.ReactElement}> = ({tab, label, icon}) => (
    <button onClick={() => setActiveTab(tab)} 
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${activeTab === tab ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'}`}>
        {icon}
        {label}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Progress Bar & Timestamps */}
      <div className="flex items-center space-x-4">
        <span className="text-xs font-mono text-gray-500 w-12 text-center">{formatTime(progress)}</span>
        <input type="range" min="0" max={duration || 1} value={progress} onChange={handleSeekChange} disabled={!isReady || isRecording}
          className="w-full appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <span className="text-xs font-mono text-gray-500 w-12 text-center">{formatTime(duration)}</span>
      </div>

      {/* Main Player Controls */}
      <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button onClick={onFileChange} disabled={isRecording} title="Change audio file" className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200">
              <Icon name="change" className="w-5 h-5 text-gray-600" />
            </button>
             <button onClick={onExport} disabled={!isReady || isRecording} title="Export visualization as video" className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-500 text-white hover:bg-teal-600 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed border border-teal-600 shadow-sm">
              <Icon name="export" className="w-5 h-5" />
              <span className="text-sm font-bold tracking-wider">{isRecording ? 'RECORDING...' : 'EXPORT'}</span>
          </button>
          </div>
          <button onClick={onPlayPause} disabled={!isReady || isRecording} className="p-4 rounded-full text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-16 h-16 bg-blue-500 shadow-lg shadow-blue-500/40 hover:bg-blue-600">
            <Icon name={isPlaying ? 'pause' : 'play'} className="w-7 h-7" />
          </button>
      </div>

      {/* Settings Tabs */}
      <div className="p-1.5 bg-gray-100 rounded-lg flex items-center justify-center space-x-1 md:space-x-2 border border-gray-200">
        <TabButton tab="visualizer" label="Visualizer" icon={<Icon name="visualizer" className="w-4 h-4"/>}/>
        <TabButton tab="background" label="Background" icon={<Icon name="image" className="w-4 h-4"/>}/>
        <TabButton tab="lyrics" label="Lyrics" icon={<Icon name="lyrics" className="w-4 h-4"/>}/>
        <TabButton tab="overlays" label="Overlays" icon={<Icon name="layers" className="w-4 h-4"/>}/>
        <TabButton tab="output" label="Output" icon={<Icon name="screen" className="w-4 h-4"/>}/>
      </div>
      
      {/* Settings Panels */}
      <fieldset disabled={isRecording} className="pt-2">
        {activeTab === 'visualizer' && <VisualizerSettings {...props} />}
        {activeTab === 'background' && <BackgroundSettings {...props} />}
        {activeTab === 'lyrics' && <LyricsSettings {...props} lyricsText={lyricsText} onLyricsTextChange={setLyricsText} onLyricsParse={handleLyricsParse} onSyncLyricTime={syncLyricTime} />}
        {activeTab === 'overlays' && <OverlaysSettings {...props} />}
        {activeTab === 'output' && <OutputSettings {...props} />}
      </fieldset>
    </div>
  );
};

const SettingGroup: React.FC<{title: string, children: React.ReactNode}> = ({title, children}) => (
    <div className="col-span-1 md:col-span-2 lg:col-span-3 border-t border-gray-200 pt-4 mt-4 first:mt-0 first:pt-0 first:border-0">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            {children}
        </div>
    </div>
);

const FormLabel: React.FC<{htmlFor?: string, children: React.ReactNode, value?: string | number}> = ({htmlFor, children, value}) => (
    <label htmlFor={htmlFor} className="text-sm font-medium text-gray-700 flex justify-between items-center">
        <span>{children}</span>
        {value !== undefined && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">{value}</span>}
    </label>
);

const Select: React.FC<{value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, children: React.ReactNode}> = ({value, onChange, children}) => (
    <select value={value} onChange={onChange} className="w-full bg-white border border-gray-300 text-gray-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 pr-10 appearance-none bg-no-repeat bg-[position:right_0.7rem_center] bg-[size:1.2em_1.2em] bg-[url('data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%23007BFF%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e')]">
        {children}
    </select>
);

const VisualizerSettings: React.FC<ControlsProps> = ({ 
    visualizerType, onVisualizerTypeChange, barCount, onBarCountChange, 
    smoothing, onSmoothingChange, barStyle, onBarStyleChange,
    color, onColorChange, color2, onColor2Change, useGradient, onUseGradientChange,
    visualizerPosition, onVisualizerPositionChange
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
                    <option value="particles">Particles</option>
                    <option value="progress-wave">Progress Wave</option>
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
                <FormLabel htmlFor="smoothing" value={smoothing.toFixed(2)}>Responsiveness</FormLabel>
                <input id="smoothing" type="range" min="0" max="0.95" step="0.05" value={smoothing} onChange={(e) => onSmoothingChange(Number(e.target.value))} />
            </div>
        </SettingGroup>

         <SettingGroup title="Position">
            <div className="space-y-2">
                <FormLabel htmlFor="vis-position" value={`${visualizerPosition}%`}>Vertical Position</FormLabel>
                <input id="vis-position" type="range" min="0" max="100" step="1" value={visualizerPosition} onChange={(e) => onVisualizerPositionChange(Number(e.target.value))} />
            </div>
        </SettingGroup>
        
        <SettingGroup title="Color">
            <div className="space-y-2 col-span-1 md:col-span-2">
                <div className="flex items-center gap-4 p-2 bg-gray-100 rounded-lg border border-gray-200">
                    <input type="checkbox" id="gradient-toggle" checked={useGradient} onChange={(e) => onUseGradientChange(e.target.checked)} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"/>
                    <label htmlFor="gradient-toggle" className="text-sm text-gray-700 font-medium">Gradient</label>
                    <div className="w-8 h-8 rounded-md overflow-hidden border-2 border-gray-300"><input id="color-picker" type="color" value={color} onChange={(e) => onColorChange(e.target.value)} className="w-12 h-12 -translate-x-2 -translate-y-2 cursor-pointer" /></div>
                    {useGradient && <div className="w-8 h-8 rounded-md overflow-hidden border-2 border-gray-300"><input id="color-picker-2" type="color" value={color2} onChange={(e) => onColor2Change(e.target.value)} className="w-12 h-12 -translate-x-2 -translate-y-2 cursor-pointer" /></div>}
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
                <label htmlFor="bg-upload" className="flex-grow text-center px-4 py-2.5 text-sm font-medium text-gray-800 bg-white rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border border-gray-300">
                    Upload Image
                </label>
                <input id="bg-upload" type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && onBackgroundChange(e.target.files[0])} />
                {hasBackground && (
                    <button onClick={onClearBackground} className="p-2.5 rounded-full bg-red-100 hover:bg-red-200 transition-colors border border-gray-300" title="Remove background">
                        <Icon name="close" className="w-5 h-5 text-red-600"/>
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
        <div className="space-y-4 col-span-1 lg:col-span-2">
             <SettingGroup title="Editor">
                <div className="space-y-4 col-span-1 lg:col-span-2">
                    <div className="space-y-2">
                        <FormLabel htmlFor="lyrics-input">Paste Lyrics</FormLabel>
                        <textarea id="lyrics-input" rows={6} value={lyricsText} onChange={(e) => onLyricsTextChange(e.target.value)}
                            className="w-full bg-white border border-gray-300 text-gray-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
                            placeholder="Paste your lyrics here, one line per entry..."
                        />
                    </div>
                    <button onClick={onLyricsParse} className="w-full px-4 py-2.5 text-sm font-bold tracking-wider text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors">
                        LOAD LYRICS
                    </button>
                </div>
                 <div className="space-y-2 col-span-1 lg:col-span-1">
                     <FormLabel>Synced Lyrics Editor</FormLabel>
                     <div className="h-64 overflow-y-auto bg-gray-50 rounded-lg p-2 space-y-2 border border-gray-200">
                        {timedLyrics.length > 0 ? timedLyrics.map((lyric, index) => (
                            <div key={index} className={`flex items-center gap-2 p-2 rounded transition-colors ${activeLyricIndex === index ? 'bg-blue-100' : 'hover:bg-gray-100'}`}>
                                <button onClick={() => onSyncLyricTime(index)} title="Sync to current time" className="p-1.5 rounded bg-white hover:bg-gray-100 border border-gray-200"><Icon name="clock" className="w-4 h-4 text-blue-500"/></button>
                                <span className="text-xs font-mono text-gray-500">{formatTime(lyric.time)}</span>
                                <p className="text-sm text-gray-700 flex-grow truncate">{lyric.text}</p>
                            </div>
                        )) : <p className="text-sm text-gray-400 text-center p-4 h-full flex items-center justify-center">Load lyrics to start syncing</p>}
                     </div>
                </div>
            </SettingGroup>
        </div>
        <div className="col-span-1 lg:col-span-2">
            <SettingGroup title="Styling & Position">
                 <div className="space-y-2">
                    <FormLabel htmlFor="font-family">Font Family</FormLabel>
                    <Select value={lyricSettings.fontFamily} onChange={(e) => onLyricSettingsChange({...lyricSettings, fontFamily: e.target.value})}>
                        <option value="Ubuntu, sans-serif">Ubuntu (Default)</option>
                        <option value="'Roboto Mono', monospace">Roboto Mono</option>
                        <option value="'Press Start 2P', cursive">Press Start 2P (Retro)</option>
                        <option value="'Lobster', cursive">Lobster (Cursive)</option>
                    </Select>
                </div>
                <div className="space-y-2">
                    <FormLabel htmlFor="font-size" value={`${lyricSettings.fontSize}px`}>Font Size</FormLabel>
                    <input id="font-size" type="range" min="12" max="128" step="1" value={lyricSettings.fontSize} onChange={(e) => onLyricSettingsChange({...lyricSettings, fontSize: Number(e.target.value)})} />
                </div>
                <div className="space-y-2 col-span-1 md:col-span-2 lg:col-span-3">
                     <FormLabel>Colors</FormLabel>
                     <div className="flex items-center gap-4 p-2 bg-gray-100 rounded-lg border border-gray-200">
                        <label htmlFor="font-color" className="text-sm text-gray-700 font-medium">Font:</label>
                        <div className="w-8 h-8 rounded-md overflow-hidden border-2 border-gray-300"><input id="font-color" type="color" value={lyricSettings.fontColor} onChange={(e) => onLyricSettingsChange({...lyricSettings, fontColor: e.target.value})} className="w-12 h-12 -translate-x-2 -translate-y-2 cursor-pointer" /></div>
                         <label htmlFor="highlight-color" className="text-sm text-gray-700 font-medium">Highlight:</label>
                        <div className="w-8 h-8 rounded-md overflow-hidden border-2 border-gray-300"><input id="highlight-color" type="color" value={lyricSettings.highlightColor} onChange={(e) => onLyricSettingsChange({...lyricSettings, highlightColor: e.target.value})} className="w-12 h-12 -translate-x-2 -translate-y-2 cursor-pointer" /></div>
                    </div>
                </div>
                <div className="space-y-2">
                    <FormLabel htmlFor="lyric-pos-y" value={`${lyricSettings.positionY}%`}>Vertical Position</FormLabel>
                    <input id="lyric-pos-y" type="range" min="0" max="100" step="1" value={lyricSettings.positionY} onChange={(e) => onLyricSettingsChange({...lyricSettings, positionY: Number(e.target.value)})} />
                </div>
                 <div className="space-y-2">
                    <FormLabel htmlFor="lyric-pos-x" value={`${lyricSettings.positionX}%`}>Horizontal Position</FormLabel>
                    <input id="lyric-pos-x" type="range" min="0" max="100" step="1" value={lyricSettings.positionX} onChange={(e) => onLyricSettingsChange({...lyricSettings, positionX: Number(e.target.value)})} />
                </div>
            </SettingGroup>
        </div>
    </div>
);

const OverlaysSettings: React.FC<ControlsProps> = ({
    onLogoChange, onClearLogo, hasLogo, logoSettings, onLogoSettingsChange,
    showTimer, onShowTimerChange, showProgressBar, onShowProgressBarChange
}) => (
    <div>
        <SettingGroup title="Logo Watermark">
            <div className="space-y-2">
                <FormLabel>Logo Image</FormLabel>
                <div className="flex items-center gap-2">
                    <label htmlFor="logo-upload" className="flex-grow text-center px-4 py-2.5 text-sm font-medium text-gray-800 bg-white rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border border-gray-300">
                        Upload Logo
                    </label>
                    <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && onLogoChange(e.target.files[0])} />
                    {hasLogo && (
                        <button onClick={onClearLogo} className="p-2.5 rounded-full bg-red-100 hover:bg-red-200 transition-colors border border-gray-300" title="Remove logo">
                            <Icon name="close" className="w-5 h-5 text-red-600"/>
                        </button>
                    )}
                </div>
            </div>
            <div className="space-y-2">
                <FormLabel htmlFor="logo-size" value={`${logoSettings.size}%`}>Size</FormLabel>
                <input id="logo-size" type="range" min="1" max="50" step="1" value={logoSettings.size} onChange={(e) => onLogoSettingsChange({...logoSettings, size: Number(e.target.value)})} />
            </div>
             <div className="space-y-2">
                <FormLabel htmlFor="logo-opacity" value={`${logoSettings.opacity}%`}>Opacity</FormLabel>
                <input id="logo-opacity" type="range" min="0" max="100" step="1" value={logoSettings.opacity} onChange={(e) => onLogoSettingsChange({...logoSettings, opacity: Number(e.target.value)})} />
            </div>
            <div className="space-y-2">
                <FormLabel>Position</FormLabel>
                <Select value={logoSettings.position} onChange={(e) => onLogoSettingsChange({...logoSettings, position: e.target.value as LogoSettings['position']})}>
                    <option value="top-left">Top Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-right">Bottom Right</option>
                    <option value="center">Center</option>
                </Select>
            </div>
        </SettingGroup>
        <SettingGroup title="Canvas Elements">
            <div className="space-y-2">
                <FormLabel>Timer</FormLabel>
                <div className="flex items-center p-2 bg-gray-100 rounded-lg border border-gray-200">
                    <input type="checkbox" id="timer-toggle" checked={showTimer} onChange={(e) => onShowTimerChange(e.target.checked)} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"/>
                    <label htmlFor="timer-toggle" className="ml-2 text-sm text-gray-700 font-medium">Show Timer on Canvas</label>
                </div>
            </div>
             <div className="space-y-2">
                <FormLabel>Progress Bar</FormLabel>
                 <Select value={showProgressBar} onChange={(e) => onShowProgressBarChange(e.target.value)}>
                    <option value="none">None</option>
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                </Select>
            </div>
        </SettingGroup>
    </div>
);


const OutputSettings: React.FC<ControlsProps> = ({ resolution, onResolutionChange }) => {
    
    const ASPECT_RATIOS: {[key: string]: {w: number, h: number}} = {
        '16:9': { w: 16, h: 9 }, '9:16': { w: 9, h: 16 }, '1:1':  { w: 1, h: 1 }, '4:3':  { w: 4, h: 3 },
    };
    const RESOLUTION_PRESETS: {[key: string]: number} = { '720p': 720, '1080p': 1080, '1440p': 1440, '4K': 2160 };

    const handleAspectRatioChange = (aspectRatioKey: string) => {
        const ratio = ASPECT_RATIOS[aspectRatioKey];
        const currentHeightName = Object.keys(RESOLUTION_PRESETS).find(key => RESOLUTION_PRESETS[key] === (ratio.w > ratio.h ? resolution.height : resolution.width)) || '1080p';
        const height = RESOLUTION_PRESETS[currentHeightName];
        if (ratio.w > ratio.h) onResolutionChange({ width: Math.round(height * (ratio.w / ratio.h)), height: height });
        else onResolutionChange({ width: height, height: Math.round(height * (ratio.h / ratio.w)) });
    };
    
    const handleResolutionPresetChange = (presetKey: string) => {
        const height = RESOLUTION_PRESETS[presetKey];
        const currentRatio = resolution.width / resolution.height;
        onResolutionChange({ width: Math.round(height * currentRatio), height: height });
    };

    const currentAspectRatioKey = Object.keys(ASPECT_RATIOS).find(key => Math.abs((resolution.width / resolution.height) - (ASPECT_RATIOS[key].w / ASPECT_RATIOS[key].h)) < 0.01) || '16:9';
    const isPortrait = resolution.width < resolution.height;
    const currentPresetKey = Object.keys(RESOLUTION_PRESETS).find(key => RESOLUTION_PRESETS[key] === (isPortrait ? resolution.width : resolution.height)) || '1080p';
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <FormLabel>Aspect Ratio</FormLabel>
                <Select value={currentAspectRatioKey} onChange={(e) => handleAspectRatioChange(e.target.value)}>
                    <option value="16:9">16:9 (Landscape)</option>
                    <option value="9:16">9:16 (Portrait)</option>
                    <option value="1:1">1:1 (Square)</option>
                    <option value="4:3">4:3 (Classic)</option>
                </Select>
            </div>
            <div className="space-y-2">
                <FormLabel>Resolution</FormLabel>
                 <Select value={currentPresetKey} onChange={(e) => handleResolutionPresetChange(e.target.value)}>
                    <option value="720p">720p (HD)</option>
                    <option value="1080p">1080p (Full HD)</option>
                    <option value="1440p">1440p (2K)</option>
                    <option value="4K">4K (Ultra HD)</option>
                </Select>
            </div>
            <div className="col-span-1 md:col-span-2 bg-gray-100 p-3 rounded-lg text-center border border-gray-200">
                <p className="text-sm text-gray-500">Final Output Size: <span className="font-bold text-blue-600">{resolution.width}px &times; {resolution.height}px</span></p>
            </div>
        </div>
    );
};


export default Controls;