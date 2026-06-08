type RandomFn = () => number

function mulberry32(seed: number): RandomFn {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export class MazeGenerator {
  private readonly directions: Array<[number, number]> = [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ]

  /**
   * width × height 개의 "셀"을 갖는 미로를 생성합니다.
   * 반환 격자 크기: (2*height+1) × (2*width+1), 0=길, 1=벽
   */
  generate(width: number, height: number, seed?: number): number[][] {
    if (width < 1 || height < 1) {
      throw new Error('width와 height는 1 이상이어야 합니다.')
    }

    const random = seed != null ? mulberry32(seed) : Math.random
    const gridWidth = 2 * width + 1
    const gridHeight = 2 * height + 1

    const grid: number[][] = Array.from({ length: gridHeight }, () =>
      Array.from({ length: gridWidth }, () => 1)
    )

    const visited: boolean[][] = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => false)
    )

    const inCellBounds = (cx: number, cy: number): boolean =>
      cx >= 0 && cx < width && cy >= 0 && cy < height

    const shuffle = <T>(arr: T[]): T[] => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1))
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
      }
      return arr
    }

    const cellToGrid = (cx: number, cy: number): { gx: number; gy: number } => ({
      gx: 2 * cx + 1,
      gy: 2 * cy + 1,
    })

    const carveFrom = (cx: number, cy: number): void => {
      visited[cy][cx] = true
      const { gx, gy } = cellToGrid(cx, cy)
      grid[gy][gx] = 0

      for (const [dx, dy] of shuffle([...this.directions])) {
        const nx = cx + dx
        const ny = cy + dy
        if (!inCellBounds(nx, ny) || visited[ny][nx]) continue

        const between = cellToGrid(cx, cy)
        between.gx += dx
        between.gy += dy
        grid[between.gy][between.gx] = 0

        const next = cellToGrid(nx, ny)
        grid[next.gy][next.gx] = 0
        carveFrom(nx, ny)
      }
    }

    carveFrom(0, 0)

    const start = cellToGrid(0, 0)
    const goal = cellToGrid(width - 1, height - 1)
    grid[start.gy][start.gx] = 0
    grid[goal.gy][goal.gx] = 0

    // 외곽 입구/출구 (참고 이미지처럼 경계에 구멍)
    grid[start.gy][0] = 0 // 시작 셀 왼쪽
    grid[0][start.gx] = 0 // 시작 셀 위쪽
    grid[goal.gy][gridWidth - 1] = 0 // 목표 셀 오른쪽
    grid[gridHeight - 1][goal.gx] = 0 // 목표 셀 아래쪽

    return grid
  }
}
