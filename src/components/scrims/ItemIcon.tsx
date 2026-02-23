
import React, { useState } from 'react';

interface ItemIconProps {
  itemId: number;
  itemName?: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export const ItemIcon: React.FC<ItemIconProps> = ({
  itemId,
  itemName,
  size = 'sm',
  showTooltip = true
}) => {
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  };

  // Custom fallback URLs for specific items
  const customItemFallbacks: Record<number, string> = {
    3175: 'https://raw.communitydragon.org/latest/game/assets/items/icons2d/boots_tier3_sorceror_64.png',
    3174: 'https://raw.communitydragon.org/latest/game/assets/items/icons2d/boots_tier3_platedsteelcaps_64.png',
    3171: 'https://raw.communitydragon.org/latest/game/assets/items/icons2d/boots_tier3_ionianboots_64.png',
    2503: 'https://raw.communitydragon.org/latest/game/assets/items/icons2d/2503_blackfiretorch64.png',
    3032: 'https://raw.communitydragon.org/latest/game/assets/items/icons2d/3032_yuntalwildarrows.png'
  };

  const getItemImageUrl = (id: number, version: string = '14.1.1') => {
    return `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${id}.png`;
  };

  const handleImageError = () => {
    if (retryCount === 0) {
      // Try with a different patch version
      setRetryCount(1);
      console.warn(`Failed to load item ${itemId} with version 14.1.1, trying 13.24.1`);
    } else if (retryCount === 1) {
      // Try with another version
      setRetryCount(2);
      console.warn(`Failed to load item ${itemId} with version 13.24.1, trying 13.1.1`);
    } else if (retryCount === 2 && customItemFallbacks[itemId]) {
      // Try custom fallback URL
      setRetryCount(3);
      console.warn(`Failed to load item ${itemId} with Data Dragon, trying custom fallback`);
    } else {
      // Final fallback - show placeholder
      setImageError(true);
      console.error(`Failed to load item icon for ID: ${itemId} - no fallback available`);
    }
  };

  if (itemId === 0) return null;

  if (imageError) {
    return (
      <div className={`${sizeClasses[size]} rounded border border-border bg-muted flex items-center justify-center`}>
        <span className="text-xs text-muted-foreground">?</span>
      </div>
    );
  }

  const getImageSrc = () => {
    if (retryCount === 0) {
      return getItemImageUrl(itemId, '14.1.1');
    } else if (retryCount === 1) {
      return getItemImageUrl(itemId, '13.24.1');
    } else if (retryCount === 2) {
      return getItemImageUrl(itemId, '13.1.1');
    } else if (retryCount === 3 && customItemFallbacks[itemId]) {
      return customItemFallbacks[itemId];
    }
    return getItemImageUrl(itemId, '14.1.1');
  };

  return (
    <div className="relative group">
      <img
        src={getImageSrc()}
        alt={itemName || `Item ${itemId}`}
        className={`${sizeClasses[size]} rounded border border-border bg-background`}
        onError={handleImageError}
      />
      {showTooltip && itemName && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
          {itemName}
        </div>
      )}
    </div>
  );
};
