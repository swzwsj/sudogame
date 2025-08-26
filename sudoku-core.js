// 数独核心模块 - 合并了生成器和求解器功能

// 难度配置
const difficultyConfig = {
  easy: { minClues: 36, maxClues: 45 },
  medium: { minClues: 31, maxClues: 35 },
  hard: { minClues: 26, maxClues: 30 },
  expert: { minClues: 22, maxClues: 25 },
  master: { minClues: 17, maxClues: 21 }
};

// 存储生成的谜题
const generatedPuzzles = {
  easy: [],
  medium: [],
  hard: [],
  expert: [],
  master: []
};

/**
 * 检查在指定位置放置数字是否有效
 * @param {number[][]} grid - 数独网格
 * @param {number} row - 行索引
 * @param {number} col - 列索引
 * @param {number} num - 要放置的数字
 * @returns {boolean} - 是否有效
 */
function isValidPlacement(grid, row, col, num) {
  // 检查行
  for (let x = 0; x < 9; x++) {
    if (grid[row][x] === num) return false;
  }

  // 检查列
  for (let x = 0; x < 9; x++) {
    if (grid[x][col] === num) return false;
  }

  // 检查3x3子网格
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (grid[startRow + i][startCol + j] === num) return false;
    }
  }

  return true;
}

/**
 * 使用回溯算法解决数独
 * @param {number[][]} grid - 数独网格
 * @returns {boolean} - 是否解决成功
 */
function solveGrid(grid) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0) {
        for (let num = 1; num <= 9; num++) {
          if (isValidPlacement(grid, row, col, num)) {
            grid[row][col] = num;

            if (solveGrid(grid)) {
              return true;
            }

            grid[row][col] = 0; // 回溯
          }
        }
        return false; // 没有找到解
      }
    }
  }
  return true; // 所有格子都已填满
}

/**
 * 使用MRV启发式算法解决数独（最小剩余值）
 * @param {number[][]} grid - 数独网格
 * @returns {boolean} - 是否解决成功
 */
function solveGridWithMRV(grid) {
  // 找到空单元格
  let emptyCells = [];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0) {
        // 计算可能的数字数量
        let possibleNums = 0;
        for (let num = 1; num <= 9; num++) {
          if (isValidPlacement(grid, row, col, num)) {
            possibleNums++;
          }
        }
        emptyCells.push({ row, col, possibleNums });
      }
    }
  }

  // 如果没有空单元格，数独已解决
  if (emptyCells.length === 0) {
    return true;
  }

  // 按可能数字数量排序（MRV启发式）
  emptyCells.sort((a, b) => a.possibleNums - b.possibleNums);

  // 尝试填充第一个单元格
  const { row, col } = emptyCells[0];
  for (let num = 1; num <= 9; num++) {
    if (isValidPlacement(grid, row, col, num)) {
      grid[row][col] = num;

      if (solveGridWithMRV(grid)) {
        return true;
      }

      grid[row][col] = 0; // 回溯
    }
  }

  return false;
}

/**
 * 生成完整的数独网格
 * @returns {number[][]} - 完整的数独网格
 */
function generateFullSudoku() {
  const grid = Array(9).fill().map(() => Array(9).fill(0));

  // 随机填充对角线的3x3子网格
  for (let box = 0; box < 3; box++) {
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    // 打乱数字顺序
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }

    // 填充子网格
    let index = 0;
    for (let row = box * 3; row < box * 3 + 3; row++) {
      for (let col = box * 3; col < box * 3 + 3; col++) {
        grid[row][col] = nums[index++];
      }
    }
  }

  // 解决剩余部分
  solveGrid(grid);
  return grid;
}

/**
 * 快速计算数独解的数量（最多计数到2）- 优化版
 * @param {number[][]} grid - 数独网格
 * @param {object} solutionCounter - 解计数器对象
 * @returns {void}
 */
function countSolutionsFast(grid, solutionCounter) {
  // 如果已经找到2个解，提前返回
  if (solutionCounter.count >= 2) {
    return;
  }
  
  // 使用MRV策略选择下一个要填充的单元格，提高性能
  let row = -1;
  let col = -1;
  let minPossibilities = 10; // 初始化为大于9的值
  
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (grid[i][j] === 0) {
        let possibilities = 0;
        for (let num = 1; num <= 9; num++) {
          if (isValidPlacement(grid, i, j, num)) {
            possibilities++;
          }
        }
        
        // 如果找到只有一种可能的单元格，优先处理
        if (possibilities === 1) {
          row = i;
          col = j;
          break;
        }
        
        // 更新最小可能性的单元格
        if (possibilities < minPossibilities) {
          minPossibilities = possibilities;
          row = i;
          col = j;
        }
      }
    }
    if (row !== -1 && minPossibilities === 1) break;
  }
  
  // 如果没有空单元格，找到一个解
  if (row === -1) {
    solutionCounter.count++;
    return;
  }
  
  // 尝试在空单元格中填入有效数字
  for (let num = 1; num <= 9; num++) {
    if (isValidPlacement(grid, row, col, num)) {
      grid[row][col] = num;
      countSolutionsFast(grid, solutionCounter);
      grid[row][col] = 0; // 回溯
      
      // 如果已经找到2个解，提前返回
      if (solutionCounter.count >= 2) {
        return;
      }
    }
  }
}

/**
 * 检查数独是否有唯一解
 * @param {number[][]} grid - 数独网格
 * @returns {boolean} - 是否有唯一解
 */
function hasUniqueSolution(grid) {
  const gridCopy = JSON.parse(JSON.stringify(grid));
  const solutionCounter = { count: 0 };
  countSolutionsFast(gridCopy, solutionCounter);
  return solutionCounter.count === 1;
}

/**
 * 从完整网格中移除数字，生成谜题
 * @param {number[][]} fullGrid - 完整的数独网格
 * @param {string} difficulty - 难度级别
 * @returns {number[][]} - 生成的谜题
 */
function removeNumbers(fullGrid, difficulty) {
  const puzzle = JSON.parse(JSON.stringify(fullGrid));
  const { minClues, maxClues } = difficultyConfig[difficulty];
  const cluesToKeep = Math.floor(Math.random() * (maxClues - minClues + 1)) + minClues;
  const totalCells = 81;
  const cellsToRemove = totalCells - cluesToKeep;

  // 记录已移除的单元格
  const removedCells = new Set();
  
  // 创建单元格列表并随机排序，以改进移除策略
  const allCells = [];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      allCells.push({ row, col });
    }
  }
  
  // 随机排序单元格
  shuffleArray(allCells);
  
  let attempts = 0;
  const maxAttempts = 1000; // 设置最大尝试次数以避免无限循环
  
  // 移除单元格，确保始终有唯一解
  let cellIndex = 0;
  while (removedCells.size < cellsToRemove && attempts < maxAttempts) {
    if (cellIndex >= allCells.length) {
      // 如果遍历完所有单元格仍未达到目标，重新打乱并开始
      shuffleArray(allCells);
      cellIndex = 0;
    }
    
    const { row, col } = allCells[cellIndex];
    cellIndex++;
    const cellId = `${row},${col}`;
    
    // 如果该单元格已经被移除，或者是最后一个线索，则跳过
    if (removedCells.has(cellId) || puzzle[row][col] === 0) {
      continue;
    }
    
    // 暂时保存该单元格的值
    const tempValue = puzzle[row][col];
    puzzle[row][col] = 0;
    
    // 检查是否仍有唯一解
    if (hasUniqueSolution(puzzle)) {
      removedCells.add(cellId);
      attempts = 0; // 成功移除后重置尝试次数
    } else {
      // 如果没有唯一解，恢复该单元格的值
      puzzle[row][col] = tempValue;
      attempts++;
    }
  }
  
  // 如果达到最大尝试次数仍未完成，记录警告
  if (attempts >= maxAttempts) {
    console.warn(`生成${difficulty}难度谜题时达到最大尝试次数，可能未达到目标难度`);
  }
  
  return puzzle;
}

/**
 * 随机打乱数组顺序（Fisher-Yates算法）
 * @param {Array} array - 要打乱的数组
 * @returns {void}
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * 生成数独谜题和对应的解
 * @param {string} difficulty - 难度级别
 * @returns {object} - 包含谜题和解的对象
 */
function generateSudokuPuzzle(difficulty) {
  const solution = generateFullSudoku();
  const puzzle = removeNumbers(solution, difficulty);
  return { puzzle, solution };
}

/**
 * 日志工具
 */
const Logger = {
  enabled: true,
  levels: {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  },
  currentLevel: 1, // 默认显示info及以上级别的日志
  
  setLevel(level) {
    this.currentLevel = this.levels[level] !== undefined ? this.levels[level] : this.currentLevel;
  },
  
  debug(message) {
    if (this.enabled && this.currentLevel <= this.levels.debug) {
      console.debug('[SudokuCore DEBUG]', message);
    }
  },
  
  info(message) {
    if (this.enabled && this.currentLevel <= this.levels.info) {
      console.info('[SudokuCore INFO]', message);
    }
  },
  
  warn(message) {
    if (this.enabled && this.currentLevel <= this.levels.warn) {
      console.warn('[SudokuCore WARNING]', message);
    }
  },
  
  error(message, error) {
    if (this.enabled && this.currentLevel <= this.levels.error) {
      console.error('[SudokuCore ERROR]', message);
      if (error) console.error(error);
    }
  }
};

// 使用Logger的预生成谜题函数
function preGeneratePuzzles(count = 5) {
  Logger.info('开始预生成数独谜题...');
  
  for (const difficulty of Object.keys(difficultyConfig)) {
    generatedPuzzles[difficulty] = [];
    Logger.info(`生成 ${difficulty} 难度的谜题...`);
    
    for (let i = 0; i < count; i++) {
      try {
        const { puzzle, solution } = generateSudokuPuzzle(difficulty);
        generatedPuzzles[difficulty].push({ puzzle, solution });
        Logger.debug(`成功生成第${i+1}个${difficulty}难度谜题`);
      } catch (error) {
        Logger.error(`生成第${i+1}个${difficulty}难度谜题时出错`, error);
      }
    }
  }
  
  Logger.info('数独谜题预生成完成！');
}

/**
 * 导出谜题到JSON文件（Node.js环境）
 * @param {string} filePath - 导出文件路径
 * @returns {void}
 */
function exportPuzzlesToFile(filePath = 'sudoku-puzzles.json') {
  if (typeof require !== 'undefined' && typeof window === 'undefined') {
    try {
      const fs = require('fs');
      fs.writeFileSync(filePath, JSON.stringify(generatedPuzzles, null, 2));
      console.log(`谜题已成功导出到 ${filePath}`);
    } catch (error) {
      console.error('导出谜题时出错:', error);
    }
  } else {
    console.warn('在浏览器环境中无法导出文件');
    // 可以选择在浏览器中提供下载功能
  }
}

// 导出公共API
const SudokuCore = {
  difficultyConfig,
  isValidPlacement,
  solveGrid,
  solveGridWithMRV,
  generateFullSudoku,
  hasUniqueSolution,
  generateSudokuPuzzle,
  preGeneratePuzzles,
  exportPuzzlesToFile,
  generatedPuzzles,
  shuffleArray,
  Logger
};

// 实现完整的UMD（Universal Module Definition）模式
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD模块加载器（如RequireJS）
    define([], factory);
  } else if (typeof module !== 'undefined' && module.exports) {
    // CommonJS模块系统（如Node.js）
    module.exports = factory();
  } else if (typeof self !== 'undefined') {
    // Web Worker或严格模式下的浏览器全局对象
    self.SudokuCore = factory();
  } else {
    // 传统浏览器全局对象
    root.SudokuCore = factory();
  }
}(typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : typeof global !== 'undefined' ? global : this, function () {
  return SudokuCore;
}));

