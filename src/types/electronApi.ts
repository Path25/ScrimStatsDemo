
export interface TeamRosterResponse {
  user: {
    id: string;
    email: string;
    role: string;
  };
  team: {
    id: string;
    name: string;
    slug: string;
  };
  roster: PlayerInfo[];
}

export interface PlayerInfo {
  id: string;
  summoner_name: string;
  riot_id: string | null;
  role: string | null;
  rank: string | null;
  lp: number | null;
}

export interface ElectronApiError {
  error: string;
}

export type TeamRosterApiResponse = TeamRosterResponse | ElectronApiError;

// Helper type guard
export function isTeamRosterError(response: TeamRosterApiResponse): response is ElectronApiError {
  return 'error' in response;
}
