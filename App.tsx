import React, { useState, useRef, useCallback, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import Visualizer, { VisualizerType, BarStyle } from './components/Visualizer';
import Controls, { LyricSettings, LogoSettings } from './components/Controls';
import Icon from './components/Icon';

export interface TimedLyric {
  time: number;
  text: string;
}

export interface Resolution {
    width: number;
    height: number;
}

const App: React.FC = () => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [fileName, setFileName] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [waveform_data, setWaveformData] = useState<number[] | null>(null);
  
  // Visualizer settings
  const [visualizerType, setVisualizerType] = useState<VisualizerType>('bar');
  const [visualizerColor, setVisualizerColor] = useState<string>('#007BFF');
  const [color2, setColor2] = useState<string>('#00C6FF');
  const [useGradient, setUseGradient] = useState<boolean>(true);
  const [barCount, setBarCount] = useState<number>(128);
  const [smoothing, setSmoothing] = useState<number>(0.5);
  const [barStyle, setBarStyle] = useState<BarStyle>('rounded');
  const [visualizerPosition, setVisualizerPosition] = useState<number>(50);

  // Background settings
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [backgroundColor, setBackgroundColor] = useState<string>('#FFFFFF');
  const [backgroundOpacity, setBackgroundOpacity] = useState<number>(0.3);
  const [backgroundBlur, setBackgroundBlur] = useState<number>(4);
  
  // Lyrics settings
  const [timedLyrics, setTimedLyrics] = useState<TimedLyric[]>([]);
  const [activeLyricIndex, setActiveLyricIndex] = useState<number>(-1);
  const [lyricSettings, setLyricSettings] = useState<LyricSettings>({
    fontSize: 32,
    fontColor: '#1A202C',
    highlightColor: 'rgba(0, 123, 255, 0.2)',
    positionY: 50,
    positionX: 50,
    fontFamily: 'Ubuntu, sans-serif'
  });
  
  // Output settings
  const [resolution, setResolution] = useState<Resolution>({ width: 1920, height: 1080 });
  
  // Overlays settings
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [logoSettings, setLogoSettings] = useState<LogoSettings>({
      size: 10,
      opacity: 80,
      position: 'top-right'
  });
  const [showTimer, setShowTimer] = useState<boolean>(false);
  const [showProgressBar, setShowProgressBar] = useState<string>('none');


  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const destinationNodeRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const isAudioContextSetup = useRef<boolean>(false);

  const processAudioForWaveform = async (file: File) => {
    const tempAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await tempAudioContext.decodeAudioData(arrayBuffer);
    const data = audioBuffer.getChannelData(0);
    const samples = 2000; // The number of data points we want for the waveform
    const blockSize = Math.floor(data.length / samples);
    const filteredData = [];
    for (let i = 0; i < samples; i++) {
        let blockStart = blockSize * i;
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
            sum = sum + Math.abs(data[blockStart + j])
        }
        filteredData.push(sum / blockSize);
    }
    const multiplier = Math.pow(Math.max(...filteredData), -1);
    setWaveformData(filteredData.map(n => n * multiplier));
    tempAudioContext.close();
  };

  const handleFileChange = (file: File) => {
    setAudioFile(file);
    setFileName(file.name);
    if (audioElementRef.current) {
      audioElementRef.current.src = URL.createObjectURL(file);
      audioElementRef.current.load();
    }
    setIsPlaying(false);
    setProgress(0);
    setTimedLyrics([]);
    setActiveLyricIndex(-1);
    processAudioForWaveform(file);
  };
  
  const handleBackgroundChange = (file: File) => {
    if (backgroundImage) URL.revokeObjectURL(backgroundImage);
    setBackgroundImage(URL.createObjectURL(file));
  };
  
  const clearBackground = () => {
    if (backgroundImage) URL.revokeObjectURL(backgroundImage);
    setBackgroundImage(null);
  };

  const handleLogoChange = (file: File) => {
    if (logoImage) URL.revokeObjectURL(logoImage);
    setLogoImage(URL.createObjectURL(file));
  };

  const clearLogo = () => {
    if (logoImage) URL.revokeObjectURL(logoImage);
    setLogoImage(null);
  };

  const setupAudioContext = useCallback(() => {
    if (isAudioContextSetup.current || !audioElementRef.current) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 2048;

    const sourceNode = audioContext.createMediaElementSource(audioElementRef.current);
    
    sourceNode.connect(analyserNode);
    analyserNode.connect(audioContext.destination);

    audioContextRef.current = audioContext;
    analyserNodeRef.current = analyserNode;
    sourceNodeRef.current = sourceNode;
    isAudioContextSetup.current = true;
  }, []);
  
  const togglePlayPause = useCallback(() => {
    if (!audioFile || !audioElementRef.current || isRecording) return;
    if (!isAudioContextSetup.current) setupAudioContext();
    
    const audioContext = audioContextRef.current;
    if (audioContext && audioContext.state === 'suspended') audioContext.resume();

    if (isPlaying) audioElementRef.current.pause();
    else audioElementRef.current.play().catch(e => console.error("Error playing audio:", e));
    setIsPlaying(!isPlaying);
  }, [isPlaying, audioFile, setupAudioContext, isRecording]);

  const handleSeek = (value: number) => {
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = value;
      setProgress(value);
    }
  };

  const handleExport = async () => {
    if (!audioFile || !audioElementRef.current || !canvasRef.current || isRecording) return;
    setIsRecording(true);
    
    canvasRef.current.width = resolution.width;
    canvasRef.current.height = resolution.height;

    audioElementRef.current.currentTime = 0;
    
    if (!isAudioContextSetup.current) setupAudioContext();
    const audioContext = audioContextRef.current;
    if (audioContext && audioContext.state === 'suspended') await audioContext.resume();

    const videoStream = canvasRef.current.captureStream(30);

    if (!sourceNodeRef.current || !audioContextRef.current) {
        console.error("Audio context not ready for recording");
        setIsRecording(false);
        return;
    }
    const destination = audioContextRef.current.createMediaStreamDestination();
    sourceNodeRef.current.connect(destination);
    destinationNodeRef.current = destination;
    const audioStream = destination.stream;

    const combinedStream = new MediaStream([...videoStream.getVideoTracks(), ...audioStream.getAudioTracks()]);

    const options = { mimeType: 'video/webm; codecs=vp9,opus' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        alert("Your browser does not support the required video format for recording.");
        setIsRecording(false);
        return;
    }
    
    mediaRecorderRef.current = new MediaRecorder(combinedStream, options);
    recordedChunksRef.current = [];

    mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunksRef.current.push(event.data);
    };

    mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.style.display = 'none';
        a.href = url;
        a.download = `${fileName.split('.').slice(0, -1).join('.')}_visualization.webm`;
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        
        if (sourceNodeRef.current && destinationNodeRef.current) {
            sourceNodeRef.current.disconnect(destinationNodeRef.current);
            destinationNodeRef.current = null;
        }
        setIsRecording(false);
    };
    
    mediaRecorderRef.current.start();
    audioElementRef.current.play().catch(e => {
        console.error("Error playing audio for recording:", e);
        setIsRecording(false);
    });
    setIsPlaying(true);
  };

  useEffect(() => {
    const audio = audioElementRef.current;
    if (!audio) return;
    const updateProgress = () => setProgress(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const onEnded = () => {
      setIsPlaying(false);
      if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    };
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', onEnded);
    };
  }, [audioFile]);

  useEffect(() => {
    let newIndex = -1;
    const sortedLyrics = [...timedLyrics].sort((a, b) => a.time - b.time);
    for (let i = 0; i < sortedLyrics.length; i++) {
        if (progress >= sortedLyrics[i].time) newIndex = i;
        else break;
    }
    const foundIndex = timedLyrics.findIndex(lyric => lyric.time === sortedLyrics[newIndex]?.time && lyric.text === sortedLyrics[newIndex]?.text);
    setActiveLyricIndex(foundIndex);
  }, [progress, timedLyrics]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-lg overflow-hidden flex flex-col border border-gray-200">
        <header className="p-5 border-b border-gray-200 flex items-center space-x-4">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-md">
            <Icon name="music" className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 tracking-wide">Audio Visualizer Pro</h1>
            <p className="text-sm text-gray-500">Create stunning, lyric-synced visuals for your music</p>
          </div>
        </header>

        <main className="flex-grow p-6 bg-gray-50">
          {!audioFile ? (
            <FileUpload onFileChange={handleFileChange} />
          ) : (
            <div className="flex flex-col space-y-6">
              <div className="text-center bg-gray-100 p-3 rounded-lg border border-gray-200">
                <p className="font-medium text-blue-600 text-sm">Now playing</p>
                <p className="truncate text-gray-700 font-semibold">{fileName}</p>
              </div>
              <Visualizer 
                ref={canvasRef}
                analyserNode={analyserNodeRef.current} 
                isPlaying={isPlaying}
                barCount={barCount}
                color={visualizerColor}
                color2={color2}
                useGradient={useGradient}
                type={visualizerType}
                smoothing={smoothing}
                backgroundImage={backgroundImage}
                backgroundColor={backgroundColor}
                backgroundOpacity={backgroundOpacity}
                backgroundBlur={backgroundBlur}
                barStyle={barStyle}
                activeLyric={activeLyricIndex > -1 ? timedLyrics[activeLyricIndex] : null}
                lyricSettings={lyricSettings}
                resolution={resolution}
                visualizerPosition={visualizerPosition}
                logoImage={logoImage}
                logoSettings={logoSettings}
                showTimer={showTimer}
                showProgressBar={showProgressBar}
                progress={progress}
                duration={duration}
                waveformData={waveform_data}
              />
            </div>
          )}
        </main>
        
        {audioFile && (
            <footer className="p-6 bg-white border-t border-gray-200">
            <Controls
                isPlaying={isPlaying}
                onPlayPause={togglePlayPause}
                onSeek={handleSeek}
                progress={progress}
                duration={duration}
                isReady={!!audioFile}
                color={visualizerColor}
                onColorChange={setVisualizerColor}
                color2={color2}
                onColor2Change={setColor2}
                useGradient={useGradient}
                onUseGradientChange={setUseGradient}
                barCount={barCount}
                onBarCountChange={setBarCount}
                onFileChange={() => setAudioFile(null)}
                isRecording={isRecording}
                onExport={handleExport}
                visualizerType={visualizerType}
                onVisualizerTypeChange={setVisualizerType}
                smoothing={smoothing}
                onSmoothingChange={setSmoothing}
                onBackgroundChange={handleBackgroundChange}
                onClearBackground={clearBackground}
                hasBackground={!!backgroundImage}
                backgroundColor={backgroundColor}
                onBackgroundColorChange={setBackgroundColor}
                backgroundOpacity={backgroundOpacity}
                onBackgroundOpacityChange={setBackgroundOpacity}
                backgroundBlur={backgroundBlur}
                onBackgroundBlurChange={setBackgroundBlur}
                barStyle={barStyle}
                onBarStyleChange={setBarStyle}
                timedLyrics={timedLyrics}
                onTimedLyricsChange={setTimedLyrics}
                lyricSettings={lyricSettings}
                onLyricSettingsChange={setLyricSettings}
                activeLyricIndex={activeLyricIndex}
                resolution={resolution}
                onResolutionChange={setResolution}
                visualizerPosition={visualizerPosition}
                onVisualizerPositionChange={setVisualizerPosition}
                onLogoChange={handleLogoChange}
                onClearLogo={clearLogo}
                hasLogo={!!logoImage}
                logoSettings={logoSettings}
                onLogoSettingsChange={setLogoSettings}
                showTimer={showTimer}
                onShowTimerChange={setShowTimer}
                showProgressBar={showProgressBar}
                onShowProgressBarChange={setShowProgressBar}
            />
            </footer>
        )}
      </div>
      <audio ref={audioElementRef} crossOrigin="anonymous" className="hidden"></audio>
    </div>
  );
};

export default App;