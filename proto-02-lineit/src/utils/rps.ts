export type RpsChoice = 'rock' | 'paper' | 'scissors'
export type RpsOutcome = 'win' | 'lose' | 'draw'

export const RPS_LABELS: Record<RpsChoice, string> = {
  scissors: '가위',
  rock: '바위',
  paper: '보',
}

export const RPS_EMOJI: Record<RpsChoice, string> = {
  scissors: '✌️',
  rock: '✊',
  paper: '✋',
}

export function randomRpsChoice(random: () => number = Math.random): RpsChoice {
  const choices: RpsChoice[] = ['rock', 'paper', 'scissors']
  return choices[Math.floor(random() * 3)]!
}

export function getRpsOutcome(player: RpsChoice, enemy: RpsChoice): RpsOutcome {
  if (player === enemy) return 'draw'
  if (
    (player === 'rock' && enemy === 'scissors') ||
    (player === 'paper' && enemy === 'rock') ||
    (player === 'scissors' && enemy === 'paper')
  ) {
    return 'win'
  }
  return 'lose'
}
