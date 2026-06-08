#!/usr/bin/env node
/**
 * 모든 레벨이 start→goal로 도달 가능한지 검증 (미로 통과 기준)
 * npm run validate:levels
 */
import {
  LEVEL_TEST_SEEDS,
  TOTAL_LEVELS,
  createLevel,
  isLevelConnected,
} from '../src/data/levels.ts'
import {
  canApproachCellAvoiding,
  canReachCellAvoiding,
  shortestPathLength,
} from '../src/utils/maze.ts'

function posKey(p) {
  return `${p.col},${p.row}`
}

let failed = 0

for (let levelIndex = 0; levelIndex < TOTAL_LEVELS; levelIndex++) {
  for (const seed of LEVEL_TEST_SEEDS) {
    let level
    try {
      level = createLevel(levelIndex, seed)
    } catch (err) {
      console.error(
        `❌ Level ${levelIndex + 1} (seed=${seed}): generation failed — ${err.message}`
      )
      failed++
      continue
    }

    if (!isLevelConnected(level)) {
      console.error(`❌ Level ${level.id} (seed=${seed}): start/goal unreachable`)
      failed++
      continue
    }

    const shortest = shortestPathLength(level, level.start, level.goal)
    if (shortest == null || shortest !== level.solutionLength) {
      console.error(
        `❌ Level ${level.id} (seed=${seed}): solution length mismatch (${shortest} vs ${level.solutionLength})`
      )
      failed++
      continue
    }

    const enemies = level.dungeonObjects.filter((o) => o.type === 'E')
    const enemyKeys = new Set(enemies.map(posKey))
    const chests = level.dungeonObjects.filter((o) => o.type === 'C')
    let levelOk = true

    for (const enemy of enemies) {
      const others = new Set(
        enemies.filter((o) => o !== enemy).map(posKey)
      )
      if (!canApproachCellAvoiding(level, enemy, others)) {
        console.error(
          `❌ Level ${level.id} (seed=${seed}): enemy at (${enemy.col},${enemy.row}) not approachable`
        )
        failed++
        levelOk = false
      }
    }

    for (const chest of chests) {
      if (!canReachCellAvoiding(level, level.start, chest, enemyKeys)) {
        console.error(
          `❌ Level ${level.id} (seed=${seed}): chest at (${chest.col},${chest.row}) unreachable`
        )
        failed++
        levelOk = false
      }
    }

    if (levelOk) {
      console.log(
        `✓ Level ${level.id} seed=${seed} (${level.cellCols}x${level.cellRows}, shortest=${shortest}, chests=${chests.length})`
      )
    }
  }
}

if (failed > 0) process.exit(1)
console.log(`\nAll ${TOTAL_LEVELS} level specs solvable across test seeds.`)
