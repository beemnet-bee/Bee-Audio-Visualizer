import React, { useState, useRef, useEffect } from 'react';
import Icon from './Icon';
import { VisualizerType, BarStyle, ParticleStyle } from './Visualizer';
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
  backgroundVignette: boolean;
  onBackgroundVignetteChange: (vignette: boolean) => void;
  backgroundNoise: number;
  onBackgroundNoiseChange: (noise: number) => void;
  barStyle: BarStyle;
  onBarStyleChange: (style: BarStyle) => void;
  particleStyle: ParticleStyle;
  onParticleStyleChange: (style: ParticleStyle) => void;
  timedLyrics: TimedLyric[];
  onTimedLyricsChange: (lyrics: TimedLyric[]) => void;
  lyricSettings: LyricSettings;
  onLyricSettingsChange: (settings: LyricSettings) => void;
  activeLyricIndex: number;
  resolution: Resolution;
  onResolutionChange: (res: Resolution) => void;
  visualizerPosition: number;
  onVisualizerPositionChange: (pos: number) => void;
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
  const [tabIndicatorStyle, setTabIndicatorStyle] = useState({});
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const activeTabIndex = ['visualizer', 'background', 'lyrics', 'overlays', 'output'].indexOf(activeTab);
    const activeTabEl = tabsRef.current[activeTabIndex];
    if (activeTabEl && tabsContainerRef.current) {
        const containerRect = tabsContainerRef.current.getBoundingClientRect();
        const tabRect = activeTabEl.getBoundingClientRect();
        setTabIndicatorStyle({
            left: `${tabRect.left - containerRect.left}px`,
            width: `${tabRect.width}px`,
        });
    }
  }, [activeTab]);

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
  
  const TabButton: React.FC<{tab: ActiveTab, label: string, icon: React.ReactElement, index: number}> = ({tab, label, icon, index}) => (
    // FIX: The ref callback should not return a value. Encapsulating the assignment in curly braces fixes this.
    <button ref={el => { tabsRef.current[index] = el; }} onClick={() => setActiveTab(tab)} 
        className={`relative z-10 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-300 w-full ${activeTab === tab ? 'text-white' : 'text-gray-600 hover:text-gray-800'}`}>
        {icon}
        <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-white/30 backdrop-blur-sm border border-white/20 shadow-lg">
        <div className="flex items-center space-x-4">
          <span className="text-xs font-mono text-gray-600 w-12 text-center">{formatTime(progress)}</span>
          <input type="range" min="0" max={duration || 1} value={progress} onChange={handleSeekChange} disabled={!isReady || isRecording}
            className="w-full appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <span className="text-xs font-mono text-gray-600 w-12 text-center">{formatTime(duration)}</span>
        </div>
        <div className="flex items-center justify-between gap-4 mt-4">
            <div className="flex items-center gap-2">
              <button onClick={onFileChange} disabled={isRecording} title="Change audio file" className="p-3 rounded-full bg-white/50 hover:bg-white/80 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 shadow active:scale-95">
                <Icon name="change" className="w-5 h-5 text-gray-700" />
              </button>
              <button onClick={onExport} disabled={!isReady || isRecording} title="Export visualization as video" className="flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-teal-400 to-cyan-500 text-white hover:opacity-90 transition-all duration-300 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed border border-white/20 shadow-lg active:scale-95">
                <Icon name="export" className="w-5 h-5" />
                <span className="text-sm font-bold tracking-wider">{isRecording ? 'RECORDING...' : 'EXPORT'}</span>
              </button>
            </div>
            <button onClick={onPlayPause} disabled={!isReady || isRecording} className={`p-4 rounded-full text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-purple-500/30 focus:outline-none focus:ring-4 focus:ring-blue-300 active:scale-95 ${isPlaying ? 'animate-pulse' : ''}`}>
              <Icon name={isPlaying ? 'pause' : 'play'} className="w-7 h-7" />
            </button>
        </div>
      </div>

      <div ref={tabsContainerRef} className="relative p-1.5 bg-white/40 backdrop-blur-sm rounded-xl flex items-center justify-center space-x-1 md:space-x-2 border border-white/20 shadow-md">
        <div className="absolute top-1.5 left-0 h-[calc(100%-0.75rem)] bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg shadow-lg transition-all duration-300 ease-in-out" style={tabIndicatorStyle}></div>
        <TabButton tab="visualizer" label="Visualizer" icon={<Icon name="visualizer" className="w-5 h-5"/>} index={0}/>
        <TabButton tab="background" label="Background" icon={<Icon name="image" className="w-5 h-5"/>} index={1}/>
        <TabButton tab="lyrics" label="Lyrics" icon={<Icon name="lyrics" className="w-5 h-5"/>} index={2}/>
        <TabButton tab="overlays" label="Overlays" icon={<Icon name="layers" className="w-5 h-5"/>} index={3}/>
        <TabButton tab="output" label="Output" icon={<Icon name="screen" className="w-5 h-5"/>} index={4}/>
      </div>
      
      <fieldset disabled={isRecording} className="pt-2">
        <div className="p-5 rounded-xl bg-white/30 backdrop-blur-sm border border-white/20 shadow-lg">
          {activeTab === 'visualizer' && <VisualizerSettings {...props} />}
          {activeTab === 'background' && <BackgroundSettings {...props} />}
          {activeTab === 'lyrics' && <LyricsSettings {...props} lyricsText={lyricsText} onLyricsTextChange={setLyricsText} onLyricsParse={handleLyricsParse} onSyncLyricTime={syncLyricTime} />}
          {activeTab === 'overlays' && <OverlaysSettings {...props} />}
          {activeTab === 'output' && <OutputSettings {...props} />}
        </div>
      </fieldset>
    </div>
  );
};

const SettingGroup: React.FC<{title: string, children: React.ReactNode}> = ({title, children}) => (
    <div className="col-span-1 md:col-span-2 lg:col-span-3 border-t border-white/30 pt-4 mt-4 first:mt-0 first:pt-0 first:border-0">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            {children}
        </div>
    </div>
);

const FormLabel: React.FC<{htmlFor?: string; children: React.ReactNode; value?: string | number}> = ({htmlFor, children, value}) => (
    <label htmlFor={htmlFor} className="text-sm font-medium text-gray-700 flex justify-between items-center">
        <span>{children}</span>
        {value !== undefined && <span className="text-xs text-gray-500 font-mono bg-white/20 px-1.5 py-0.5 rounded">{value}</span>}
    </label>
);

const FormControl: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex flex-col space-y-1.5">{children}</div>
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select {...props} className={`w-full p-2.5 rounded-lg text-sm text-gray-800 border border-white/20 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all duration-200 ${props.className}`} />
);

const VisualizerSettings: React.FC<ControlsProps> = (props) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
        <FormControl>
            <FormLabel htmlFor="vis-type">Style</FormLabel>
            <Select id="vis-type" value={props.visualizerType} onChange={e => props.onVisualizerTypeChange(e.target.value as VisualizerType)}>
                <option value="bar">Bars</option>
                <option value="bar-center">Bars (Center)</option>
                <option value="circle">Circle</option>
                <option value="wave">Wave</option>
                <option value="wave-fill">Wave (Fill)</option>
                <option value="particles">Particles</option>
                <option value="progress-wave">Progress Wave</option>
            </Select>
        </FormControl>

        {(props.visualizerType.startsWith('bar')) && (
            <FormControl>
                <FormLabel htmlFor="bar-style">Bar Style</FormLabel>
                <Select id="bar-style" value={props.barStyle} onChange={e => props.onBarStyleChange(e.target.value as BarStyle)}>
                    <option value="rounded">Rounded</option>
                    <option value="sharp">Sharp</option>
                    <option value="outline">Outline</option>
                </Select>
            </FormControl>
        )}
        
        {props.visualizerType === 'particles' && (
            <FormControl>
                <FormLabel htmlFor="particle-style">Particle Style</FormLabel>
                <Select id="particle-style" value={props.particleStyle} onChange={e => props.onParticleStyleChange(e.target.value as ParticleStyle)}>
                    <option value="burst">Burst</option>
                    <option value="fountain">Fountain</option>
                    <option value="gravity">Gravity</option>
                </Select>
            </FormControl>
        )}
        
        <SettingGroup title="Shape & Movement">
            { (props.visualizerType.startsWith('bar') || props.visualizerType === 'circle') &&
                <FormControl>
                    <FormLabel htmlFor="bar-count" value={props.barCount}>Bar Count</FormLabel>
                    <input type="range" id="bar-count" min="16" max="512" step="16" value={props.barCount} onChange={e => props.onBarCountChange(Number(e.target.value))} />
                </FormControl>
            }
            <FormControl>
                <FormLabel htmlFor="smoothing" value={props.smoothing.toFixed(2)}>Smoothing</FormLabel>
                <input type="range" id="smoothing" min="0" max="0.95" step="0.05" value={props.smoothing} onChange={e => props.onSmoothingChange(Number(e.target.value))} />
            </FormControl>
            <FormControl>
                <FormLabel htmlFor="vis-pos" value={`${props.visualizerPosition}%`}>Vertical Position</FormLabel>
                <input type="range" id="vis-pos" min="0" max="100" value={props.visualizerPosition} onChange={e => props.onVisualizerPositionChange(Number(e.target.value))} />
            </FormControl>
        </SettingGroup>
        
        <SettingGroup title="Color">
            <FormControl>
                <FormLabel htmlFor="color1">Primary Color</FormLabel>
                <input type="color" id="color1" value={props.color} onChange={e => props.onColorChange(e.target.value)} className="w-full h-10 p-1 bg-white/50 border border-white/20 rounded-lg cursor-pointer" />
            </FormControl>
            <FormControl>
                <FormLabel htmlFor="color2">Secondary Color</FormLabel>
                <input type="color" id="color2" value={props.color2} onChange={e => props.onColor2Change(e.target.value)} disabled={!props.useGradient} className="w-full h-10 p-1 bg-white/50 border border-white/20 rounded-lg cursor-pointer disabled:opacity-50" />
            </FormControl>
            <div className="flex items-center pt-6">
                <input type="checkbox" id="use-gradient" checked={props.useGradient} onChange={e => props.onUseGradientChange(e.target.checked)} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" />
                <label htmlFor="use-gradient" className="ml-2 text-sm font-medium text-gray-700">Use Gradient</label>
            </div>
        </SettingGroup>
    </div>
);

const BackgroundSettings: React.FC<ControlsProps> = (props) => {
    const bgInputRef = useRef<HTMLInputElement>(null);
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) props.onBackgroundChange(e.target.files[0]);
    };

    return (
        <div className="grid grid-cols-1">
            <SettingGroup title="Image">
                <div className="flex items-center space-x-2">
                    <input type="file" accept="image/*" ref={bgInputRef} onChange={handleFileSelect} className="hidden" />
                    <button onClick={() => bgInputRef.current?.click()} className="flex-1 text-sm font-semibold text-gray-700 bg-white/60 hover:bg-white/90 border border-white/20 rounded-lg px-4 py-2.5 transition-all duration-200 active:scale-95">
                        {props.hasBackground ? 'Change Image' : 'Upload Image'}
                    </button>
                    {props.hasBackground && (
                        <button onClick={props.onClearBackground} className="p-2.5 bg-red-500/20 hover:bg-red-500/40 rounded-lg transition-colors duration-200 active:scale-95">
                            <Icon name="close" className="w-5 h-5 text-red-700" />
                        </button>
                    )}
                </div>
                <FormControl>
                    <FormLabel htmlFor="bg-opacity" value={props.backgroundOpacity.toFixed(2)}>Image Opacity</FormLabel>
                    <input type="range" id="bg-opacity" min="0" max="1" step="0.05" value={props.backgroundOpacity} onChange={e => props.onBackgroundOpacityChange(Number(e.target.value))} disabled={!props.hasBackground} />
                </FormControl>
                <FormControl>
                    <FormLabel htmlFor="bg-blur" value={`${props.backgroundBlur}px`}>Image Blur</FormLabel>
                    <input type="range" id="bg-blur" min="0" max="20" step="1" value={props.backgroundBlur} onChange={e => props.onBackgroundBlurChange(Number(e.target.value))} disabled={!props.hasBackground} />
                </FormControl>
            </SettingGroup>
            
            <SettingGroup title="Effects">
                <FormControl>
                    <FormLabel htmlFor="bg-color">Fallback Color</FormLabel>
                    <input type="color" id="bg-color" value={props.backgroundColor} onChange={e => props.onBackgroundColorChange(e.target.value)} className="w-full h-10 p-1 bg-white/50 border border-white/20 rounded-lg cursor-pointer" />
                </FormControl>
                <FormControl>
                    <FormLabel htmlFor="bg-noise" value={props.backgroundNoise.toFixed(2)}>Animated Grain</FormLabel>
                    <input type="range" id="bg-noise" min="0" max="0.3" step="0.01" value={props.backgroundNoise} onChange={e => props.onBackgroundNoiseChange(Number(e.target.value))} />
                </FormControl>
                <div className="flex items-center pt-6">
                    <input type="checkbox" id="bg-vignette" checked={props.backgroundVignette} onChange={e => props.onBackgroundVignetteChange(e.target.checked)} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" />
                    <label htmlFor="bg-vignette" className="ml-2 text-sm font-medium text-gray-700">Vignette</label>
                </div>
            </SettingGroup>
        </div>
    );
};

const LyricsSettings: React.FC<ControlsProps & {lyricsText: string, onLyricsTextChange: (text: string) => void, onLyricsParse: () => void, onSyncLyricTime: (index: number) => void}> = (props) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
                <SettingGroup title="Editor">
                    <div className="lg:col-span-3">
                        <textarea
                            value={props.lyricsText}
                            onChange={(e) => props.onLyricsTextChange(e.target.value)}
                            placeholder="Paste your lyrics here, one line per entry..."
                            className="w-full h-48 p-3 text-sm bg-white/50 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all duration-200"
                        ></textarea>
                        <button onClick={props.onLyricsParse} className="w-full mt-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 rounded-lg px-4 py-2.5 transition-all duration-200 active:scale-95">
                            Parse & Update Lyrics
                        </button>
                    </div>
                </SettingGroup>
                
                <SettingGroup title="Styling">
                    <FormControl>
                        <FormLabel htmlFor="font-family">Font</FormLabel>
                        <Select id="font-family" value={props.lyricSettings.fontFamily} onChange={e => props.onLyricSettingsChange({...props.lyricSettings, fontFamily: e.target.value})}>
                            <option value="Ubuntu, sans-serif">Ubuntu</option>
                            <option value="Roboto Mono, monospace">Roboto Mono</option>
                            <option value="Lobster, cursive">Lobster</option>
                            <option value="'Press Start 2P', cursive">Press Start 2P</option>
                        </Select>
                    </FormControl>
                    <FormControl>
                        <FormLabel htmlFor="font-size" value={`${props.lyricSettings.fontSize}px`}>Font Size</FormLabel>
                        <input type="range" id="font-size" min="12" max="100" value={props.lyricSettings.fontSize} onChange={e => props.onLyricSettingsChange({...props.lyricSettings, fontSize: Number(e.target.value)})} />
                    </FormControl>
                    <div className="col-span-1 md:col-span-2 lg:col-span-1 grid grid-cols-2 gap-4">
                        <FormControl>
                            <FormLabel htmlFor="font-color">Text</FormLabel>
                            <input type="color" id="font-color" value={props.lyricSettings.fontColor} onChange={e => props.onLyricSettingsChange({...props.lyricSettings, fontColor: e.target.value})} className="w-full h-10 p-1 bg-white/50 border border-white/20 rounded-lg cursor-pointer" />
                        </FormControl>
                        <FormControl>
                            <FormLabel htmlFor="highlight-color">Highlight</FormLabel>
                            <input type="color" id="highlight-color" value={props.lyricSettings.highlightColor.startsWith('rgba') ? '#ffffff' : props.lyricSettings.highlightColor} onChange={e => props.onLyricSettingsChange({...props.lyricSettings, highlightColor: e.target.value})} className="w-full h-10 p-1 bg-white/50 border border-white/20 rounded-lg cursor-pointer" />
                        </FormControl>
                    </div>
                    <FormControl>
                        <FormLabel htmlFor="lyric-pos-x" value={`${props.lyricSettings.positionX}%`}>Horizontal Position</FormLabel>
                        <input type="range" id="lyric-pos-x" min="0" max="100" value={props.lyricSettings.positionX} onChange={e => props.onLyricSettingsChange({...props.lyricSettings, positionX: Number(e.target.value)})} />
                    </FormControl>
                    <FormControl>
                        <FormLabel htmlFor="lyric-pos-y" value={`${props.lyricSettings.positionY}%`}>Vertical Position</FormLabel>
                        <input type="range" id="lyric-pos-y" min="0" max="100" value={props.lyricSettings.positionY} onChange={e => props.onLyricSettingsChange({...props.lyricSettings, positionY: Number(e.target.value)})} />
                    </FormControl>
                </SettingGroup>
            </div>
            
            <div className="max-h-[420px] overflow-y-auto pr-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Sync Timestamps</h3>
                <div className="space-y-2">
                    {props.timedLyrics.length > 0 ? props.timedLyrics.map((lyric, index) => (
                        <div key={index} className={`flex items-center justify-between p-2 rounded-lg transition-colors duration-200 ${props.activeLyricIndex === index ? 'bg-blue-200/50' : 'bg-white/40'}`}>
                            <div className="flex items-center space-x-3">
                                <span className="text-xs font-mono text-gray-600">{formatTime(lyric.time)}</span>
                                <p className="text-sm text-gray-800 truncate">{lyric.text}</p>
                            </div>
                            <button onClick={() => props.onSyncLyricTime(index)} className="p-2 bg-white/70 hover:bg-white rounded-lg transition-colors duration-200 active:scale-95">
                                <Icon name="clock" className="w-5 h-5 text-blue-600" />
                            </button>
                        </div>
                    )) : <p className="text-sm text-gray-500 text-center py-4">No lyrics parsed yet.</p>}
                </div>
            </div>
        </div>
    );
};

const OverlaysSettings: React.FC<ControlsProps> = (props) => {
    const logoInputRef = useRef<HTMLInputElement>(null);
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) props.onLogoChange(e.target.files[0]);
    };
    return (
        <div className="grid grid-cols-1">
            <SettingGroup title="Logo Watermark">
                <div className="flex items-center space-x-2">
                    <input type="file" accept="image/*" ref={logoInputRef} onChange={handleFileSelect} className="hidden" />
                    <button onClick={() => logoInputRef.current?.click()} className="flex-1 text-sm font-semibold text-gray-700 bg-white/60 hover:bg-white/90 border border-white/20 rounded-lg px-4 py-2.5 transition-all duration-200 active:scale-95">
                        {props.hasLogo ? 'Change Logo' : 'Upload Logo'}
                    </button>
                    {props.hasLogo && (
                        <button onClick={props.onClearLogo} className="p-2.5 bg-red-500/20 hover:bg-red-500/40 rounded-lg transition-colors duration-200 active:scale-95">
                            <Icon name="close" className="w-5 h-5 text-red-700" />
                        </button>
                    )}
                </div>
                <FormControl>
                    <FormLabel htmlFor="logo-size" value={`${props.logoSettings.size}%`}>Size</FormLabel>
                    <input type="range" id="logo-size" min="1" max="50" value={props.logoSettings.size} onChange={e => props.onLogoSettingsChange({...props.logoSettings, size: Number(e.target.value)})} disabled={!props.hasLogo} />
                </FormControl>
                <FormControl>
                    <FormLabel htmlFor="logo-opacity" value={`${props.logoSettings.opacity}%`}>Opacity</FormLabel>
                    <input type="range" id="logo-opacity" min="0" max="100" value={props.logoSettings.opacity} onChange={e => props.onLogoSettingsChange({...props.logoSettings, opacity: Number(e.target.value)})} disabled={!props.hasLogo} />
                </FormControl>
                <FormControl>
                    <FormLabel htmlFor="logo-pos">Position</FormLabel>
                    <Select id="logo-pos" value={props.logoSettings.position} onChange={e => props.onLogoSettingsChange({...props.logoSettings, position: e.target.value as LogoSettings['position']})} disabled={!props.hasLogo}>
                        <option value="top-right">Top Right</option>
                        <option value="top-left">Top Left</option>
                        <option value="bottom-right">Bottom Right</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="center">Center</option>
                    </Select>
                </FormControl>
            </SettingGroup>
            
            <SettingGroup title="Canvas UI">
                <div className="flex items-center pt-2">
                    <input type="checkbox" id="show-timer" checked={props.showTimer} onChange={e => props.onShowTimerChange(e.target.checked)} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" />
                    <label htmlFor="show-timer" className="ml-2 text-sm font-medium text-gray-700">Show Timer</label>
                </div>
                <FormControl>
                    <FormLabel htmlFor="show-progress">Progress Bar</FormLabel>
                    <Select id="show-progress" value={props.showProgressBar} onChange={e => props.onShowProgressBarChange(e.target.value)}>
                        <option value="none">None</option>
                        <option value="top">Top</option>
                        <option value="bottom">Bottom</option>
                    </Select>
                </FormControl>
            </SettingGroup>
        </div>
    );
};

const OutputSettings: React.FC<ControlsProps> = (props) => {
    const resolutions: {[key: string]: Resolution} = {
        '1280x720': {width: 1280, height: 720},
        '1920x1080': {width: 1920, height: 1080},
        '2560x1440': {width: 2560, height: 1440},
        '3840x2160': {width: 3840, height: 2160},
        '720x1280': {width: 720, height: 1280},
        '1080x1920': {width: 1080, height: 1920},
        '1080x1080': {width: 1080, height: 1080},
        '1080x1350': {width: 1080, height: 1350},
    };
    
    const currentResKey = `${props.resolution.width}x${props.resolution.height}`;
    
    return (
        <div className="grid grid-cols-1">
            <SettingGroup title="Video Export">
                <FormControl>
                    <FormLabel htmlFor="resolution">Resolution & Aspect Ratio</FormLabel>
                    <Select id="resolution" value={currentResKey} onChange={e => props.onResolutionChange(resolutions[e.target.value])}>
                        <optgroup label="16:9 Landscape">
                            <option value="1280x720">720p HD</option>
                            <option value="1920x1080">1080p Full HD</option>
                            <option value="2560x1440">1440p QHD</option>
                            <option value="3840x2160">2160p 4K UHD</option>
                        </optgroup>
                        <optgroup label="9:16 Portrait">
                            <option value="720x1280">720p HD</option>
                            <option value="1080x1920">1080p Full HD</option>
                        </optgroup>
                        <optgroup label="Square & Portrait">
                             <option value="1080x1080">1:1 Square (1080p)</option>
                             <option value="1080x1350">4:5 Portrait (1080p)</option>
                        </optgroup>
                    </Select>
                </FormControl>
            </SettingGroup>
        </div>
    );
};

export default Controls;
