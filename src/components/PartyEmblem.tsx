import React from 'react';
import { EmblemId } from '../types/game';

interface PartyEmblemProps {
  emblem: EmblemId;
  color: string;
  customUrl?: string;
  size?: number;
  className?: string;
}

export const PartyEmblem: React.FC<PartyEmblemProps> = ({
  emblem,
  color,
  customUrl,
  size = 36,
  className = '',
}) => {
  if (customUrl) {
    return (
      <div
        style={{ width: size, height: size, borderColor: `${color}66` }}
        className={`relative rounded-full overflow-hidden border bg-[#090D16] flex items-center justify-center shrink-0 ${className}`}
      >
        <img
          src={customUrl}
          alt="Simbolo partito"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  const renderGlyph = () => {
    switch (emblem) {
      case 'stella':
        return (
          <path
            d="M12 2.8l2.5 5.6 6.1.6-4.6 4 1.4 6-5.4-3.2-5.4 3.2 1.4-6-4.6-4 6.1-.6L12 2.8z"
            fill={color}
          />
        );
      case 'scudo':
        return (
          <>
            <path
              d="M12 3L4.5 6v5.8c0 4.6 3.2 8.7 7.5 9.8 4.3-1.1 7.5-5.2 7.5-9.8V6L12 3z"
              fill={`${color}33`}
              stroke={color}
              strokeWidth="1.8"
            />
            <path d="M12 6.5v11.5M7.5 11.2h9" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
          </>
        );
      case 'ulivo':
        return (
          <>
            <path
              d="M5 19c4-4 8-8 14-14"
              stroke={color}
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M11 13c-1-3 0-5.5 2.8-6.2C14.2 9.5 13 12 11 13zM14.5 9.5c2.8-.6 5 .5 5.5 3-2.5.6-4.7-.5-5.5-3zM8 16c-2.5-.6-4-2.5-3.6-5 2.4.5 4 2.4 3.6 5z"
              fill={color}
            />
          </>
        );
      case 'bilancia':
        return (
          <>
            <path d="M12 4v15M7 19h10M5 8h14" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
            <path
              d="M5 8l-2 5h4l-2-5zM19 8l-2 5h4l-2-5z"
              fill={`${color}44`}
              stroke={color}
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </>
        );
      case 'torre':
        return (
          <path
            d="M7 20h10v-2H7v2zm1-3h8V9H8v8zm-1-9h10V4h-2v2h-2V4h-2v2H9V4H7v4zm4 4h2v3h-2v-3z"
            fill={color}
          />
        );
      case 'aquila':
        return (
          <path
            d="M12 5l2 2.2L20.5 6l-3.2 4.4 2.2 1.6-4.5 1.8L12 19.5l-3-5.7-4.5-1.8 2.2-1.6L3.5 6 10 7.2 12 5z"
            fill={color}
          />
        );
      case 'ruota':
        return (
          <>
            <circle cx="12" cy="12" r="7.5" fill="none" stroke={color} strokeWidth="1.8" />
            <circle cx="12" cy="12" r="2.2" fill={color} />
            <path
              d="M12 4.5v15M4.5 12h15M6.7 6.7l10.6 10.6M17.3 6.7L6.7 17.3"
              stroke={color}
              strokeWidth="1.4"
            />
          </>
        );
      case 'bussola':
        return (
          <>
            <circle cx="12" cy="12" r="8.2" fill="none" stroke={color} strokeWidth="1.6" />
            <path d="M12 6l2.4 6L12 18l-2.4-6L12 6z" fill={color} />
          </>
        );
      case 'sole':
        return (
          <>
            <circle cx="12" cy="12" r="4.3" fill={color} />
            <path
              d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8"
              stroke={color}
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </>
        );
      case 'arco':
      default:
        return (
          <>
            <path
              d="M4.5 18.5V12a7.5 7.5 0 0115 0v6.5"
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M8.5 18.5V12a3.5 3.5 0 017 0v6.5M3.5 18.5h17"
              fill="none"
              stroke={color}
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </>
        );
    }
  };

  return (
    <div
      style={{
        width: size,
        height: size,
        borderColor: `${color}66`,
        backgroundColor: `${color}14`,
      }}
      className={`rounded-full border flex items-center justify-center shrink-0 ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        width={Math.round(size * 0.64)}
        height={Math.round(size * 0.64)}
        aria-hidden="true"
      >
        {renderGlyph()}
      </svg>
    </div>
  );
};
