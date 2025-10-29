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
      className={`relative flex flex-col items-center justify-center w-full h-80 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-300 ease-in-out bg-gray-100
        ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
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
        <div className={`p-4 rounded-full bg-blue-100 mb-4 transition-transform duration-300 ${isDragging ? 'scale-110' : ''}`}>
          <Icon name="upload" className="w-10 h-10 text-blue-500" />
        </div>
        <p className="mb-2 text-lg text-gray-600">
          <span className="font-semibold text-blue-600">Drop your track</span> or click to browse
        </p>
        <p className="text-xs text-gray-500">MP3, WAV, OGG, FLAC</p>
      </div>
    </div>
  );
};

export default FileUpload;