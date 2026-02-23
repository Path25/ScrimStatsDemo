
import React from 'react';

interface RuneIconProps {
  runeId: number;
  size?: 'sm' | 'md';
  isPrimary?: boolean;
}

export const RuneIcon: React.FC<RuneIconProps> = ({
  runeId,
  size = 'sm',
  isPrimary = false
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6'
  };

  const getRuneImageUrl = (id: number) => {
    return `https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/${id}.png`;
  };

  if (runeId === 0) return null;

  return (
    <div className={`relative ${isPrimary ? 'ring-1 ring-primary rounded' : ''}`}>
      <img
        src={getRuneImageUrl(runeId)}
        alt={`Rune ${runeId}`}
        className={`${sizeClasses[size]} rounded`}
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/placeholder.svg';
        }}
      />
    </div>
  );
};
