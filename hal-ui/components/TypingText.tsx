'use client';

import { useEffect, useState } from 'react';

type TypingTextProps = {
  fullText: string;
  speed?: number; // milliseconds per character
  onDone?: () => void;
};

export function TypingText({ fullText, speed = 30, onDone }: TypingTextProps) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let index = 0;
    let animationFrame: number;

    function typeNextChar() {
      if (index < fullText.length) {
        setDisplayedText(fullText.slice(0, index + 1));
        index++;
        animationFrame = window.setTimeout(typeNextChar, speed);
      } else {
        // Typing finished, call onDone if provided
        if (onDone) onDone();
			}
    }

    typeNextChar();

    return () => clearTimeout(animationFrame); // cleanup on unmount
  }, [fullText, speed]);

  return <div className="whitespace-pre-line inline tracking-wider">{displayedText}</div>;
}