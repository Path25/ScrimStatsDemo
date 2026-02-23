
import { Trophy, Calendar as CalendarIcon, Users, TrendingUp } from "lucide-react";

export const MOCK_USER = {
  name: "ProUser@ScrimStats.gg",
  role: "Team Member",
  avatarInitial: "SS",
  email: "ProUser@ScrimStats.gg"
};

export const MOCK_TEAM = {
  name: "Pro Team",
  plan: "Pro Plan +",
  initial: "SS"
};

export const QUICK_ACTIONS = [
  { label: "New Scrim", subLabel: "Schedule a practice match", icon: "plus", color: "bg-teal-400 text-black" },
  { label: "Calendar", subLabel: "View schedule", icon: CalendarIcon, color: "bg-card" },
  { label: "Players", subLabel: "Manage roster", icon: Users, color: "bg-card" },
  { label: "Analytics", subLabel: "View performance", icon: TrendingUp, color: "bg-card" },
];

export const SIDE_STATS = [
  { name: 'Blue Side', winRate: 68, played: 25, color: 'bg-blue-500' },
  { name: 'Red Side', winRate: 42, played: 22, color: 'bg-red-500' },
];

export const OBJECTIVE_STATS = [
  { name: 'Dragon Control', value: 62, total: '2.4 / game', color: 'text-orange-500', barColor: 'bg-orange-500' },
  { name: 'Baron Control', value: 45, total: '0.8 / game', color: 'text-purple-500', barColor: 'bg-purple-500' },
  { name: 'Voidgrub Rate', value: 70, total: '4.2 / game', color: 'text-pink-500', barColor: 'bg-pink-500' },
];

export const TEAM_STATS = [
  { label: "Win Rate", value: "62 %", color: "text-green-500", iconColor: "text-green-500", borderColor: "border-l-4 border-green-500" },
  { label: "Scrims Played", value: "47", color: "text-white", iconColor: "text-blue-500", borderColor: "border-l-4 border-blue-500" },
  { label: "Games This Week", value: "8", color: "text-yellow-500", iconColor: "text-yellow-500", borderColor: "border-l-4 border-yellow-500" },
  { label: "Active Players", value: "5", color: "text-white", iconColor: "text-teal-500", borderColor: "border-l-4 border-teal-500" },
];

export const SCRIM_SCHEDULE = [
  {
    id: 101,
    team: "G2 Academy",
    date: "Today",
    time: "20:00 CET",
    status: "Confirmed",
    format: "BO3",
    logo: "G2"
  },
  {
    id: 102,
    team: "FNC TQ",
    date: "Tomorrow",
    time: "18:00 CET",
    status: "Pending",
    format: "BO3",
    logo: "FNC"
  }
];

export const SCRIM_HISTORY = [
  {
    id: 1,
    opponent: "T1 Academy",
    date: "12/06/2025",
    result: "W 2-1",
    format: "BO3",
    duration: "2h 15m",
    vodUrl: "#"
  },
  {
    id: 2,
    opponent: "G2 Academy",
    date: "27/07/2025",
    result: "L 0-2",
    format: "2G",
    duration: "1h 45m",
    vodUrl: "#"
  },
  {
    id: 3,
    opponent: "KC Academy",
    date: "26/07/2025",
    result: "W 3-0",
    format: "3G",
    duration: "2h 30m",
    vodUrl: "#"
  },
  {
    id: 4,
    opponent: "BDS Acad",
    date: "25/07/2025",
    result: "L 1-2",
    format: "BO3",
    duration: "2h 10m",
    vodUrl: "#"
  },
  {
    id: 5,
    opponent: "VIT Bee",
    date: "24/07/2025",
    result: "W 2-0",
    format: "2G",
    duration: "1h 50m",
    vodUrl: "#"
  }
];

export const CHAMPION_STATS = [
  { name: "Maokai", picks: 12, bans: 8, winRate: "75%", kda: "4.5", role: "Jungle" },
  { name: "Azir", picks: 10, bans: 15, winRate: "60%", kda: "3.2", role: "Mid" },
  { name: "K'Sante", picks: 9, bans: 12, winRate: "55%", kda: "2.8", role: "Top" },
  { name: "Xayah", picks: 8, bans: 4, winRate: "62%", kda: "5.1", role: "ADC" },
  { name: "Nautilus", picks: 8, bans: 2, winRate: "50%", kda: "2.1", role: "Support" },
];

export const TEAM_KPIs = [
  { label: "Gold Diff @ 15", value: "+1.2k", trend: "+5%", positive: true },
  { label: "First Tower Rate", value: "68%", trend: "+12%", positive: true },
  { label: "Dragon Stacking", value: "2.1", trend: "-0.2", positive: false },
  { label: "Vision Score/Min", value: "2.4", trend: "0%", positive: true },
];

// Keep RECENT_SCRIMS for Overview compatibility (slice of history)
export const RECENT_SCRIMS = SCRIM_HISTORY.slice(0, 3);

export const NEXT_SCRIM = {
  opponent: "GTZ | TR1",
  date: "28/07/2025",
  time: "19:00 Prague",
  source: "Data via GRID API",
  count: 50
};

export const QUICK_STATS = [
  { label: "Wins", value: "29" },
  { label: "Scheduled", value: "3" },
  { label: "Active Players", value: "5" },
  { label: "Avg. Rank", value: "Grandmaster" },
];


export const SCOUTING_DATA = [
  {
    id: 1,
    team: "G2 Academy",
    acronym: "G2A",
    winRate: "72%",
    playstyle: "Aggressive Early",
    keyPlayers: [
      { role: "Jungle", name: "Yike Jr", champ: "Bel'Veth" },
      { role: "Mid", name: "Caps Jr", champ: "Sylas" }
    ],
    recentDrafts: [
      { date: "2 days ago", result: "Win", comp: "Dive" },
      { date: "5 days ago", result: "Loss", comp: "Poke" }
    ],
    lastMatch: "W 2-1 vs BDS A"
  },
  {
    id: 2,
    team: "FNC TQ",
    acronym: "FNC",
    winRate: "65%",
    playstyle: "Scaling / Front-to-Back",
    keyPlayers: [
      { role: "ADC", name: "Noah Jr", champ: "Aphelios" }
    ],
    recentDrafts: [
      { date: "1 day ago", result: "Win", comp: "Protect Carry" }
    ],
    lastMatch: "L 0-1 vs KC"
  },
  {
    id: 3,
    team: "Karmine Corp Blue",
    acronym: "KCB",
    winRate: "80%",
    playstyle: "Skirmish Heavy",
    keyPlayers: [
      { role: "Top", name: "Cabochard Jr", champ: "K'Sante" }
    ],
    recentDrafts: [
      { date: "3 days ago", result: "Win", comp: "Split Push" }
    ],
    lastMatch: "W 1-0 vs FNC"
  }
];

export const DRAFT_HISTORY = [
  {
    id: 1,
    vs: "G2 Academy",
    date: "12/06",
    result: "Win",
    perspective: "Blue",
    bans: ["Ashe", "Kalista", "Rumble", "Orianna", "Jax"],
    picks: [
      { id: "pick1", champ: "Maokai", role: "Jungle", side: "Blue" },
      { id: "pick2", champ: "Tristana", role: "Mid", side: "Red" },
      { id: "pick3", champ: "Ivern", role: "Jungle", side: "Red" },
      { id: "pick4", champ: "Nautilus", role: "Support", side: "Blue" },
      { id: "pick5", champ: "Kaisa", role: "ADC", side: "Blue" }
    ],
    winProb: "58%"
  },
  {
    id: 2,
    vs: "FNC TQ",
    date: "10/06",
    result: "Loss",
    perspective: "Red",
    bans: ["Vi", "Sejuani", "Annie"],
    picks: [],
    winProb: "42%"
  }
];

export const SOLOQ_DATA = [
  {
    id: 1,
    name: "Theory",
    rank: "Challenger 842LP",
    trend: "+32 LP",
    matches: 14,
    winRate: "68%",
    lastPlayed: "1 hour ago",
    topChamps: ["Azir", "Orianna"]
  },
  {
    id: 2,
    name: "Vortex",
    rank: "Grandmaster 512LP",
    trend: "+45 LP",
    matches: 12,
    winRate: "65%",
    lastPlayed: "2 hours ago",
    topChamps: ["Lee Sin", "Viego"]
  },
  {
    id: 3,
    name: "Shield",
    rank: "Master 124LP",
    trend: "+100 LP",
    matches: 15,
    winRate: "72%",
    lastPlayed: "Just now",
    topChamps: ["K'Sante", "Jax"]
  },
  {
    id: 4,
    name: "Pulse",
    rank: "Challenger 756LP",
    trend: "-15 LP",
    matches: 8,
    winRate: "58%",
    lastPlayed: "45 mins ago",
    topChamps: ["Kai'Sa", "Xayah"]
  },
  {
    id: 5,
    name: "Aura",
    rank: "Grandmaster 489LP",
    trend: "+28 LP",
    matches: 10,
    winRate: "60%",
    lastPlayed: "3 hours ago",
    topChamps: ["Rakan", "Thresh"]
  }
];

export const ACTIVE_ROSTER = [
  {
    id: 1,
    name: "Theory",
    role: "Mid",
    rank: "CHALLENGER 842 LP",
    avatar: "T",
    avatarColor: "bg-blue-500",
    kda: "4.5",
    winRate: "59%",
    matches: 40,
    cspm: "8.9",
    topChamps: ["Azir", "Orianna", "Sylas"]
  },
  {
    id: 2,
    name: "Vortex",
    role: "Jungle",
    rank: "GRANDMASTER 512 LP",
    avatar: "V",
    avatarColor: "bg-teal-500",
    kda: "4.2",
    winRate: "58%",
    matches: 42,
    cspm: "6.8",
    topChamps: ["Lee Sin", "Nidalee", "Viego"]
  },
  {
    id: 3,
    name: "Shield",
    role: "Top",
    rank: "MASTER 124 LP",
    avatar: "S",
    avatarColor: "bg-purple-500",
    kda: "2.9",
    winRate: "51%",
    matches: 31,
    cspm: "7.8",
    topChamps: ["K'Sante", "Jax", "Renekton"]
  },
  {
    id: 4,
    name: "Pulse",
    role: "ADC",
    rank: "CHALLENGER 756 LP",
    avatar: "P",
    avatarColor: "bg-teal-500",
    kda: "5.1",
    winRate: "62%",
    matches: 38,
    cspm: "9.4",
    topChamps: ["Kai'Sa", "Xayah", "Ezreal"]
  },
  {
    id: 5,
    name: "Aura",
    role: "Support",
    rank: "GRANDMASTER 489 LP",
    avatar: "A",
    avatarColor: "bg-teal-500",
    kda: "3.8",
    winRate: "54%",
    matches: 45,
    cspm: "1.2",
    topChamps: ["Rakan", "Thresh", "Nautilus"]
  },
];


import { SoloQPlayer } from "@/types/soloq";

// Helpers for mock data generation
const generateMatches = (count: number, startTimestamp: number): any[] => {
  return Array.from({ length: count }).map((_, i) => {
    const isWin = Math.random() > 0.45;
    return {
      id: `match-${i}-${Math.random().toString(36).substr(2, 9)}`,
      gameCreation: startTimestamp - (i * 3600 * 1000 * (1 + Math.random())), // Staggered back in time
      gameDuration: 1200 + Math.random() * 1800, // 20-50 mins
      gameMode: "CLASSIC",
      championName: ["Lee Sin", "Viego", "Sejuani", "Maokai", "Graves"][Math.floor(Math.random() * 5)],
      win: isWin,
      kills: Math.floor(Math.random() * 10) + (isWin ? 5 : 0),
      deaths: Math.floor(Math.random() * 8) + (isWin ? 0 : 3),
      assists: Math.floor(Math.random() * 15),
      cs: Math.floor(Math.random() * 100) + 150,
      item0: 1, item1: 1, item2: 1, item3: 1, item4: 1, item5: 1, item6: 3340,
      perks: { primaryStyle: 8000, subStyle: 8100 }
    };
  });
};

export const SOLOQ_DEMO_DATA: SoloQPlayer[] = [
  {
    id: "puuid-1",
    name: "Theory",
    tagLine: "EUW",
    profileIconId: 29,
    tier: "CHALLENGER",
    rank: "I",
    leaguePoints: 842,
    wins: 158,
    losses: 92,
    lpTrend: 32,
    lastUpdated: Date.now() - 1000 * 60 * 60, // 1 hour ago
    matches: generateMatches(20, Date.now()),
    championStats: [
      { championName: "Azir", matches: 52, wins: 34, kills: 4.8, deaths: 2.6, assists: 7.1, cs: 290 },
      { championName: "Orianna", matches: 38, wins: 22, kills: 3.9, deaths: 2.8, assists: 8.4, cs: 280 },
      { championName: "Sylas", matches: 20, wins: 13, kills: 6.1, deaths: 3.5, assists: 5.2, cs: 240 }
    ]
  },
  {
    id: "puuid-2",
    name: "Vortex",
    tagLine: "EUW",
    profileIconId: 54,
    tier: "GRANDMASTER",
    rank: "I",
    leaguePoints: 512,
    wins: 142,
    losses: 98,
    lpTrend: 45,
    lastUpdated: Date.now() - 1000 * 60 * 120, // 2 hours ago
    matches: generateMatches(20, Date.now() - 3600 * 1000),
    championStats: [
      { championName: "Lee Sin", matches: 45, wins: 28, kills: 5.4, deaths: 3.2, assists: 6.8, cs: 180 },
      { championName: "Nidalee", matches: 32, wins: 20, kills: 5.8, deaths: 3.6, assists: 5.2, cs: 200 },
      { championName: "Viego", matches: 28, wins: 16, kills: 6.2, deaths: 4.1, assists: 5.5, cs: 210 }
    ]
  },
  {
    id: "puuid-3",
    name: "Shield",
    tagLine: "EUW",
    profileIconId: 101,
    tier: "MASTER",
    rank: "I",
    leaguePoints: 124,
    wins: 85,
    losses: 60,
    lpTrend: 100,
    lastUpdated: Date.now(), // Just now
    matches: generateMatches(20, Date.now() - 1800 * 1000),
    championStats: [
      { championName: "K'Sante", matches: 40, wins: 26, kills: 3.5, deaths: 2.8, assists: 6.1, cs: 220 },
      { championName: "Jax", matches: 25, wins: 16, kills: 4.2, deaths: 3.1, assists: 4.8, cs: 230 },
      { championName: "Renekton", matches: 18, wins: 12, kills: 4.8, deaths: 3.5, assists: 3.2, cs: 240 }
    ]
  },
  {
    id: "puuid-4",
    name: "Pulse",
    tagLine: "EUW",
    profileIconId: 85,
    tier: "CHALLENGER",
    rank: "I",
    leaguePoints: 756,
    wins: 165,
    losses: 105,
    lpTrend: -15,
    lastUpdated: Date.now() - 1000 * 60 * 45, // 45 mins ago
    matches: generateMatches(20, Date.now() - 2700 * 1000),
    championStats: [
      { championName: "Kai'Sa", matches: 58, wins: 35, kills: 7.1, deaths: 3.8, assists: 4.2, cs: 280 },
      { championName: "Xayah", matches: 34, wins: 20, kills: 6.5, deaths: 3.2, assists: 5.8, cs: 270 },
      { championName: "Ezreal", matches: 22, wins: 13, kills: 5.8, deaths: 3.5, assists: 6.1, cs: 260 }
    ]
  },
  {
    id: "puuid-5",
    name: "Aura",
    tagLine: "EUW",
    profileIconId: 72,
    tier: "GRANDMASTER",
    rank: "I",
    leaguePoints: 489,
    wins: 130,
    losses: 88,
    lpTrend: 28,
    lastUpdated: Date.now() - 1000 * 60 * 180, // 3 hours ago
    matches: generateMatches(20, Date.now() - 5400 * 1000),
    championStats: [
      { championName: "Rakan", matches: 42, wins: 26, kills: 1.8, deaths: 3.2, assists: 14.5, cs: 35 },
      { championName: "Thresh", matches: 35, wins: 20, kills: 1.5, deaths: 3.8, assists: 13.2, cs: 40 },
      { championName: "Nautilus", matches: 28, wins: 18, kills: 1.2, deaths: 4.1, assists: 12.8, cs: 30 }
    ]
  }
];

export const MOCK_AVAILABILITY = [
  {
    id: "av-1",
    playerId: "mock-player-1",
    playerName: "Theory",
    role: "mid",
    startTime: "2026-02-19T18:00:00",
    endTime: "2026-02-19T22:00:00",
    isAvailable: true,
    tenantId: "demo",
    createdBy: "demo",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "av-2",
    playerId: "mock-player-2",
    playerName: "Vortex",
    role: "jungle",
    startTime: "2026-02-19T18:00:00",
    endTime: "2026-02-19T22:00:00",
    isAvailable: true,
    tenantId: "demo",
    createdBy: "demo",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "av-3",
    playerId: "mock-player-3",
    playerName: "Shield",
    role: "top",
    startTime: "2026-02-19T18:00:00",
    endTime: "2026-02-19T22:00:00",
    isAvailable: true,
    tenantId: "demo",
    createdBy: "demo",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "av-4",
    playerId: "mock-player-4",
    playerName: "Pulse",
    role: "adc",
    startTime: "2026-02-19T18:00:00",
    endTime: "2026-02-19T22:00:00",
    isAvailable: true,
    tenantId: "demo",
    createdBy: "demo",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "av-5",
    playerId: "mock-player-5",
    playerName: "Aura",
    role: "support",
    startTime: "2026-02-19T18:00:00",
    endTime: "2026-02-19T22:00:00",
    isAvailable: true,
    tenantId: "demo",
    createdBy: "demo",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];



