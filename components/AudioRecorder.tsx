"use client";

import React, { useEffect, useState } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';
import { useDropzone } from 'react-dropzone';
import { Mic, Square, Upload, FileAudio, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface AudioRecorderProps {
  onAudioReady: (audioFile: Blob | File) => void;
  isProcessing: boolean;
}

export function AudioRecorder({ onAudioReady, isProcessing }: AudioRecorderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    clearBlobUrl,
  } = useReactMediaRecorder({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    onStop: (blobUrl, blob) => {
      if (blob) {
        onAudioReady(blob);
        setUploadedFile(null); // Clear uploaded file if we recorded new audio
      }
    }
  });

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedFile(file);
      onAudioReady(file);
      // If we had a recording, clear it
      if (mediaBlobUrl) {
        clearBlobUrl();
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/mpeg': ['.mp3', '.mpga'],
      'audio/wav': ['.wav'],
      'audio/ogg': ['.ogg'],
      'audio/mp4': ['.m4a']
    },
    maxFiles: 1,
    disabled: status === 'recording' || isProcessing
  });

  const isRecording = status === 'recording';

  // Visualizer simulation
  const [visualizerBars, setVisualizerBars] = useState<number[]>(new Array(12).fill(10));

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setVisualizerBars(prev => prev.map(() => Math.random() * 40 + 10));
      }, 100);
    } else {
      setVisualizerBars(new Array(12).fill(10));
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">

      {/* Upload / Record Area */}
      <div
        {...getRootProps()}
        className={twMerge(
          "relative border-2 border-dashed rounded-3xl p-8 transition-all duration-300 ease-in-out cursor-pointer",
          isDragActive ? "border-blue-500 bg-blue-50/10" : "border-slate-700 hover:border-slate-500",
          isRecording ? "border-red-500/50 bg-red-900/10" : "",
          uploadedFile ? "border-green-500/50 bg-green-900/10" : ""
        )}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center justify-center space-y-4">

          {/* Main Action Button */}
          <div className="relative group">
            <AnimatePresence mode="wait">
              {isRecording ? (
                <motion.button
                  key="stop"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  onClick={(e) => { e.stopPropagation(); stopRecording(); }}
                  className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-10 relative"
                >
                  <Square className="w-8 h-8 text-white fill-current" />
                </motion.button>
              ) : (
                <motion.button
                  key="record"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (uploadedFile) {
                      // clear file if user starts recording
                      setUploadedFile(null);
                    }
                    startRecording();
                  }}
                  className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors z-10 relative"
                >
                  <Mic className="w-8 h-8 text-white" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Pulse Effect */}
            {isRecording && (
              <motion.div
                className="absolute inset-0 bg-red-500 rounded-full -z-10"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            )}
          </div>

          {/* Status Text & Visualizer */}
          <div className="h-16 flex items-center justify-center">
            {isRecording ? (
              <div className="flex items-end space-x-1 h-8">
                {visualizerBars.map((height, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-red-500 rounded-t-sm"
                    animate={{ height }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  />
                ))}
              </div>
            ) : uploadedFile ? (
              <div className="flex items-center space-x-2 text-green-400 bg-green-900/30 px-4 py-2 rounded-full">
                <FileAudio className="w-5 h-5" />
                <span className="font-medium truncate max-w-[200px]">{uploadedFile.name}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setUploadedFile(null); onAudioReady(null as any); }}
                  className="p-1 hover:bg-green-800 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center text-slate-400 space-y-1">
                <p className="font-medium">Click to Record or Drag & Drop File</p>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Upload className="w-3 h-3" /> MP3, WAV, OGG up to 10MB
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
