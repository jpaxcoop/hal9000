import React, { useState } from 'react';

interface HalMuteButtonProps {
  isMuted: boolean;
  setIsMuted: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function HalMuteButton({ isMuted, setIsMuted }: HalMuteButtonProps) {
  return (
    <div className="mt-2 flex items-center justify-center space-x-4">
      <div>
        {isMuted ? '🔇' : '🔊'}
      </div>

      <div>
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-600"
          aria-pressed={isMuted}
          aria-label={isMuted ? "Unmute HAL" : "Mute HAL"}
        >
          {isMuted ? 'Unmute' : 'Mute'}
        </button>
      </div>
    </div>
  );
}
