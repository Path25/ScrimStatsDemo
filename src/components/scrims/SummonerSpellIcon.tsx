
import React from 'react';

interface SummonerSpellIconProps {
  spellId: number;
  size?: 'sm' | 'md';
}

export const SummonerSpellIcon: React.FC<SummonerSpellIconProps> = ({
  spellId,
  size = 'sm'
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8'
  };

  const getSummonerSpellImageUrl = (id: number) => {
    // Common summoner spell IDs mapping
    const spellMap: Record<number, string> = {
      1: 'SummonerBoost', // Cleanse
      3: 'SummonerExhaust', // Exhaust
      4: 'SummonerFlash', // Flash
      6: 'SummonerHaste', // Ghost
      7: 'SummonerHeal', // Heal
      11: 'SummonerSmite', // Smite
      12: 'SummonerTeleport', // Teleport
      13: 'SummonerMana', // Clarity
      14: 'SummonerDot', // Ignite
      21: 'SummonerBarrier', // Barrier
    };

    const spellName = spellMap[id] || 'SummonerFlash';
    return `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/spell/${spellName}.png`;
  };

  if (spellId === 0) return null;

  return (
    <img
      src={getSummonerSpellImageUrl(spellId)}
      alt={`Summoner Spell ${spellId}`}
      className={`${sizeClasses[size]} rounded border border-border`}
    />
  );
};
