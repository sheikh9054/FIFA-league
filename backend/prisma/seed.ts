import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const adminHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@fifaleague.local' },
    update: {},
    create: {
      email: 'admin@fifaleague.local',
      name: 'League Admin',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  });

  const league = await prisma.league.upsert({
    where: { id: 'seed-league-1' },
    update: {},
    create: {
      id: 'seed-league-1',
      name: 'FC 25 Champions League',
      season: '2025/26',
      description: 'Local FIFA 25 league for friends',
      logo: '/images/league-logo.png',
      banner: '/images/league-banner.jpg',
      inviteCode: 'FC25LOCAL',
      isPublic: true,
    },
  });

  const playersData = [
    { name: 'Alex Martinez', nickname: 'AM10', country: 'ES', favoriteClub: 'Real Madrid', elo: 1620 },
    { name: 'Jordan Lee', nickname: 'JL_Pro', country: 'GB', favoriteClub: 'Manchester City', elo: 1580 },
    { name: 'Marco Rossi', nickname: 'RossiFC', country: 'IT', favoriteClub: 'Inter Milan', elo: 1540 },
    { name: 'Sam Okafor', nickname: 'SamStrike', country: 'NG', favoriteClub: 'Arsenal', elo: 1510 },
    { name: 'Diego Silva', nickname: 'DS_FUT', country: 'BR', favoriteClub: 'Barcelona', elo: 1480 },
    { name: 'Chris Weber', nickname: 'Weber11', country: 'DE', favoriteClub: 'Bayern Munich', elo: 1450 },
    { name: 'Yuki Tanaka', nickname: 'YT_Ace', country: 'JP', favoriteClub: 'PSG', elo: 1520 },
    { name: 'Liam Murphy', nickname: 'MurphGK', country: 'IE', favoriteClub: 'Liverpool', elo: 1490 },
  ];

  const players = [];
  for (const p of playersData) {
    const player = await prisma.player.upsert({
      where: { id: `seed-player-${p.nickname}` },
      update: {},
      create: {
        id: `seed-player-${p.nickname}`,
        leagueId: league.id,
        name: p.name,
        nickname: p.nickname,
        country: p.country,
        favoriteClub: p.favoriteClub,
        elo: p.elo,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.nickname}`,
      },
    });
    players.push(player);
  }

  // Sample completed matches
  const matchResults = [
    [0, 1, 3, 1],
    [2, 3, 2, 2],
    [4, 5, 1, 0],
    [6, 7, 4, 2],
    [0, 2, 2, 1],
    [1, 3, 3, 0],
    [4, 6, 2, 2],
    [5, 7, 0, 3],
  ];

  for (let i = 0; i < matchResults.length; i++) {
    const [hi, ai, hs, as] = matchResults[i];
    const home = players[hi];
    const away = players[ai];
    let winnerId: string | null = null;
    if (hs > as) winnerId = home.id;
    else if (as > hs) winnerId = away.id;

    await prisma.match.upsert({
      where: { id: `seed-match-${i}` },
      update: {},
      create: {
        id: `seed-match-${i}`,
        leagueId: league.id,
        homePlayerId: home.id,
        awayPlayerId: away.id,
        homeScore: hs,
        awayScore: as,
        winnerId,
        matchType: 'LEAGUE',
        status: 'COMPLETED',
        matchday: Math.floor(i / 4) + 1,
        playedAt: new Date(Date.now() - (matchResults.length - i) * 86400000),
      },
    });
  }

  // Update player stats from matches
  for (const player of players) {
    const homeM = await prisma.match.findMany({
      where: { homePlayerId: player.id, matchType: 'LEAGUE', status: 'COMPLETED' },
    });
    const awayM = await prisma.match.findMany({
      where: { awayPlayerId: player.id, matchType: 'LEAGUE', status: 'COMPLETED' },
    });

    let played = 0, wins = 0, draws = 0, losses = 0, gf = 0, ga = 0, points = 0, form = '';

    for (const m of [...homeM, ...awayM].sort((a, b) => a.playedAt.getTime() - b.playedAt.getTime())) {
      const isHome = m.homePlayerId === player.id;
      const scored = isHome ? m.homeScore : m.awayScore;
      const conceded = isHome ? m.awayScore : m.homeScore;
      played++;
      gf += scored;
      ga += conceded;
      if (scored > conceded) {
        wins++;
        points += 3;
        form += 'W';
      } else if (scored < conceded) {
        losses++;
        form += 'L';
      } else {
        draws++;
        points += 1;
        form += 'D';
      }
    }

    await prisma.player.update({
      where: { id: player.id },
      data: {
        played,
        wins,
        draws,
        losses,
        goalsFor: gf,
        goalsAgainst: ga,
        goalDifference: gf - ga,
        points,
        currentForm: form.slice(-5),
      },
    });
  }

  await prisma.announcement.create({
    data: {
      leagueId: league.id,
      userId: admin.id,
      title: 'Welcome to FC 25 Champions League!',
      content: 'Season 2025/26 is live. Record your matches and climb the standings!',
    },
  });

  await prisma.tournament.create({
    data: {
      leagueId: league.id,
      name: 'Weekend Cup #1',
      format: 'KNOCKOUT',
      status: 'active',
    },
  });

  console.log('✅ Seed complete!');
  console.log('   Admin: admin@fifaleague.local / admin123');
  console.log('   League invite code: FC25LOCAL');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
