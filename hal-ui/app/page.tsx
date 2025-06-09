'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import MicButton from '../components/MicButton';
import HalMuteButton from '@/components/HalMuteButton';
import HalEye from '@/components/HalEye';
import SlideshowMonitor from '@/components/SlideshowMonitor';
import TranscriptMonitor from '@/components/TranscriptMonitor';

type TranscriptItem = {
  speaker: 'You' | 'H.A.L.';
  text: string;
  isProcessing?: boolean;
  audioUrl?: string;
};

export default function Page() {
  const [transcriptItems, setTranscriptItems] = useState<TranscriptItem[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

  useEffect(() => {
    audioRef.current = new Audio();

    audioRef.current.muted = isMuted;
  }, []);

  // Sync `isMuted` state to the actual audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Scroll to bottom of transcript when new items are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcriptItems]);


  // Called when user finishes speaking; send text to API and update transcript
  const handleUserSpeechFinal = useCallback(async (userText: string) => {
    if (!userText.trim()) return;

    // Add user speech to transcript
    setTranscriptItems((items) => [
      ...items,
      { speaker: 'You', text: userText },
      { speaker: 'H.A.L.', text: 'Processing', isProcessing: true },
    ]);

    try {
      const response = await fetch(`${apiBaseUrl}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: userText }),
      });
      if (!response.ok) throw new Error('API error');
      const data = await response.json();

      // Replace "Processing..." with actual HAL response
      setTranscriptItems((items) => {
        // Remove last "Processing..." HAL message
        const filtered = items.filter((item) => !item.isProcessing);
        return [
          ...filtered,
          { speaker: 'H.A.L.', text: data.text || 'No response', audioUrl: data.audio_url },
        ];
      });

      // Play audio if present
      if (data.audio_url && audioRef.current) {
        audioRef.current.src = data.audio_url;
        audioRef.current.play();
      }
    } catch (error) {
      setTranscriptItems((items) => {
        const filtered = items.filter((item) => !item.isProcessing);
        return [
          ...filtered,
          { speaker: 'H.A.L.', text: 'Error generating response.' },
        ];
      });
    }
  }, []);

  return (
    <div className="flex min-h-screen bg-stone-950">
      <div className="hidden md:flex w-1/3 min-h-screen items-center justify-end">
        <SlideshowMonitor />
      </div>
      <div className="w-full md:w-1/3 min-h-screen flex flex-col items-center justify-center">
        <HalEye />
        <MicButton onFinalTranscript={handleUserSpeechFinal} />
        {/* <HalMuteButton isMuted={isMuted} setIsMuted={setIsMuted} /> */}
      </div>
      <div className="hidden md:flex w-1/3 min-h-screen items-center justify-start">
        <TranscriptMonitor transcriptItems={transcriptItems} />
      </div>
    </div>
  );
}
