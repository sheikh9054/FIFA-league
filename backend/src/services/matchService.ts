import { prisma } from '../lib/prisma';
import { calculateEloChange, getMatchScore } from '../utils/elo';
import { getPointsForResult, updateForm } from '../utils/standings';
import type { Server as SocketServer } from 'socket.io';
import { toJsonArray, toJsonObject } from '../utils/json';

interface RecordMatchInput {
  leagueId: string;
  homePlayerId: string;
  awayPlayerId: string;
  homeScore: number;
  awayScore: number;
  matchType?: string;
  notes?: string;
  screenshots?: string[];
  matchday?: number;
  status?: 'COMPLETED' | 'PENDING_APPROVAL';
  tournamentId?: string;
}

export async function recordLeagueMatch(input: RecordMatchInput, io?: SocketServer) {
  const { homePlayerId, awayPlayerId, homeScore, awayScore, leagueId } = input;

  if (homePlayerId === awayPlayerId) {
    throw new Error('Home and away players must be different');
  }

  const [home, away] = await Promise.all([
    prisma.player.findUnique({ where: { id: homePlayerId } }),
    prisma.player.findUnique({ where: { id: awayPlayerId } }),
  ]);

  if (!home || !away) throw new Error('Player not found');
  if (home.leagueId !== leagueId || away.leagueId !== leagueId) {
    throw new Error('Players must belong to the same league');
  }

  let winnerId: string | null = null;
  if (homeScore > awayScore) winnerId = homePlayerId;
  else if (awayScore > homeScore) winnerId = awayPlayerId;

  const homeEloChange = calculateEloChange(
    home.elo,
    away.elo,
    getMatchScore(homeScore, awayScore, true)
  );
  const awayEloChange = calculateEloChange(
    away.elo,
    home.elo,
    getMatchScore(homeScore, awayScore, false)
  );

  const homeResult: 'W' | 'D' | 'L' =
    homeScore > awayScore ? 'W' : homeScore < awayScore ? 'L' : 'D';
  const awayResult: 'W' | 'D' | 'L' =
    awayScore > homeScore ? 'W' : awayScore < homeScore ? 'L' : 'D';

  const homePoints = getPointsForResult(homeScore, awayScore, true);
  const awayPoints = getPointsForResult(homeScore, awayScore, false);

  const match = await prisma.$transaction(async (tx) => {
    const created = await tx.match.create({
      data: {
        leagueId,
        homePlayerId,
        awayPlayerId,
        homeScore,
        awayScore,
        winnerId,
        matchType: input.matchType || 'LEAGUE',
        status: input.status || 'COMPLETED',
        notes: input.notes,
        screenshots: toJsonArray(input.screenshots),
        matchday: input.matchday,
        tournamentId: input.tournamentId,
      },
      include: {
        homePlayer: true,
        awayPlayer: true,
        winner: true,
      },
    });

    if (created.status === 'COMPLETED' && created.matchType === 'LEAGUE') {
      await tx.player.update({
        where: { id: homePlayerId },
        data: {
          played: { increment: 1 },
          wins: homeResult === 'W' ? { increment: 1 } : undefined,
          draws: homeResult === 'D' ? { increment: 1 } : undefined,
          losses: homeResult === 'L' ? { increment: 1 } : undefined,
          goalsFor: { increment: homeScore },
          goalsAgainst: { increment: awayScore },
          goalDifference: { increment: homeScore - awayScore },
          points: { increment: homePoints },
          elo: home.elo + homeEloChange,
          currentForm: updateForm(home.currentForm, homeResult),
          cleanSheets: awayScore === 0 ? { increment: 1 } : undefined,
        },
      });

      await tx.player.update({
        where: { id: awayPlayerId },
        data: {
          played: { increment: 1 },
          wins: awayResult === 'W' ? { increment: 1 } : undefined,
          draws: awayResult === 'D' ? { increment: 1 } : undefined,
          losses: awayResult === 'L' ? { increment: 1 } : undefined,
          goalsFor: { increment: awayScore },
          goalsAgainst: { increment: homeScore },
          goalDifference: { increment: awayScore - homeScore },
          points: { increment: awayPoints },
          elo: away.elo + awayEloChange,
          currentForm: updateForm(away.currentForm, awayResult),
          cleanSheets: homeScore === 0 ? { increment: 1 } : undefined,
        },
      });

      await tx.eloHistory.createMany({
        data: [
          {
            playerId: homePlayerId,
            matchId: created.id,
            eloBefore: home.elo,
            eloAfter: home.elo + homeEloChange,
            change: homeEloChange,
            reason: 'League match',
          },
          {
            playerId: awayPlayerId,
            matchId: created.id,
            eloBefore: away.elo,
            eloAfter: away.elo + awayEloChange,
            change: awayEloChange,
            reason: 'League match',
          },
        ],
      });
    } else if (created.status === 'COMPLETED') {
      // Tournament / knockout still updates ELO
      await tx.player.update({
        where: { id: homePlayerId },
        data: { elo: home.elo + homeEloChange },
      });
      await tx.player.update({
        where: { id: awayPlayerId },
        data: { elo: away.elo + awayEloChange },
      });
    }

    await tx.activity.create({
      data: {
        leagueId,
        type: 'MATCH_RESULT',
        message: `${home.nickname || home.name} ${homeScore}-${awayScore} ${away.nickname || away.name}`,
        metadata: toJsonObject({ matchId: created.id }),
      },
    });

    return created;
  });

  if (io) {
    io.to(`league:${leagueId}`).emit('match:recorded', match);
    io.to(`league:${leagueId}`).emit('standings:updated', { leagueId });
    io.to(`league:${leagueId}`).emit('activity:new', {
      type: 'MATCH_RESULT',
      message: `${home.nickname || home.name} ${homeScore}-${awayScore} ${away.nickname || away.name}`,
    });
  }

  return match;
}

export async function recordFriendlyMatch(
  input: {
    homePlayerId: string;
    awayPlayerId: string;
    homeScore: number;
    awayScore: number;
    affectsElo?: boolean;
    notes?: string;
    screenshots?: string[];
  },
  io?: SocketServer
) {
  const { homePlayerId, awayPlayerId, homeScore, awayScore, affectsElo } = input;

  const [home, away] = await Promise.all([
    prisma.player.findUnique({ where: { id: homePlayerId } }),
    prisma.player.findUnique({ where: { id: awayPlayerId } }),
  ]);

  if (!home || !away) throw new Error('Player not found');

  const friendly = await prisma.$transaction(async (tx) => {
    const created = await tx.friendlyMatch.create({
      data: {
        homePlayerId,
        awayPlayerId,
        homeScore,
        awayScore,
        affectsElo: affectsElo ?? false,
        notes: input.notes,
        screenshots: toJsonArray(input.screenshots),
      },
      include: { homePlayer: true, awayPlayer: true },
    });

    if (affectsElo) {
      const homeChange = calculateEloChange(
        home.elo,
        away.elo,
        getMatchScore(homeScore, awayScore, true)
      );
      const awayChange = calculateEloChange(
        away.elo,
        home.elo,
        getMatchScore(homeScore, awayScore, false)
      );

      await tx.player.update({
        where: { id: homePlayerId },
        data: { elo: home.elo + homeChange },
      });
      await tx.player.update({
        where: { id: awayPlayerId },
        data: { elo: away.elo + awayChange },
      });

      await tx.eloHistory.createMany({
        data: [
          {
            playerId: homePlayerId,
            eloBefore: home.elo,
            eloAfter: home.elo + homeChange,
            change: homeChange,
            reason: 'Friendly match',
          },
          {
            playerId: awayPlayerId,
            eloBefore: away.elo,
            eloAfter: away.elo + awayChange,
            change: awayChange,
            reason: 'Friendly match',
          },
        ],
      });
    }

    return created;
  });

  if (io && home.leagueId) {
    io.to(`league:${home.leagueId}`).emit('friendly:recorded', friendly);
  }

  return friendly;
}
