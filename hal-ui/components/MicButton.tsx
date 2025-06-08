'use client';

import React, { useState, useEffect, useRef } from 'react';
import MicIcon from '@mui/icons-material/Mic';

type Props = {
  onFinalTranscript: (text: string) => void;
};

export default function MicButton({ onFinalTranscript }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('SpeechRecognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          // Final result — send to parent and clear interim
          onFinalTranscript(transcript.trim());
        } else {
          interim += transcript;
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
  }, [onFinalTranscript]);

  const startListening = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.start();
  };

  return (
    <button
      onClick={startListening}
      className={`bg-stone-900 ${isRecording ? 'text-rose-400' : 'text-stone-300'} px-[8%] py-[2%] rounded-md shadow-lg hover:text-rose-400 hover:cursor-pointer uppercase tracking-wider border border-[4%] border-black whitespace-nowrap mt-[5%]`}
      disabled={isRecording}
    >
      <MicIcon style={{ fontSize: 20 }} /> {isRecording ? 'Listening...' : 'Activate Mic'}
    </button>
  );
}
