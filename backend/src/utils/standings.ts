import type { Player } from '@prisma/client';

export function computeWinPercentage(wins: number, played: number): number {
  if (played === 0) return 0;
  return Math.round((wins / played) * 1000) / 10;
}

export function updateForm(currentForm: string, result: 'W' | 'D' | 'L', maxLen = 5): string {
  const form = (currentForm + result).slice(-maxLen);
  return form;
}

export function sortStandings(players: Player[]): Player[] {
  return [...players].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return b.elo - a.elo;
  });
}

export function getPointsForResult(homeScore: number, awayScore: number, isHome: boolean): number {
  if (homeScore === awayScore) return 1;
  const homeWins = homeScore > awayScore;
  if (isHome) return homeWins ? 3 : 0;
  return homeWins ? 0 : 3;
}
