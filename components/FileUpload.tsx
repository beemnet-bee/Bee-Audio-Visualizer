import React, { useCallback, useState } from 'react';
import Icon from './Icon';

interface FileUploadProps {
  onFileChange: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileChange }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (files: FileList | null) => {
    if (files && files.length > 0) {
      onFileChange(files[0]);
    }
  };

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files);
  }, []);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files);
  };

  return (
    <div
      className={`relative flex flex-col items-center justify-center w-full h-96 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ease-in-out bg-white/30 backdrop-blur-sm
        ${isDragging ? 'border-purple-500 bg-white/50 shadow-2xl shadow-purple-500/20' : 'border-white/40 hover:border-white/80'}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <input
        id="dropzone-file"
        type="file"
        className="absolute w-full h-full opacity-0 cursor-pointer"
        accept="audio/*"
        onChange={onFileSelect}
      />
      <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center pointer-events-none">
        <div className={`p-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg mb-6 transition-transform duration-300 ${isDragging ? 'scale-110' : ''}`}>
          <Icon name="upload" className="w-12 h-12" />
        </div>
        <p className="mb-2 text-xl text-gray-800">
          <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Drop your track</span> or click to browse
        </p>
        <p className="text-sm text-gray-500">MP3, WAV, OGG, FLAC</p>
      </div>
    </div>
  );
};

export default FileUpload;