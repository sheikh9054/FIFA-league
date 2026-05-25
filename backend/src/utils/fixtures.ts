export interface FixturePair {
  homePlayerId: string;
  awayPlayerId: string;
  matchday: number;
}

/** Round-robin fixture generator (circle method) */
export function generateRoundRobin(playerIds: string[]): FixturePair[] {
  const n = playerIds.length;
  if (n < 2) return [];

  const ids = [...playerIds];
  if (n % 2 !== 0) ids.push('BYE');

  const count = ids.length;
  const rounds = count - 1;
  const half = count / 2;
  const fixtures: FixturePair[] = [];

  const rotating = ids.slice(1);

  for (let round = 0; round < rounds; round++) {
    const matchday = round + 1;
    const roundPlayers = [ids[0], ...rotating];

    for (let i = 0; i < half; i++) {
      const home = roundPlayers[i];
      const away = roundPlayers[count - 1 - i];
      if (home !== 'BYE' && away !== 'BYE') {
        fixtures.push({
          homePlayerId: home,
          awayPlayerId: away,
          matchday,
        });
      }
    }

    rotating.unshift(rotating.pop()!);
  }

  return fixtures;
}

/** Knockout bracket - first round pairings */
export function generateKnockoutPairings(playerIds: string[]): FixturePair[] {
  const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
  const fixtures: FixturePair[] = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    if (shuffled[i + 1]) {
      fixtures.push({
        homePlayerId: shuffled[i],
        awayPlayerId: shuffled[i + 1],
        matchday: 1,
      });
    }
  }
  return fixtures;
}

/** Champions League style: split into groups then round robin within group */
export function generateGroupFixtures(
  playerIds: string[],
  groupSize = 4
): { groupName: string; fixtures: FixturePair[] }[] {
  const groups: string[][] = [];
  const shuffled = [...playerIds].sort(() => Math.random() - 0.5);

  for (let i = 0; i < shuffled.length; i += groupSize) {
    groups.push(shuffled.slice(i, i + groupSize));
  }

  return groups.map((group, idx) => ({
    groupName: String.fromCharCode(65 + idx),
    fixtures: generateRoundRobin(group).map((f) => ({ ...f, matchday: f.matchday })),
  }));
}
