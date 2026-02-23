export interface SoloQMatch {
    id: string;
    gameCreation: number;
    gameDuration: number;
    gameMode: string;
    championId: number;
    championName: string;
    win: boolean;
    kills: number;
    deaths: number;
    assists: number;
    cs: number;
    item0: number;
    item1: number;
    item2: number;
    item3: number;
    item4: number;
    item5: number;
    item6: number;
    perks: {
        primaryStyle: number;
        subStyle: number;
    };
}

export interface ChampionStats {
    championName: string;
    matches: number;
    wins: number;
    kills: number;
    deaths: number;
    assists: number;
    cs: number;
}

export interface SoloQPlayer {
    id: string;
    name: string;
    tagLine: string;
    profileIconId: number;
    tier: string;
    rank: string;
    leaguePoints: number;
    wins: number;
    losses: number;
    lpTrend: number; // e.g. +45 or -20 over last 24h
    lastUpdated: number;
    matches: SoloQMatch[];
    championStats: ChampionStats[];
}
