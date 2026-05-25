const DEFAULT_ELO = 1500;
const K_FACTOR = 32;
const UPSET_THRESHOLD = 100;

export function getDefaultElo(): number {
  return DEFAULT_ELO;
}

export function calculateEloChange(
  playerElo: number,
  opponentElo: number,
  score: number // 1 = win, 0.5 = draw, 0 = loss
): number {
  const expected = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  let change = Math.round(K_FACTOR * (score - expected));

  // Upset bonus: lower-rated player beats higher-rated
  if (score === 1 && opponentElo - playerElo >= UPSET_THRESHOLD) {
    change += Math.floor((opponentElo - playerElo) / 50);
  }
  if (score === 0 && playerElo - opponentElo >= UPSET_THRESHOLD) {
    change -= Math.floor((playerElo - opponentElo) / 80);
  }

  return change;
}

export function getMatchScore(homeScore: number, awayScore: number, isHome: boolean): number {
  if (homeScore === awayScore) return 0.5;
  const homeWins = homeScore > awayScore;
  if (isHome) return homeWins ? 1 : 0;
  return homeWins ? 0 : 1;
}
