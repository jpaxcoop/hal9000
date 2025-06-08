'use client';

import React, { useRef, useEffect, useState } from 'react';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { TypingText } from './TypingText';

type TranscriptItem = {
  speaker: 'You' | 'H.A.L.';
  text: string;
  isProcessing?: boolean;
  audioUrl?: string;
};

interface TranscriptMonitorProps {
  transcriptItems: TranscriptItem[];
}

export default function TranscriptMonitor({ transcriptItems }: TranscriptMonitorProps) {
  const [typingDone, setTypingDone] = useState<boolean>(false);

  // Reset on new message
  useEffect(() => {
    setTypingDone(false);
  }, [transcriptItems]);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll when transcript updates
  useEffect(() => {
    const scrollbar = scrollRef.current;
    if (!scrollbar) return;

    const observer = new MutationObserver(() => {
        scrollbar.scrollTop = scrollbar.scrollHeight;
    });

    observer.observe(scrollbar, {
        childList: true,
        subtree: true,
        characterData: true, // <-- important
    });

    return () => observer.disconnect();
    }, []);

  return (
    <div className="rounded-lg aspect-square w-[67%] max-w-[400px] bg-linear-to-t from-sky-900 via-sky-700 to-sky-600 text-sky-200 p-[3%] shadow-2xl shadow-black font-terminal text-shadow-xs">
      <div className="h-full overflow-y-auto pr-[3%] terminal-scrollbar" ref={scrollRef}>
        {transcriptItems.map((item, i) => (
          <div key={i} className="mb-4">
            {item.isProcessing ? (
              <div className='"opacity-0 animate-fadeIn delay-1000'>
                <span className="uppercase tracking-wider">{item.text}</span>
                <span className="inline-block bg-sky-200 aspect-square w-3 animate-blink ml-1"></span>
              </div>
            ) : (
              <>
                <span className="font-bold uppercase tracking-widest">{item.speaker}</span>
                <ChevronRightIcon style={{ fontSize: 20, fontWeight: 'bold' }} />
                {item.speaker === 'You' ? (
                  <div className="inline first-letter:uppercase tracking-wider">{item.text}</div>
                ) : (
                  <TypingText
                    fullText={item.text}
                    speed={50}
                    onDone={i === transcriptItems.length - 1 ? () => setTypingDone(true) : undefined}
                  />
                )}
              </>
            )}
          </div>
        ))}
        {(transcriptItems.length < 1 || !transcriptItems.some(item => item.isProcessing) && typingDone) && (
          <div className="uppercase tracking-wider opacity-0 animate-fadeIn delay-1000">
            Ready
            <span className="inline-block bg-sky-200 aspect-square w-3 animate-blink ml-1"></span>
          </div>
        )}
      </div>
    </div>
  );
}
