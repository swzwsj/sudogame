/**
 * 数独求解器模块
 * 提供数独谜题的生成、求解和验证功能
 */
class SudokuSolver {
  constructor() {
    // 初始化难度级别配置
    this.difficultyLevels = {
      easy: { removeCount: 30, minCount: 45 },
      medium: { removeCount: 40, minCount: 35 },
      hard: { removeCount: 50, minCount: 25 },
      expert: { removeCount: 55, minCount: 20 },
      master: { removeCount: 60, minCount: 17 }
    };
  }

  /**
   * 检查在指定位置放置数字是否有效
   * @param {Array} grid - 数独网格
   * @param {number} row - 行索引
   * @param {number} col - 列索引
   * @param {number} num - 要放置的数字
   * @returns {boolean} - 放置是否有效
   */
  isValidPlacement(grid, row, col, num) {
    // 检查行
    for (let x = 0; x < 9; x++) {
      if (grid[row][x] === num) return false;
    }

    // 检查列
    for (let x = 0; x < 9; x++) {
      if (grid[x][col] === num) return false;
    }

    // 检查3x3宫格
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (grid[i + startRow][j + startCol] === num) return false;
      }
    }

    return true;
  }

  /**
   * 检查数独是否已完成
   * @param {Array} grid - 数独网格
   * @returns {boolean} - 是否完成
   */
  isPuzzleComplete(grid) {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === 0) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * 使用回溯算法和MRV启发式求解数独
   * @param {Array} grid - 数独网格
   * @param {boolean} [randomize=false] - 是否随机化尝试顺序
   * @returns {boolean} - 是否成功求解
   */
  solveGrid(grid, randomize = false) {
    // 找到所有空格
    const emptyCells = [];
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === 0) {
          // 计算每个空格可能的数字数量（MRV启发式）
          const possibilities = [];
          for (let num = 1; num <= 9; num++) {
            if (this.isValidPlacement(grid, row, col, num)) {
              possibilities.push(num);
            }
          }
          emptyCells.push({ row, col, possibilities });
        }
      }
    }

    // 如果没有空格，说明数独已解决
    if (emptyCells.length === 0) {
      return true;
    }

    // 按可能数字数量排序（MRV启发式）
    emptyCells.sort((a, b) => a.possibilities.length - b.possibilities.length);
    const { row, col, possibilities } = emptyCells[0];

    // 如果随机化，打乱可能性顺序
    if (randomize && possibilities.length > 1) {
      for (let i = possibilities.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [possibilities[i], possibilities[j]] = [possibilities[j], possibilities[i]];
      }
    }

    // 尝试填充每个可能的数字
    for (const num of possibilities) {
      if (this.isValidPlacement(grid, row, col, num)) {
        grid[row][col] = num;

        // 递归求解剩余部分
        if (this.solveGrid(grid, randomize)) {
          return true;
        }

        // 回溯
        grid[row][col] = 0;
      }
    }

    return false;
  }

  /**
   * 生成完整的数独网格
   * @returns {Array} - 生成的完整数独网格
   */
  generateFullSudoku() {
    // 创建空网格
    const grid = Array(9).fill().map(() => Array(9).fill(0));

    // 使用随机化的solveGrid生成完整数独
    this.solveGrid(grid, true);

    return grid;
  }

  /**
   * 从完整数独中移除数字生成谜题
   * @param {Array} fullGrid - 完整的数独网格
   * @param {string} difficulty - 难度级别
   * @returns {Array} - 生成的谜题网格
   */
  removeNumbers(fullGrid, difficulty) {
    // 创建网格的深拷贝
    const puzzleGrid = JSON.parse(JSON.stringify(fullGrid));
    
    // 获取难度配置
    const config = this.difficultyLevels[difficulty] || this.difficultyLevels.medium;
    let cellsToRemove = config.removeCount;
    
    // 存储已移除的位置，用于回滚
    const removedPositions = [];
    
    // 创建Fisher-Yates洗牌的位置数组
    const positions = [];
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        positions.push({ row, col });
      }
    }
    
    // 洗牌位置数组
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    
    // 移除数字，同时确保数独仍有唯一解
    for (const pos of positions) {
      if (cellsToRemove <= 0) break;
      
      const backup = puzzleGrid[pos.row][pos.col];
      puzzleGrid[pos.row][pos.col] = 0;
      removedPositions.push({ ...pos, value: backup });
      
      // 检查剩余解的数量是否唯一
      const solutionCount = this.countSolutionsFast(puzzleGrid, 2);
      
      if (solutionCount !== 1) {
        // 如果解不唯一，回滚
        puzzleGrid[pos.row][pos.col] = backup;
        removedPositions.pop();
      } else {
        cellsToRemove--;
      }
    }
    
    // 确保至少保留了最小数量的数字
    const remainingNumbers = puzzleGrid.flat().filter(cell => cell !== 0).length;
    if (remainingNumbers < config.minCount && removedPositions.length > 0) {
      // 如果剩余数字太少，恢复一些数字
      const countToRestore = Math.max(0, config.minCount - remainingNumbers);
      for (let i = 0; i < countToRestore && removedPositions.length > 0; i++) {
        const pos = removedPositions.pop();
        puzzleGrid[pos.row][pos.col] = pos.value;
      }
    }
    
    return puzzleGrid;
  }

  /**
   * 快速计算数独的解的数量（带剪枝）
   * @param {Array} grid - 数独网格
   * @param {number} maxSolutions - 最大解数量（超过后停止计算）
   * @returns {number} - 解的数量
   */
  countSolutionsFast(grid, maxSolutions = 2) {
    // 创建网格的深拷贝
    const workingGrid = JSON.parse(JSON.stringify(grid));
    let solutionCount = 0;
    
    function backtrack() {
      if (solutionCount >= maxSolutions) {
        return;
      }
      
      // 找到所有空格
      const emptyCells = [];
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (workingGrid[row][col] === 0) {
            // 计算每个空格可能的数字数量（MRV启发式）
            const possibilities = [];
            for (let num = 1; num <= 9; num++) {
              if (this.isValidPlacement(workingGrid, row, col, num)) {
                possibilities.push(num);
              }
            }
            emptyCells.push({ row, col, possibilities });
          }
        }
      }
      
      // 如果没有空格，说明找到一个解
      if (emptyCells.length === 0) {
        solutionCount++;
        return;
      }
      
      // 按可能数字数量排序（MRV启发式）
      emptyCells.sort((a, b) => a.possibilities.length - b.possibilities.length);
      const { row, col, possibilities } = emptyCells[0];
      
      // 如果某个空格没有可能的数字，回溯
      if (possibilities.length === 0) {
        return;
      }
      
      // 尝试填充每个可能的数字
      for (const num of possibilities) {
        if (this.isValidPlacement(workingGrid, row, col, num)) {
          workingGrid[row][col] = num;
          backtrack.call(this);
          workingGrid[row][col] = 0;
          
          // 如果已经找到足够的解，提前返回
          if (solutionCount >= maxSolutions) {
            return;
          }
        }
      }
    }
    
    backtrack.call(this);
    return solutionCount;
  }

  /**
   * 生成指定难度的数独谜题
   * @param {string} difficulty - 难度级别
   * @returns {Object} - 包含谜题和解决方案的对象
   */
  generatePuzzle(difficulty) {
    // 生成完整数独
    const solution = this.generateFullSudoku();
    
    // 移除数字生成谜题
    const puzzle = this.removeNumbers(solution, difficulty);
    
    return { puzzle, solution };
  }

  /**
   * 预生成多个谜题并导出为JSON
   * @param {number} countPerDifficulty - 每个难度生成的谜题数量
   * @returns {Object} - 包含所有难度谜题的对象
   */
  pregeneratePuzzles(countPerDifficulty = 10) {
    const allPuzzles = {};
    
    // 为每个难度级别生成谜题
    Object.keys(this.difficultyLevels).forEach(difficulty => {
      allPuzzles[difficulty] = [];
      
      for (let i = 0; i < countPerDifficulty; i++) {
        const { puzzle, solution } = this.generatePuzzle(difficulty);
        allPuzzles[difficulty].push({ puzzle, solution });
      }
    });
    
    return allPuzzles;
  }
}

// 导出求解器类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SudokuSolver;
} else {
  // 浏览器环境
  window.SudokuSolver = SudokuSolver;
}

// 如果直接运行此脚本（Node.js环境），预生成谜题
if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
  const fs = require('fs');
  const path = require('path');
  
  const solver = new SudokuSolver();
  console.log('正在预生成数独谜题...');
  
  try {
    const puzzles = solver.pregeneratePuzzles(10);
    const outputPath = path.join(__dirname, 'sudoku-puzzles.json');
    
    fs.writeFileSync(outputPath, JSON.stringify(puzzles, null, 2));
    console.log(`已成功生成数独谜题并保存到: ${outputPath}`);
  } catch (error) {
    console.error('生成谜题时出错:', error);
  }
}