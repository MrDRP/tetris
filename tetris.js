// Constants
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const COLORS = [
    null,
    '#FF0D72', // I
    '#0DC2FF', // O
    '#0DFF72', // T
    '#F538FF', // S
    '#FF8E0D', // Z
    '#FFE138', // J
    '#3877FF'  // L
];

// Tetromino shapes defined using 4x4 matrices
const SHAPES = [
    null,
    // I
    [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    // O
    [
        [0, 0, 0, 0],
        [0, 2, 2, 0],
        [0, 2, 2, 0],
        [0, 0, 0, 0]
    ],
    // T
    [
        [0, 0, 0, 0],
        [0, 3, 0, 0],
        [3, 3, 3, 0],
        [0, 0, 0, 0]
    ],
    // S
    [
        [0, 0, 0, 0],
        [0, 4, 4, 0],
        [4, 4, 0, 0],
        [0, 0, 0, 0]
    ],
    // Z
    [
        [0, 0, 0, 0],
        [5, 5, 0, 0],
        [0, 5, 5, 0],
        [0, 0, 0, 0]
    ],
    // J
    [
        [0, 0, 0, 0],
        [6, 0, 0, 0],
        [6, 6, 6, 0],
        [0, 0, 0, 0]
    ],
    // L
    [
        [0, 0, 0, 0],
        [0, 0, 7, 0],
        [7, 7, 7, 0],
        [0, 0, 0, 0]
    ]
];

let gameOver = false;
let dropInterval = 1000; // Time in ms for piece to drop one row
let lastDropTime = 0;
let score = 0;
let board = createBoard();
let currentPiece = null;
let nextPiece = null;

// DOM elements
const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');
const nextPieceCanvas = document.getElementById('next-piece');
const nextPieceCtx = nextPieceCanvas.getContext('2d');
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('final-score');
const menuScreen = document.getElementById('menu-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startButton = document.getElementById('start-button');
const playAgainButton = document.getElementById('play-again-button');

// Scale canvas for better rendering
ctx.scale(BLOCK_SIZE, BLOCK_SIZE);
nextPieceCtx.scale(30, 30);

// Event listeners
startButton.addEventListener('click', startGame);
playAgainButton.addEventListener('click', startGame);
document.addEventListener('keydown', handleKeyPress);

// Initialize next piece preview
function initNextPiece() {
    nextPiece = createPiece(Math.floor(Math.random() * 7) + 1);
}

// Get new current piece and generate next piece
function getNewPiece() {
    currentPiece = nextPiece || createPiece(Math.floor(Math.random() * 7) + 1);
    nextPiece = createPiece(Math.floor(Math.random() * 7) + 1);
    drawNextPiece();
    
    // Check for game over
    if (!isValidMove(0, 0)) {
        gameOver = true;
        finalScoreElement.textContent = score;
        gameOverScreen.classList.remove('hidden');
    }
}

// Start the game
function startGame() {
    // Reset game state
    gameOver = false;
    lastDropTime = 0;
    score = 0;
    scoreElement.textContent = '0';
    board = createBoard();
    
    // Hide menu and game over screens
    menuScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    // Initialize pieces
    initNextPiece();
    getNewPiece();
    
    // Start game loop
    requestAnimationFrame(gameLoop);
}

// Create a new piece
function createPiece(type) {
    return {
        type: type,
        shape: SHAPES[type],
        x: Math.floor(COLS / 2) - 2,
        y: 0
    };
}

// Create empty game board
function createBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

// Rotate the current piece clockwise
function rotatePiece() {
    const rotated = [];
    for (let i = 0; i < currentPiece.shape.length; i++) {
        rotated.push([]);
        for (let j = 0; j < currentPiece.shape[i].length; j++) {
            rotated[i][j] = currentPiece.shape[3 - j][i];
        }
    }
    
    // Check if rotation is valid before applying
    const originalShape = currentPiece.shape;
    currentPiece.shape = rotated;
    
    if (!isValidMove(0, 0)) {
        // Restore original shape if rotation is invalid
        currentPiece.shape = originalShape;
    }
}

// Check if the move is valid
function isValidMove(moveX, moveY) {
    for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
            if (currentPiece.shape[y][x] !== 0) {
                const newX = x + currentPiece.x + moveX;
                const newY = y + currentPiece.y + moveY;
                
                // Check boundaries
                if (newX < 0 || newX >= COLS || newY >= ROWS) {
                    return false;
                }
                
                // Skip check above the board
                if (newY < 0) {
                    continue;
                }
                
                // Check collision with placed pieces
                if (board[newY][newX] !== 0) {
                    return false;
                }
            }
        }
    }
    return true;
}

// Move piece down
function dropPiece() {
    if (!gameOver) {
        if (isValidMove(0, 1)) {
            currentPiece.y++;
        } else {
            placePiece();
            clearLines();
            getNewPiece();
        }
    }
}

// Hard drop - instantly place the piece at the bottom
function hardDrop() {
    while (isValidMove(0, 1)) {
        currentPiece.y++;
    }
    dropPiece();
}

// Place the current piece on the board
function placePiece() {
    for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
            if (currentPiece.shape[y][x] !== 0) {
                const boardY = y + currentPiece.y;
                const boardX = x + currentPiece.x;
                
                // Only place if it's within the board
                if (boardY >= 0) {
                    board[boardY][boardX] = currentPiece.type;
                }
            }
        }
    }
}

// Clear completed lines and update score
function clearLines() {
    let linesCleared = 0;
    
    for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(value => value !== 0)) {
            // Remove the completed line
            board.splice(y, 1);
            // Add an empty line at the top
            board.unshift(Array(COLS).fill(0));
            linesCleared++;
            // Check the same row again since it contains new blocks now
            y++;
        }
    }
    
    // Update score based on lines cleared
    if (linesCleared > 0) {
        // Score more points for clearing multiple lines at once
        const points = [0, 100, 300, 500, 800];
        score += points[linesCleared];
        scoreElement.textContent = score;
    }
}

// Draw a single block
function drawBlock(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
    ctx.strokeStyle = '#222';
    ctx.strokeRect(x, y, 1, 1);
}

// Draw the game board
function drawBoard() {
    ctx.clearRect(0, 0, COLS, ROWS);
    
    // Draw placed pieces
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x] !== 0) {
                drawBlock(x, y, COLORS[board[y][x]]);
            }
        }
    }
    
    // Draw current piece
    if (currentPiece) {
        for (let y = 0; y < currentPiece.shape.length; y++) {
            for (let x = 0; x < currentPiece.shape[y].length; x++) {
                if (currentPiece.shape[y][x] !== 0) {
                    const pieceX = x + currentPiece.x;
                    const pieceY = y + currentPiece.y;
                    
                    // Only draw if within the visible board
                    if (pieceY >= 0) {
                        drawBlock(pieceX, pieceY, COLORS[currentPiece.type]);
                    }
                }
            }
        }
    }
}

// Draw the next piece preview
function drawNextPiece() {
    nextPieceCtx.clearRect(0, 0, 4, 4);
    
    if (nextPiece) {
        for (let y = 0; y < nextPiece.shape.length; y++) {
            for (let x = 0; x < nextPiece.shape[y].length; x++) {
                if (nextPiece.shape[y][x] !== 0) {
                    nextPieceCtx.fillStyle = COLORS[nextPiece.type];
                    nextPieceCtx.fillRect(x, y, 1, 1);
                    nextPieceCtx.strokeStyle = '#222';
                    nextPieceCtx.strokeRect(x, y, 1, 1);
                }
            }
        }
    }
}

// Handle keyboard controls
function handleKeyPress(event) {
    if (gameOver) return;
    
    switch(event.keyCode) {
        case 37: // Left arrow
            if (isValidMove(-1, 0)) {
                currentPiece.x--;
            }
            break;
        case 39: // Right arrow
            if (isValidMove(1, 0)) {
                currentPiece.x++;
            }
            break;
        case 40: // Down arrow - soft drop
            dropPiece();
            break;
        case 38: // Up arrow - rotate
            rotatePiece();
            break;
        case 32: // Space bar - hard drop
            hardDrop();
            break;
    }
}

// Main game loop
function gameLoop(timestamp) {
    // Calculate time since last drop
    const deltaTime = timestamp - lastDropTime;
    
    // Auto-drop piece at regular intervals
    if (deltaTime > dropInterval) {
        dropPiece();
        lastDropTime = timestamp;
    }
    
    // Draw the current state
    drawBoard();
    
    // Continue game loop if not game over
    if (!gameOver) {
        requestAnimationFrame(gameLoop);
    }
}