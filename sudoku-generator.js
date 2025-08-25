// 数独生成器 - 独立脚本
// 为每个难度级别生成10个有唯一解的数独谜题

// 难度配置
export const difficultyConfig = {
    easy: { targetRemoved: 30, maxAttempts: 1000, timeout: 10000 },
    medium: { targetRemoved: 40, maxAttempts: 2000, timeout: 15000 },
    hard: { targetRemoved: 50, maxAttempts: 3000, timeout: 20000 },
    expert: { targetRemoved: 55, maxAttempts: 5000, timeout: 25000 },
    master: { targetRemoved: 60, maxAttempts: 10000, timeout: 30000 }
};

// 保存生成的谜题
let generatedPuzzles = {
    easy: [],
    medium: [],
    hard: [],
    expert: [],
    master: []
};

/**
 * 检查数字是否可以放置在指定位置
 * @param {Array} grid - 数独网格
 * @param {number} row - 行索引
 * @param {number} col - 列索引
 * @param {number} num - 要放置的数字
 * @returns {boolean} - 是否可以放置
 */
export function isValidPlacement(grid, row, col, num) {
    // 计算宫格起始位置
    const boxStartRow = Math.floor(row / 3) * 3;
    const boxStartCol = Math.floor(col / 3) * 3;
    
    // 检查行、列和宫格
    for (let i = 0; i < 9; i++) {
        // 检查行
        if (grid[row][i] === num) {
            return false;
        }
        
        // 检查列
        if (grid[i][col] === num) {
            return false;
        }
        
        // 检查3x3宫格
        const boxRow = boxStartRow + Math.floor(i / 3);
        const boxCol = boxStartCol + (i % 3);
        if (grid[boxRow][boxCol] === num) {
            return false;
        }
    }
    
    return true;
}

/**
 * 创建一个空白的9x9网格
 * @returns {Array} - 空白网格
 */
function createEmptyGrid() {
    const grid = new Array(9);
    for (let i = 0; i < 9; i++) {
        grid[i] = new Array(9).fill(0);
    }
    return grid;
}

/**
 * 深度克隆数独网格
 * @param {Array} grid - 要克隆的网格
 * @returns {Array} - 克隆的网格
 */
export function cloneGrid(grid) {
    const newGrid = new Array(9);
    for (let i = 0; i < 9; i++) {
        newGrid[i] = [...grid[i]];
    }
    return newGrid;
}

/**
 * 使用回溯算法解决数独网格（带MRV启发式）
 * @param {Array} grid - 数独网格
 * @returns {boolean} - 是否成功解决
 */
export function solveGrid(grid) {
    // 找到可能性最少的空单元格（MRV启发式）
    let bestRow = -1;
    let bestCol = -1;
    let minPossibilities = 10; // 超过最大可能值9
    let bestPossibilities = [];
    
    // 首先扫描所有单元格，找出可能性最少的空单元格
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (grid[row][col] === 0) {
                // 计算当前单元格可能的数字
                const possibilities = [];
                for (let num = 1; num <= 9; num++) {
                    if (isValidPlacement(grid, row, col, num)) {
                        possibilities.push(num);
                    }
                }
                
                // 更新最佳单元格（可能性最少的）
                if (possibilities.length < minPossibilities) {
                    minPossibilities = possibilities.length;
                    bestRow = row;
                    bestCol = col;
                    bestPossibilities = possibilities;
                }
            }
        }
    }
    
    // 如果没有找到空单元格，说明已经解决
    if (bestRow === -1) {
        return true;
    }
    
    // 尝试在最佳单元格放置可能的数字
    // 打乱可能性顺序，减少在特定情况下的最坏性能
    for (let i = bestPossibilities.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bestPossibilities[i], bestPossibilities[j]] = [bestPossibilities[j], bestPossibilities[i]];
    }
    
    // 尝试每个可能的数字
    for (let k = 0; k < bestPossibilities.length; k++) {
        const num = bestPossibilities[k];
        
        grid[bestRow][bestCol] = num;
        
        // 递归尝试解决剩余网格
        if (solveGrid(grid)) {
            return true;
        }
        
        // 如果失败，回溯
        grid[bestRow][bestCol] = 0;
    }
    
    return false; // 当前单元格没有有效的数字可以放置
}

/**
 * 快速计算数独解的数量（用于确保唯一解）
 * @param {Array} grid - 数独网格
 * @param {Object} solutionCounter - 解计数器对象
 * @returns {boolean} - 是否继续搜索
 */
export function countSolutionsFast(grid, solutionCounter) {
    // 快速检查是否已经找到2个解，如果是则立即停止搜索
    if (solutionCounter.count >= 2) {
        return false;
    }
    
    // 找到可能性最少的空单元格（MRV启发式）
    let bestRow = -1;
    let bestCol = -1;
    let minPossibilities = 10;
    let bestPossibilities = [];
    
    // 首先扫描所有单元格，找出可能性最少的空单元格
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (grid[row][col] === 0) {
                // 计算当前单元格可能的数字
                const possibilities = [];
                for (let num = 1; num <= 9; num++) {
                    if (isValidPlacement(grid, row, col, num)) {
                        possibilities.push(num);
                    }
                }
                
                // 如果发现单元格没有可能的数字，立即剪枝
                if (possibilities.length === 0) {
                    return true;
                }
                
                // 更新最佳单元格（可能性最少的）
                if (possibilities.length < minPossibilities) {
                    minPossibilities = possibilities.length;
                    bestRow = row;
                    bestCol = col;
                    bestPossibilities = possibilities;
                }
            }
        }
    }
    
    // 如果没有找到空单元格，说明找到一个解
    if (bestRow === -1) {
        solutionCounter.count++;
        return solutionCounter.count < 2; // 找到少于2个解时继续搜索
    }
    
    // 打乱可能性顺序，减少在特定情况下的最坏性能
    for (let i = bestPossibilities.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bestPossibilities[i], bestPossibilities[j]] = [bestPossibilities[j], bestPossibilities[i]];
    }
    
    // 尝试每个可能的数字
    for (let k = 0; k < bestPossibilities.length; k++) {
        const num = bestPossibilities[k];
        
        grid[bestRow][bestCol] = num;
        
        // 递归计算解的数量
        if (!countSolutionsFast(grid, solutionCounter)) {
            grid[bestRow][bestCol] = 0; // 回溯
            return false; // 已经找到2个或更多解，立即停止搜索
        }
        
        // 回溯
        grid[bestRow][bestCol] = 0;
        
        // 每一步都检查是否已经找到2个解
        if (solutionCounter.count >= 2) {
            return false;
        }
    }
    
    return true;
}

/**
 * 生成一个完整的随机数独解
 * @returns {Array} - 完整的数独解
 */
export function generateFullSudoku() {
    const grid = createEmptyGrid();
    
    // 先填充对角线的3个3x3宫格，这是一个快速生成有效数独的技巧
    for (let i = 0; i < 3; i++) {
        // 生成1-9的随机排列
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        for (let j = numbers.length - 1; j > 0; j--) {
            const k = Math.floor(Math.random() * (j + 1));
            [numbers[j], numbers[k]] = [numbers[k], numbers[j]];
        }
        
        // 填充对角线宫格
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                grid[i*3 + row][i*3 + col] = numbers[row*3 + col];
            }
        }
    }
    
    // 使用solveGrid完成剩余部分
    solveGrid(grid);
    return grid;
}

/**
 * 从完整解中移除数字以创建谜题
 * @param {Array} grid - 完整的数独解
 * @param {number} count - 要移除的数字数量
 * @returns {Array} - 生成的谜题
 */
export function removeNumbers(grid, count) {
    const puzzle = cloneGrid(grid);
    let removed = 0;
    let attempts = 0;
    const maxAttempts = count * 100;
    
    // 创建需要处理的单元格位置数组
    const positions = [];
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            positions.push({row, col});
        }
    }
    
    // 随机打乱数组顺序
    for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    
    // 移除数字，确保谜题有唯一解
    while (removed < count && attempts < maxAttempts && positions.length > 0) {
        attempts++;
        
        // 取出下一个位置
        const posIndex = positions.length - 1;
        const {row, col} = positions[posIndex];
        positions.length = posIndex;
        
        if (puzzle[row][col] !== 0) {
            // 保存当前值以便恢复（如果需要）
            const temp = puzzle[row][col];
            puzzle[row][col] = 0;
            
            // 检查谜题是否仍然有唯一解
            const gridCopy = cloneGrid(puzzle);
            const solutionCounter = { count: 0 };
            
            countSolutionsFast(gridCopy, solutionCounter);
            
            if (solutionCounter.count === 1) {
                removed++;
            } else {
                // 如果有多个解或无解，恢复该值
                puzzle[row][col] = temp;
            }
        }
    }
    
    return puzzle;
}

/**
 * 为指定难度生成一个数独谜题
 * @param {string} difficulty - 难度级别
 * @returns {Object} - 包含谜题和解决方案的对象
 */
export function generateSudokuPuzzle(difficulty) {
    const config = difficultyConfig[difficulty];
    if (!config) {
        throw new Error(`未知的难度级别: ${difficulty}`);
    }
    
    let attempts = 0;
    const maxAttempts = 50; // 防止无限循环
    
    while (attempts < maxAttempts) {
        attempts++;
        
        try {
            // 生成完整解
            const solution = generateFullSudoku();
            
            // 移除数字创建谜题
            const puzzle = removeNumbers(solution, config.targetRemoved);
            
            // 确保谜题有足够的空白格子
            let emptyCount = 0;
            for (let i = 0; i < 9; i++) {
                for (let j = 0; j < 9; j++) {
                    if (puzzle[i][j] === 0) emptyCount++;
                }
            }
            
            // 确保空单元格数量在合理范围内
            if (emptyCount >= config.targetRemoved * 0.8) {
                return {
                    puzzle: puzzle,
                    solution: solution
                };
            }
        } catch (error) {
            console.warn(`生成谜题失败，尝试次数: ${attempts}`, error);
        }
    }
    
    throw new Error(`无法在${maxAttempts}次尝试内生成有效的${difficulty}难度谜题`);
}

/**
 * 预生成指定数量的谜题
 * @param {number} count - 每个难度要生成的谜题数量
 */
export function preGeneratePuzzles(count = 10) {
    const difficulties = Object.keys(difficultyConfig);
    
    for (const difficulty of difficulties) {
        console.log(`正在生成${count}个${difficulty}难度的谜题...`);
        
        for (let i = 0; i < count; i++) {
            try {
                const puzzleData = generateSudokuPuzzle(difficulty);
                generatedPuzzles[difficulty].push(puzzleData);
                console.log(`已生成${difficulty}难度谜题 ${i+1}/${count}`);
            } catch (error) {
                console.error(`生成${difficulty}难度谜题时出错:`, error);
                // 重试一次
                i--;
            }
        }
    }
    
    // 保存到本地存储
    localStorage.setItem('sudokuPreGeneratedPuzzles', JSON.stringify(generatedPuzzles));
    console.log('所有谜题已生成并保存');
    
    return generatedPuzzles;
}

/**
 * 从预生成的谜题中随机获取一个
 * @param {string} difficulty - 难度级别
 * @returns {Object} - 谜题和解决方案
 */
export function getRandomPuzzle(difficulty) {
    // 首先尝试从本地存储加载
    if (!generatedPuzzles[difficulty] || generatedPuzzles[difficulty].length === 0) {
        try {
            const stored = localStorage.getItem('sudokuPreGeneratedPuzzles');
            if (stored) {
                generatedPuzzles = JSON.parse(stored);
            }
        } catch (error) {
            console.warn('无法从本地存储加载预生成谜题，重新生成');
        }
    }
    
    // 如果仍然没有，生成一组新的
    if (!generatedPuzzles[difficulty] || generatedPuzzles[difficulty].length === 0) {
        preGeneratePuzzles(10);
    }
    
    const puzzles = generatedPuzzles[difficulty];
    if (puzzles && puzzles.length > 0) {
        const randomIndex = Math.floor(Math.random() * puzzles.length);
        return puzzles[randomIndex];
    }
    
    // 作为后备，即时生成一个
    return generateSudokuPuzzle(difficulty);
}

/**
 * 导出谜题数据到文件（在浏览器环境中使用）
 * @param {string} filename - 文件名
 */
export function exportPuzzlesToFile(filename = 'sudoku-puzzles.json') {
    // 确保有谜题数据
    if (Object.values(generatedPuzzles).every(puzzles => puzzles.length === 0)) {
        preGeneratePuzzles(10);
    }
    
    const dataStr = JSON.stringify(generatedPuzzles, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = filename;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// 自动预生成谜题，确保游戏开始时已有可用谜题
// 仅在全局作用域中执行，避免在导入时立即执行
if (typeof window !== 'undefined') {
    // 使用setTimeout延迟执行，避免阻塞页面加载
    setTimeout(() => {
        try {
            // 检查是否已有预生成的谜题
            const stored = localStorage.getItem('sudokuPreGeneratedPuzzles');
            if (!stored) {
                console.log('开始预生成数独谜题...');
                preGeneratePuzzles(10);
            }
        } catch (error) {
            console.error('预生成谜题时出错:', error);
        }
    }, 1000);
}