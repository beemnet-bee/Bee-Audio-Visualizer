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
