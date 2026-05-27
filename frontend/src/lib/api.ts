const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.REACT_APP_API_URL ||
  "https://fifa-league-1.onrender.com";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null | undefined
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(err.error || "Request failed", res.status);
  }

  return res.json();
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: User }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    register: (email: string, password: string, name: string) =>
      request<{ token: string; user: User }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, name }),
      }),
    guest: (name?: string) =>
      request<{ token: string; user: User }>("/api/auth/guest", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    me: (token: string) => request<User>("/api/auth/me", {}, token),
  },
  leagues: {
    list: (token?: string | null) => request<League[]>("/api/leagues", {}, token),
    get: (id: string, token?: string | null) => request<League>(`/api/leagues/${id}`, {}, token),
    dashboard: (id: string, token?: string | null) =>
      request<DashboardData>(`/api/leagues/${id}/dashboard`, {}, token),
    create: (data: Partial<League>, token: string) =>
      request<League>("/api/leagues", { method: "POST", body: JSON.stringify(data) }, token),
  },
  players: {
    byLeague: (leagueId: string, token?: string | null) =>
      request<Player[]>(`/api/players/league/${leagueId}`, {}, token),
    get: (id: string, token?: string | null) =>
      request<PlayerDetail>(`/api/players/${id}`, {}, token),
    create: (data: Partial<Player>, token: string) =>
      request<Player>("/api/players", { method: "POST", body: JSON.stringify(data) }, token),
  },
  standings: {
    get: (leagueId: string, token?: string | null) =>
      request<StandingPlayer[]>(`/api/standings/${leagueId}`, {}, token),
    full: (leagueId: string, token?: string | null) =>
      request<LeagueStats>(`/api/standings/${leagueId}/full`, {}, token),
  },
  matches: {
    byLeague: (leagueId: string, token?: string | null) =>
      request<Match[]>(`/api/matches/league/${leagueId}`, {}, token),
    record: (data: RecordMatchInput, token: string) =>
      request<Match>("/api/matches", { method: "POST", body: JSON.stringify(data) }, token),
  },
  friendlies: {
    byLeague: (leagueId: string, token?: string | null) =>
      request<FriendlyMatch[]>(`/api/friendlies/league/${leagueId}`, {}, token),
    record: (data: RecordFriendlyInput, token: string) =>
      request<FriendlyMatch>("/api/friendlies", { method: "POST", body: JSON.stringify(data) }, token),
    leaderboard: (leagueId: string, token?: string | null) =>
      request<FriendlyLeaderboardEntry[]>(`/api/friendlies/leaderboard/${leagueId}`, {}, token),
  },
  fixtures: {
    byLeague: (leagueId: string, token?: string | null) =>
      request<Fixture[]>(`/api/fixtures/league/${leagueId}`, {}, token),
    generate: (data: GenerateFixturesInput, token: string) =>
      request<{ count: number }>("/api/fixtures/generate", { method: "POST", body: JSON.stringify(data) }, token),
  },
  stats: {
    get: (leagueId: string, token?: string | null) =>
      request<LeagueStats>(`/api/stats/${leagueId}`, {}, token),
    eloHistory: (leagueId: string, playerId: string, token?: string | null) =>
      request<EloHistoryPoint[]>(`/api/stats/${leagueId}/elo-history/${playerId}`, {}, token),
    activity: (leagueId: string, token?: string | null) =>
      request<Activity[]>(`/api/stats/${leagueId}/activity`, {}, token),
  },
  tournaments: {
    byLeague: (leagueId: string, token?: string | null) =>
      request<Tournament[]>(`/api/tournaments/league/${leagueId}`, {}, token),
  },
  announcements: {
    byLeague: (leagueId: string, token?: string | null) =>
      request<Announcement[]>(`/api/announcements/league/${leagueId}`, {}, token),
  },
  admin: {
    export: (leagueId: string, token: string) =>
      request<unknown>(`/api/admin/export/${leagueId}`, {}, token),
    resetElo: (leagueId: string, token: string) =>
      request<{ message: string }>(`/api/admin/elo-reset/${leagueId}`, { method: "POST" }, token),
  },
};

export interface User {
  id: string;
  email?: string;
  name?: string;
  role: "ADMIN" | "USER" | "GUEST";
  avatar?: string;
  isGuest?: boolean;
}

export interface League {
  id: string;
  name: string;
  logo?: string;
  banner?: string;
  season: string;
  description?: string;
  inviteCode?: string;
}

export interface Player {
  id: string;
  leagueId: string;
  name: string;
  nickname?: string;
  avatar?: string;
  country?: string;
  favoriteClub?: string;
  elo: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  currentForm?: string;
  winPercentage?: number;
  cleanSheets?: number;
}

export interface StandingPlayer extends Player {
  rank: number;
}

export interface Match {
  id: string;
  leagueId: string;
  homePlayerId: string;
  awayPlayerId: string;
  homeScore: number;
  awayScore: number;
  matchType: string;
  status: string;
  notes?: string;
  playedAt: string;
  homePlayer: Player;
  awayPlayer: Player;
}

export interface FriendlyMatch {
  id: string;
  homePlayerId: string;
  awayPlayerId: string;
  homeScore: number;
  awayScore: number;
  affectsElo: boolean;
  playedAt: string;
  homePlayer: Player;
  awayPlayer: Player;
}

export interface Fixture {
  id: string;
  homePlayerId: string;
  awayPlayerId: string;
  matchday: number;
  scheduledAt?: string;
  status: string;
  homePlayer?: Player;
  awayPlayer?: Player;
}

export interface DashboardData {
  league: League;
  stats: { totalMatches: number; totalPlayers: number; topPlayer?: StandingPlayer };
  topPlayers: StandingPlayer[];
  recentMatches: Match[];
  upcomingFixtures: Fixture[];
  activities: Activity[];
}

export interface LeagueStats {
  totalMatches: number;
  totalGoals: number;
  avgGoalsPerMatch: string;
  topScorers: Player[];
  bestAttack?: Player;
  bestDefense?: Player;
  mostCleanSheets?: Player;
  highestWinStreak?: { player?: Player; streak: number };
  mostActivePlayer?: Player;
  eloLeaderboard: Player[];
  standings: StandingPlayer[];
}

export interface Activity {
  id: string;
  type: string;
  message: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  user: { name?: string };
}

export interface Tournament {
  id: string;
  name: string;
  format: string;
  status: string;
}

export interface PlayerDetail extends Player {
  matchHistory: Match[];
  eloHistory: EloHistoryPoint[];
}

export interface EloHistoryPoint {
  eloBefore: number;
  eloAfter: number;
  change: number;
  createdAt: string;
}

export interface RecordMatchInput {
  leagueId: string;
  homePlayerId: string;
  awayPlayerId: string;
  homeScore: number;
  awayScore: number;
  notes?: string;
  matchType?: string;
}

export interface RecordFriendlyInput {
  homePlayerId: string;
  awayPlayerId: string;
  homeScore: number;
  awayScore: number;
  affectsElo?: boolean;
  notes?: string;
}

export interface GenerateFixturesInput {
  leagueId: string;
  format: "round_robin" | "knockout" | "groups";
  playerIds: string[];
  groupSize?: number;
}

export interface FriendlyLeaderboardEntry {
  player: Player;
  wins: number;
  draws: number;
  losses: number;
  played: number;
  gf: number;
  ga: number;
  gd: number;
}
