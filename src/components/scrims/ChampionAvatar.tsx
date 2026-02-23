
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';

interface ChampionAvatarProps {
  championName?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

// Custom fallback URLs for champions that don't exist in Data Dragon
const customChampionFallbacks: Record<string, string> = {
  'ksante': 'https://raw.communitydragon.org/latest/game/assets/characters/ksante/hud/ksante_circle_0.png',
  'k\'sante': 'https://raw.communitydragon.org/latest/game/assets/characters/ksante/hud/ksante_circle_0.png',
};

const getChampionImageUrl = (championName?: string | null, version: string = '14.1.1') => {
  if (!championName || championName.trim() === '' || championName === 'None') {
    return null;
  }

  try {
    // More comprehensive champion name cleaning for Data Dragon compatibility
    let cleanName = championName
      .replace(/'/g, '') // Remove apostrophes (Kai'Sa -> KaiSa)
      .replace(/\./g, '') // Remove dots (Dr. Mundo -> DrMundo)
      .replace(/\s+/g, '') // Remove spaces (Twisted Fate -> TwistedFate)
      .replace(/&/g, '') // Remove ampersands (Nunu & Willump -> NunuWillump)
      .toLowerCase();

    // Special cases for champions with different Data Dragon names
    const nameMapping: Record<string, string> = {
      'nunu&willump': 'nunu',
      'nunuwillump': 'nunu',
      'wukong': 'monkeyking',
      'reksai': 'reksai',
      'chogath': 'chogath',
      'drmundo': 'drmundo',
      'jarvaniv': 'jarvaniv',
      'kogmaw': 'kogmaw',
      'leblanc': 'leblanc',
      'missfortune': 'missfortune',
      'twistedfate': 'twistedfate',
      'xinzhao': 'xinzhao',
      'masteryi': 'masteryi',
      'aurelionsol': 'aurelionsol',
      'ksante': 'ksante',
      'belveth': 'belveth',
      'renata': 'renata'
    };

    const finalName = nameMapping[cleanName] || cleanName;

    // Capitalize first letter for Data Dragon
    const formattedName = finalName.charAt(0).toUpperCase() + finalName.slice(1);

    return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${formattedName}.png`;
  } catch (error) {
    console.warn('Error generating champion image URL:', error);
    return null;
  }
};

const getSizeClasses = (size: 'xs' | 'sm' | 'md' | 'lg') => {
  switch (size) {
    case 'xs':
      return 'h-6 w-6';
    case 'sm':
      return 'h-8 w-8';
    case 'md':
      return 'h-12 w-12';
    case 'lg':
      return 'h-16 w-16';
    default:
      return 'h-12 w-12';
  }
};

export const ChampionAvatar: React.FC<ChampionAvatarProps> = ({
  championName,
  size = 'md',
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const sizeClasses = getSizeClasses(size);

  if (!championName || championName.trim() === '' || championName === 'None') {
    return (
      <Avatar className={`${sizeClasses} ${className}`}>
        <AvatarFallback className="bg-muted">
          <User className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
    );
  }

  const handleImageError = () => {
    const cleanName = championName.toLowerCase().replace(/'/g, '').replace(/\s+/g, '');

    if (retryCount === 0) {
      // Try with a different patch version
      setRetryCount(1);
      console.warn(`Failed to load champion ${championName} with version 14.1.1, trying 13.24.1`);
    } else if (retryCount === 1) {
      // Try with another version
      setRetryCount(2);
      console.warn(`Failed to load champion ${championName} with version 13.24.1, trying 13.1.1`);
    } else if (retryCount === 2 && customChampionFallbacks[cleanName]) {
      // Try custom fallback URL
      setRetryCount(3);
      console.warn(`Failed to load champion ${championName} with Data Dragon, trying custom fallback`);
    } else {
      // Final fallback - show initials
      setImageError(true);
      console.error(`Failed to load champion icon for: ${championName} - no fallback available`);
    }
  };

  if (imageError) {
    return (
      <Avatar className={`${sizeClasses} ${className}`}>
        <AvatarFallback className="bg-muted text-xs font-medium">
          {championName.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
    );
  }

  const getImageSrc = () => {
    const cleanName = championName.toLowerCase().replace(/'/g, '').replace(/\s+/g, '');

    if (retryCount === 0) {
      return getChampionImageUrl(championName, '14.1.1');
    } else if (retryCount === 1) {
      return getChampionImageUrl(championName, '13.24.1');
    } else if (retryCount === 2) {
      return getChampionImageUrl(championName, '13.1.1');
    } else if (retryCount === 3 && customChampionFallbacks[cleanName]) {
      return customChampionFallbacks[cleanName];
    }
    return getChampionImageUrl(championName, '14.1.1');
  };

  return (
    <Avatar className={`${sizeClasses} ${className}`}>
      <AvatarImage
        src={getImageSrc() || undefined}
        alt={championName}
        className="object-cover"
        onError={handleImageError}
      />
      <AvatarFallback className="bg-muted text-xs font-medium">
        {championName.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
};
