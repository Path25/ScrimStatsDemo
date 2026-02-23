
// Utility to help identify missing item icons and provide fallback URLs
export const getMissingItems = (itemIds: number[]): number[] => {
  const missingItems: number[] = [];
  
  itemIds.forEach(itemId => {
    if (itemId === 0) return; // Skip empty item slots
    
    // Test if image loads (this would be logged to console)
    const img = new Image();
    img.onload = () => {
      // Item loaded successfully
    };
    img.onerror = () => {
      console.warn(`Missing item icon for ID: ${itemId}`);
      missingItems.push(itemId);
    };
    img.src = `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/item/${itemId}.png`;
  });
  
  return missingItems;
};

// Custom fallback URLs for items that don't exist in Data Dragon
export const itemFallbacks: Record<number, string> = {
  3175: 'https://raw.communitydragon.org/latest/game/assets/items/icons2d/boots_tier3_sorceror_64.png', // Sorcerer's Shoes
  3174: 'https://raw.communitydragon.org/latest/game/assets/items/icons2d/boots_tier3_platedsteelcaps_64.png', // Plated Steelcaps
  3171: 'https://raw.communitydragon.org/latest/game/assets/items/icons2d/boots_tier3_ionianboots_64.png', // Ionian Boots of Lucidity
  2503: 'https://raw.communitydragon.org/latest/game/assets/items/icons2d/2503_blackfiretorch64.png', // Blackfire Torch
  3032: 'https://raw.communitydragon.org/latest/game/assets/items/icons2d/3032_yuntalwildarrows.png' // Yun Tal Wildarrows
};

// Common boot items that might be missing
export const commonBootItems = [
  1001, // Boots of Speed
  3006, // Berserker's Greaves
  3009, // Boots of Swiftness
  3020, // Sorcerer's Shoes
  3047, // Plated Steelcaps
  3111, // Mercury's Treads
  3117, // Mobility Boots
  3158, // Ionian Boots of Lucidity
  3171, // Ionian Boots of Lucidity (new ID)
  3174, // Plated Steelcaps (new ID)
  3175, // Sorcerer's Shoes (new ID)
];

// Known problematic items that often fail to load
export const problematicItems = [
  // Mythic items from older patches
  6630, 6631, 6632, 6633, 6671, 6672, 6673,
  // Removed items
  3193, 3194, 3196, 3197, 3198,
  // Season-specific items
  2065, 2066, 2138, 2139, 2140,
  // New items that may not be in older Data Dragon versions
  2503, 3032, 3171, 3174, 3175,
];

// Enhanced item validation with multiple patch versions
export const validateItemIcon = async (itemId: number): Promise<boolean> => {
  const versions = ['14.1.1', '13.24.1', '13.1.1', '12.23.1'];
  
  for (const version of versions) {
    try {
      const response = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${itemId}.png`);
      if (response.ok) {
        console.log(`Item ${itemId} found in version ${version}`);
        return true;
      }
    } catch (error) {
      continue;
    }
  }
  
  // Check if we have a custom fallback
  if (itemFallbacks[itemId]) {
    console.log(`Item ${itemId} has custom fallback available`);
    return true;
  }
  
  console.error(`Item ${itemId} not found in any tested version and no custom fallback available`);
  return false;
};
