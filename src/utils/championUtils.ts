
// Champion ID to name mapping based on League of Legends data
// This is a subset of common champions - can be expanded as needed
export const CHAMPION_ID_MAP: Record<number, string> = {
  1: "Annie",
  2: "Olaf",
  3: "Galio",
  4: "Twisted Fate",
  5: "Xin Zhao",
  6: "Urgot",
  7: "LeBlanc",
  8: "Vladimir",
  9: "Fiddlesticks",
  10: "Kayle",
  11: "Master Yi",
  12: "Alistar",
  13: "Ryze",
  14: "Sion",
  15: "Sivir",
  16: "Soraka",
  17: "Teemo",
  18: "Tristana",
  19: "Warwick",
  20: "Nunu & Willump",
  21: "Miss Fortune",
  22: "Ashe",
  23: "Tryndamere",
  24: "Jax",
  25: "Morgana",
  26: "Zilean",
  27: "Singed",
  28: "Evelynn",
  29: "Twitch",
  30: "Karthus",
  31: "Cho'Gath",
  32: "Amumu",
  33: "Rammus",
  34: "Anivia",
  35: "Shaco",
  36: "Dr. Mundo",
  37: "Sona",
  38: "Kassadin",
  39: "Irelia",
  40: "Janna",
  41: "Gangplank",
  42: "Corki",
  43: "Karma",
  44: "Taric",
  45: "Veigar",
  48: "Trundle",
  50: "Swain",
  51: "Caitlyn",
  53: "Blitzcrank",
  54: "Malphite",
  55: "Katarina",
  56: "Nocturne",
  57: "Maokai",
  58: "Renekton",
  59: "Jarvan IV",
  60: "Elise",
  61: "Orianna",
  62: "Wukong",
  63: "Brand",
  64: "Lee Sin",
  67: "Vayne",
  68: "Rumble",
  69: "Cassiopeia",
  72: "Skarner",
  74: "Heimerdinger",
  75: "Nasus",
  76: "Nidalee",
  77: "Udyr",
  78: "Poppy",
  79: "Gragas",
  80: "Pantheon",
  81: "Ezreal",
  82: "Mordekaiser",
  83: "Yorick",
  84: "Akali",
  85: "Kennen",
  86: "Garen",
  89: "Leona",
  90: "Malzahar",
  91: "Talon",
  92: "Riven",
  96: "Kog'Maw",
  98: "Shen",
  99: "Lux",
  101: "Xerath",
  102: "Shyvana",
  103: "Ahri",
  104: "Graves",
  105: "Fizz",
  106: "Volibear",
  107: "Rengar",
  110: "Varus",
  111: "Nautilus",
  112: "Viktor",
  113: "Sejuani",
  114: "Fiora",
  115: "Ziggs",
  117: "Lulu",
  119: "Draven",
  120: "Hecarim",
  121: "Kha'Zix",
  122: "Darius",
  126: "Jayce",
  127: "Lissandra",
  131: "Diana",
  133: "Quinn",
  134: "Syndra",
  136: "Aurelion Sol",
  141: "Kayn",
  142: "Zoe",
  143: "Zyra",
  145: "Kai'Sa",
  147: "Seraphine",
  150: "Gnar",
  154: "Zac",
  157: "Yasuo",
  161: "Vel'Koz",
  163: "Taliyah",
  164: "Camille",
  166: "Akshan",
  200: "Bel'Veth",
  201: "Braum",
  202: "Jhin",
  203: "Kindred",
  221: "Zeri",
  222: "Jinx",
  223: "Tahm Kench",
  234: "Viego",
  235: "Senna",
  236: "Lucian",
  238: "Zed",
  240: "Kled",
  245: "Ekko",
  246: "Qiyana",
  254: "Vi",
  266: "Aatrox",
  267: "Nami",
  268: "Azir",
  350: "Yuumi",
  360: "Samira",
  412: "Thresh",
  420: "Illaoi",
  421: "Rek'Sai",
  427: "Ivern",
  429: "Kalista",
  432: "Bard",
  516: "Ornn",
  517: "Sylas",
  518: "Neeko",
  523: "Aphelios",
  526: "Rell",
  555: "Pyke",
  711: "Vex",
  777: "Yone",
  875: "Sett",
  876: "Lillia",
  887: "Gwen",
  888: "Renata Glasc",
  895: "Nilah",
  897: "K'Sante",
  901: "Smolder",
  902: "Milio",
  910: "Hwei",
  950: "Naafiri"
};

/**
 * Convert champion ID to champion name
 */
export const getChampionName = (championId: number): string => {
  return CHAMPION_ID_MAP[championId] || `Champion ${championId}`;
};

/**
 * Convert champion name to ID (reverse lookup)
 */
export const getChampionId = (championName: string): number | null => {
  const entry = Object.entries(CHAMPION_ID_MAP).find(
    ([id, name]) => name.toLowerCase() === championName.toLowerCase()
  );
  return entry ? parseInt(entry[0]) : null;
};

/**
 * Parse raw champion select data into a more readable format
 */
export interface ParsedChampionSelectData {
  phase: string;
  isCompleted: boolean;
  ourTeam: {
    cellId: number;
    championId: number;
    championName: string;
    summonerName: string;
    position: string;
    spell1Id: number;
    spell2Id: number;
  }[];
  theirTeam: {
    cellId: number;
    championId: number;
    championName: string;
    summonerName: string;
    position: string;
    spell1Id: number;
    spell2Id: number;
  }[];
  ourBans: {
    championId: number;
    championName: string;
    order: number;
  }[];
  theirBans: {
    championId: number;
    championName: string;
    order: number;
  }[];
  gameInfo: {
    gameId: number;
    isCustomGame: boolean;
    phase: string;
    timeLeftInPhase: number;
  };
}

export const parseChampionSelectData = (rawData: any): ParsedChampionSelectData => {
  const ourTeam = (rawData.myTeam || []).map((player: any, index: number) => ({
    cellId: player.cellId || index,
    championId: player.championId || 0,
    championName: getChampionName(player.championId || 0),
    summonerName: player.gameName || player.playerAlias || 'Unknown',
    position: player.assignedPosition || '',
    spell1Id: player.spell1Id || 0,
    spell2Id: player.spell2Id || 0,
  }));

  const theirTeam = (rawData.theirTeam || []).map((player: any, index: number) => ({
    cellId: player.cellId || index,
    championId: player.championId || 0,
    championName: getChampionName(player.championId || 0),
    summonerName: player.gameName || player.playerAlias || 'Unknown',
    position: player.assignedPosition || '',
    spell1Id: player.spell1Id || 0,
    spell2Id: player.spell2Id || 0,
  }));

  const ourBans = (rawData.bans?.myTeamBans || []).map((championId: number, index: number) => ({
    championId,
    championName: getChampionName(championId),
    order: index + 1,
  }));

  const theirBans = (rawData.bans?.theirTeamBans || []).map((championId: number, index: number) => ({
    championId,
    championName: getChampionName(championId),
    order: index + 1,
  }));

  return {
    phase: rawData.timer?.phase || 'unknown',
    isCompleted: rawData.timer?.phase === 'FINALIZATION',
    ourTeam,
    theirTeam,
    ourBans,
    theirBans,
    gameInfo: {
      gameId: rawData.gameId || 0,
      isCustomGame: rawData.isCustomGame || false,
      phase: rawData.timer?.phase || 'unknown',
      timeLeftInPhase: rawData.timer?.adjustedTimeLeftInPhase || 0,
    },
  };
};
