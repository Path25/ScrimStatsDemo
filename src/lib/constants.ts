export const ROLES = {
    OWNER: 'owner',
    MANAGER: 'manager',
    COACH: 'coach',
    PLAYER: 'player',
} as const;

export const CHAMPION_ROLES = {
    TOP: 'top',
    JUNGLE: 'jungle',
    MID: 'mid',
    ADC: 'adc',
    SUPPORT: 'support',
} as const;

export const GAME_MODES = {
    SCRIM: 'scrim',
    OFFICIAL: 'official',
    SOLOQ: 'soloq',
} as const;
