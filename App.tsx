import React, { useState, useRef, useCallback, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import Visualizer, { VisualizerType, BarStyle } from './components/Visualizer';
import Controls, { LyricSettings } from './components/Controls';
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
  
  // Visualizer settings
  const [visualizerType, setVisualizerType] = useState<VisualizerType>('bar');
  const [visualizerColor, setVisualizerColor] = useState<string>('#E040FB');
  const [color2, setColor2] = useState<string>('#00F5D4');
  const [useGradient, setUseGradient] = useState<boolean>(true);
  const [barCount, setBarCount] = useState<number>(128);
  const [smoothing, setSmoothing] = useState<number>(0.5);
  const [barStyle, setBarStyle] = useState<BarStyle>('rounded');
  const [visualizerPosition, setVisualizerPosition] = useState<number>(50);

  // Background settings
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [backgroundColor, setBackgroundColor] = useState<string>('#10101E');
  const [backgroundOpacity, setBackgroundOpacity] = useState<number>(0.3);
  const [backgroundBlur, setBackgroundBlur] = useState<number>(4);
  
  // Lyrics settings
  const [timedLyrics, setTimedLyrics] = useState<TimedLyric[]>([]);
  const [activeLyricIndex, setActiveLyricIndex] = useState<number>(-1);
  const [lyricSettings, setLyricSettings] = useState<LyricSettings>({
    fontSize: 32,
    fontColor: '#FFFFFF',
    highlightColor: 'rgba(224, 64, 251, 0.4)',
    positionY: 50,
    positionX: 50,
    fontFamily: 'Ubuntu, sans-serif'
  });
  
  // Output settings
  const [resolution, setResolution] = useState<Resolution>({ width: 1920, height: 1080 });


  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const destinationNodeRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const isAudioContextSetup = useRef<boolean>(false);

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
  };
  
  const handleBackgroundChange = (file: File) => {
    if (backgroundImage) {
        URL.revokeObjectURL(backgroundImage);
    }
    setBackgroundImage(URL.createObjectURL(file));
  };
  
  const clearBackground = () => {
    if (backgroundImage) {
      URL.revokeObjectURL(backgroundImage);
    }
    setBackgroundImage(null);
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

    if (!isAudioContextSetup.current) {
      setupAudioContext();
    }
    
    const audioContext = audioContextRef.current;
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }

    if (isPlaying) {
      audioElementRef.current.pause();
    } else {
      audioElementRef.current.play().catch(e => console.error("Error playing audio:", e));
    }
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
    
    // Ensure canvas has the correct dimensions before capturing
    canvasRef.current.width = resolution.width;
    canvasRef.current.height = resolution.height;

    audioElementRef.current.currentTime = 0;
    
    if (!isAudioContextSetup.current) {
      setupAudioContext();
    }
    const audioContext = audioContextRef.current;
    if (audioContext && audioContext.state === 'suspended') {
        await audioContext.resume();
    }

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
        if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
        }
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
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
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
        if (progress >= sortedLyrics[i].time) {
            newIndex = i;
        } else {
            break;
        }
    }
    const foundIndex = timedLyrics.findIndex(lyric => lyric.time === sortedLyrics[newIndex]?.time && lyric.text === sortedLyrics[newIndex]?.text);
    setActiveLyricIndex(foundIndex);
  }, [progress, timedLyrics]);

  return (
    <div className="min-h-screen text-gray-200 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-black/30 backdrop-blur-xl rounded-2xl shadow-2xl shadow-fuchsia-500/10 overflow-hidden flex flex-col border border-white/10">
        <header className="p-6 border-b border-white/10 flex items-center space-x-4">
          <div className="w-10 h-10 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-fuchsia-500/30">
            <Icon name="music" className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wider">Audio Visualizer Pro</h1>
            <p className="text-sm text-gray-400">Create stunning, lyric-synced visuals for your music</p>
          </div>
        </header>

        <main className="flex-grow p-6">
          {!audioFile ? (
            <FileUpload onFileChange={handleFileChange} />
          ) : (
            <div className="flex flex-col space-y-6">
              <div className="text-center bg-white/5 p-4 rounded-lg">
                <p className="font-medium text-fuchsia-300">Now playing</p>
                <p className="truncate text-white">{fileName}</p>
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
              />
            </div>
          )}
        </main>
        
        {audioFile && (
            <footer className="p-6 bg-black/20 border-t border-white/10">
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
            />
            </footer>
        )}
      </div>
      <audio ref={audioElementRef} crossOrigin="anonymous" className="hidden"></audio>
    </div>
  );
};

export default App;