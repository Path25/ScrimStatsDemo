
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { championFallbackInitials, championFallbackLabel, isMissingChampionIdentity, resolveChampionImageUrl } from '@/lib/champion-avatar';
import { useChampionCatalog } from '@/hooks/useChampionCatalog';

interface ChampionAvatarProps {
  championName?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

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
  const catalogue = useChampionCatalog();
  const imageUrl = resolveChampionImageUrl(championName, catalogue.data);
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const missingChampion = isMissingChampionIdentity(championName);

  const sizeClasses = getSizeClasses(size);
  const fallbackLabel = championFallbackLabel(championName);
  const fallbackInitials = championFallbackInitials(championName);

  const imageFailed = Boolean(imageUrl && failedImageUrl === imageUrl);

  return (
    <Avatar className={`${sizeClasses} ${className}`}>
      {imageUrl && !imageFailed ? <AvatarImage
        src={imageUrl}
        alt={championName || "Champion"}
        className="object-cover"
        onError={() => setFailedImageUrl(imageUrl)}
      /> : null}
      <AvatarFallback
        className="bg-muted text-xs font-medium text-[var(--workspace-subtle)]"
        role="img"
        aria-label={fallbackLabel}
      >
        {missingChampion ? <User className="h-4 w-4" aria-hidden="true" /> : fallbackInitials}
      </AvatarFallback>
    </Avatar>
  );
};
