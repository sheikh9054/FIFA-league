import { prisma } from '../lib/prisma';
import { sortStandings, computeWinPercentage } from '../utils/standings';

export async function getLeagueStats(leagueId: string) {
  const players = await prisma.player.findMany({ where: { leagueId } });
  const matches = await prisma.match.findMany({
    where: { leagueId, status: 'COMPLETED', matchType: 'LEAGUE' },
    orderBy: { playedAt: 'desc' },
  });
  const friendlies = await prisma.friendlyMatch.count({
    where: {
      OR: [
        { homePlayer: { leagueId } },
        { awayPlayer: { leagueId } },
      ],
    },
  });

  const sorted = sortStandings(players);
  const totalGoals = matches.reduce((s, m) => s + m.homeScore + m.awayScore, 0);

  const topScorers = [...players]
    .sort((a, b) => b.goalsFor - a.goalsFor)
    .slice(0, 5)
    .map((p) => ({
      ...p,
      winPercentage: computeWinPercentage(p.wins, p.played),
    }));

  const bestAttack = [...players].sort((a, b) => b.goalsFor - a.goalsFor)[0];
  const bestDefense = [...players].sort((a, b) => a.goalsAgainst - b.goalsAgainst)[0];
  const mostCleanSheets = [...players].sort((a, b) => b.cleanSheets - a.cleanSheets)[0];
  const eloLeaderboard = [...players].sort((a, b) => b.elo - a.elo).slice(0, 10);

  // Win streaks from recent matches
  const streaks: Record<string, number> = {};
  for (const p of players) streaks[p.id] = 0;

  for (const m of matches) {
    if (m.homeScore === m.awayScore) continue;
    const winnerId = m.homeScore > m.awayScore ? m.homePlayerId : m.awayPlayerId;
    const loserId = m.homeScore > m.awayScore ? m.awayPlayerId : m.homePlayerId;
    if (streaks[winnerId] === undefined) streaks[winnerId] = 0;
    if (streaks[loserId] === undefined) streaks[loserId] = 0;
    if (streaks[winnerId] >= 0) streaks[winnerId]++;
    else streaks[winnerId] = 1;
    streaks[loserId] = -1;
  }

  const highestStreak = Object.entries(streaks).sort((a, b) => b[1] - a[1])[0];
  const streakPlayer = highestStreak
    ? players.find((p) => p.id === highestStreak[0])
    : null;

  const mostActive = [...players].sort((a, b) => b.played - a.played)[0];

  return {
    totalMatches: matches.length,
    totalFriendlies: friendlies,
    totalGoals,
    avgGoalsPerMatch: matches.length ? (totalGoals / matches.length).toFixed(2) : '0',
    topScorers,
    bestAttack,
    bestDefense,
    mostCleanSheets,
    eloLeaderboard,
    highestWinStreak: { player: streakPlayer, streak: highestStreak?.[1] ?? 0 },
    mostActivePlayer: mostActive,
    standings: sorted.map((p, i) => ({
      rank: i + 1,
      ...p,
      winPercentage: computeWinPercentage(p.wins, p.played),
    })),
  };
}

export async function getDashboard(leagueId: string) {
  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    include: {
      players: { orderBy: { points: 'desc' }, take: 5 },
    },
  });

  if (!league) throw new Error('League not found');

  const recentMatches = await prisma.match.findMany({
    where: { leagueId },
    orderBy: { playedAt: 'desc' },
    take: 6,
    include: { homePlayer: true, awayPlayer: true },
  });

  const upcomingFixtures = await prisma.fixture.findMany({
    where: { leagueId, status: 'SCHEDULED' },
    orderBy: { scheduledAt: 'asc' },
    take: 6,
  });

  const stats = await getLeagueStats(leagueId);

  const activities = await prisma.activity.findMany({
    where: { leagueId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return {
    league,
    stats: {
      totalMatches: stats.totalMatches,
      totalPlayers: league.players.length,
      topPlayer: stats.standings[0],
    },
    topPlayers: stats.standings.slice(0, 5),
    recentMatches,
    upcomingFixtures,
    activities,
  };
}
