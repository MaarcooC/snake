const gameBoard = document.querySelector("#gameBoard");
const ctx = gameBoard.getContext("2d");
const scoreText = document.querySelector("#scoreText");
const recordText = document.querySelector("#recordText");
const resetBtn = document.querySelector("#resetBtn");
const diffButtons = document.querySelectorAll(".diffBtn");

const gameWidth = gameBoard.width;
const gameHeight = gameBoard.height;
const boardBackground = "rgb(13, 13, 39)";
const snakeHeadColor = "#32cd32";
const snakeColor = "green";
const snakeBorder = "black";
const foodColor = "crimson";
const poisonColor = "#9b59b6";
const unitSize = 25;

const DIFFICULTIES = {
    easy: { speed: 130, appleCount: 2, movingApple: false },
    medium: { speed: 75, appleCount: 1, movingApple: false },
    hard: { speed: 45, appleCount: 1, movingApple: true }
};

let currentDiff = "medium";
let running = false;
let paused = false;
let changingDirection = false;
let tickTimeout = null;

// Timer spostamento mela (modalità Difficile)
let foodMoveTimeout = null;
let foodMoveRemaining = 0;
let foodMoveStart = 0;

// Gestione mela avvelenata
let poisonApple = null;
let poisonSpawnTimeout = null;
let poisonSpawnRemaining = 0;
let poisonSpawnStart = 0;
let poisonDespawnTimeout = null;
let poisonDespawnRemaining = 0;
let poisonDespawnStart = 0;

let xVelocity = unitSize;
let yVelocity = 0;
let foods = [];
let score = 0;
let record = Number(localStorage.getItem("snakeRecord")) || 0;
recordText.textContent = record;

let snake = createInitialSnake();

// Eventi tastiera e bottoni
window.addEventListener("keydown", handleKeyDown);
resetBtn.addEventListener("click", () => {
    resetBtn.blur();
    resetGame();
});

diffButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        diffButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentDiff = btn.dataset.diff;
        btn.blur();
        resetGame();
    });
});

gameStart();

function createInitialSnake() {
    return [
        { x: gameWidth / 2, y: gameHeight / 2 },
        { x: gameWidth / 2 - unitSize, y: gameHeight / 2 },
        { x: gameWidth / 2 - unitSize * 2, y: gameHeight / 2 },
        { x: gameWidth / 2 - unitSize * 3, y: gameHeight / 2 },
        { x: gameWidth / 2 - unitSize * 4, y: gameHeight / 2 }
    ];
}

function gameStart() {
    running = true;
    paused = false;
    scoreText.textContent = score;
    foods = [];
    poisonApple = null;

    const appleCount = DIFFICULTIES[currentDiff].appleCount;
    for (let i = 0; i < appleCount; i++) {
        spawnApple();
    }

    if (DIFFICULTIES[currentDiff].movingApple) {
        scheduleAppleMove();
    }

    schedulePoisonSpawn();
    nextTick();
}

function nextTick() {
    if (!running || paused) return;

    tickTimeout = setTimeout(() => {
        changingDirection = false;
        clearBoard();
        drawFood();
        drawPoisonApple();
        moveSnake();

        if (!running) return;

        drawSnake();
        checkGameOver();

        if (running) {
            nextTick();
        }
    }, DIFFICULTIES[currentDiff].speed);
}

function clearBoard() {
    ctx.fillStyle = boardBackground;
    ctx.fillRect(0, 0, gameWidth, gameHeight);
}

function spawnApple() {
    const totalCells = (gameWidth / unitSize) * (gameHeight / unitSize);

    if (snake.length >= totalCells) {
        displayYouWin();
        return;
    }

    const occupiedCount = snake.length + foods.length + (poisonApple ? 1 : 0);
    if (occupiedCount >= totalCells) {
        return;
    }

    let validPosition = false;
    let newX, newY;

    while (!validPosition) {
        newX = Math.floor(Math.random() * (gameWidth / unitSize)) * unitSize;
        newY = Math.floor(Math.random() * (gameHeight / unitSize)) * unitSize;

        const onSnake = snake.some(part => part.x === newX && part.y === newY);
        const onOtherFood = foods.some(food => food.x === newX && food.y === newY);
        const onPoison = poisonApple && poisonApple.x === newX && poisonApple.y === newY;
        validPosition = !onSnake && !onOtherFood && !onPoison;
    }

    foods.push({ x: newX, y: newY });
}

function scheduleAppleMove(customDelay) {
    clearTimeout(foodMoveTimeout);
    if (!DIFFICULTIES[currentDiff].movingApple || !running) return;

    foodMoveRemaining = customDelay ?? (4000 + Math.random() * 1000);
    foodMoveStart = Date.now();

    foodMoveTimeout = setTimeout(() => {
        if (running && !paused) {
            foods = [];
            spawnApple();
            scheduleAppleMove();
        }
    }, foodMoveRemaining);
}

// --- LOGICA MELA AVVELENATA ---

function schedulePoisonSpawn(customDelay) {
    clearTimeout(poisonSpawnTimeout);
    if (!running) return;

    // Compare ogni 6-10 secondi
    poisonSpawnRemaining = customDelay ?? (6000 + Math.random() * 4000);
    poisonSpawnStart = Date.now();

    poisonSpawnTimeout = setTimeout(() => {
        if (running && !paused) {
            spawnPoisonApple();
        }
    }, poisonSpawnRemaining);
}

function spawnPoisonApple() {
    const totalCells = (gameWidth / unitSize) * (gameHeight / unitSize);
    if (snake.length + foods.length >= totalCells) {
        schedulePoisonSpawn();
        return;
    }

    let validPosition = false;
    let newX, newY;

    while (!validPosition) {
        newX = Math.floor(Math.random() * (gameWidth / unitSize)) * unitSize;
        newY = Math.floor(Math.random() * (gameHeight / unitSize)) * unitSize;

        const onSnake = snake.some(part => part.x === newX && part.y === newY);
        const onFood = foods.some(food => food.x === newX && food.y === newY);
        validPosition = !onSnake && !onFood;
    }

    poisonApple = { x: newX, y: newY };
    schedulePoisonDespawn(4000); // Dura 4 secondi
}

function schedulePoisonDespawn(duration = 4000) {
    clearTimeout(poisonDespawnTimeout);
    if (!running || !poisonApple) return;

    poisonDespawnRemaining = duration;
    poisonDespawnStart = Date.now();

    poisonDespawnTimeout = setTimeout(() => {
        if (running && !paused) {
            poisonApple = null;
            schedulePoisonSpawn();
        }
    }, poisonDespawnRemaining);
}

function drawPoisonApple() {
    if (!poisonApple) return;

    const timeLeft = poisonDespawnRemaining - (Date.now() - poisonDespawnStart);
    const isAboutToVanish = !paused && timeLeft < 1000;

    // Lampeggia leggermente nell'ultimo secondo
    if (isAboutToVanish && Math.floor(Date.now() / 150) % 2 === 0) {
        ctx.fillStyle = "#d2b4de";
    } else {
        ctx.fillStyle = poisonColor;
    }

    ctx.fillRect(poisonApple.x, poisonApple.y, unitSize, unitSize);
}

// ------------------------------

function drawFood() {
    const isAboutToMove =
        DIFFICULTIES[currentDiff].movingApple &&
        !paused &&
        (foodMoveRemaining - (Date.now() - foodMoveStart)) < 1000;

    if (isAboutToMove && Math.floor(Date.now() / 150) % 2 === 0) {
        ctx.fillStyle = "#ff7675";
    } else {
        ctx.fillStyle = foodColor;
    }

    foods.forEach(food => {
        ctx.fillRect(food.x, food.y, unitSize, unitSize);
    });
}

function moveSnake() {
    const head = { x: snake[0].x + xVelocity, y: snake[0].y + yVelocity };
    snake.unshift(head);

    // Controlla se ha mangiato la mela avvelenata
    if (poisonApple && head.x === poisonApple.x && head.y === poisonApple.y) {
        clearTimeout(poisonDespawnTimeout);
        poisonApple = null;

        // Due pop(): uno annulla l'avanzamento, il secondo riduce di 1 il serpente
        snake.pop();
        snake.pop();

        if (snake.length === 0) {
            running = false;
            clearAllTimers();
            displayGameOver();
            return;
        }

        schedulePoisonSpawn();
        return;
    }

    // Controlla se ha mangiato una mela normale
    const eatenIndex = foods.findIndex(food => food.x === head.x && food.y === head.y);

    if (eatenIndex !== -1) {
        score++;
        scoreText.textContent = score;

        if (score > record) {
            record = score;
            recordText.textContent = record;
            localStorage.setItem("snakeRecord", record);
        }

        foods.splice(eatenIndex, 1);
        spawnApple();

        if (DIFFICULTIES[currentDiff].movingApple) {
            scheduleAppleMove();
        }
    } else {
        snake.pop();
    }
}

function drawSnake() {
    snake.forEach((snakePart, index) => {
        ctx.fillStyle = index === 0 ? snakeHeadColor : snakeColor;
        ctx.strokeStyle = snakeBorder;
        ctx.fillRect(snakePart.x, snakePart.y, unitSize, unitSize);
        ctx.strokeRect(snakePart.x, snakePart.y, unitSize, unitSize);
    });
}

function handleKeyDown(event) {
    if (event.key === " ") {
        event.preventDefault();
        resetGame();
        return;
    }

    if (event.key.toLowerCase() === "p" && running) {
        togglePause();
        return;
    }

    if (changingDirection || paused) return;

    const key = event.key;
    const goingUp = (yVelocity === -unitSize);
    const goingDown = (yVelocity === unitSize);
    const goingLeft = (xVelocity === -unitSize);
    const goingRight = (xVelocity === unitSize);

    if ((key === "ArrowLeft" || key.toLowerCase() === "a") && !goingRight) {
        xVelocity = -unitSize;
        yVelocity = 0;
        changingDirection = true;
    } else if ((key === "ArrowUp" || key.toLowerCase() === "w") && !goingDown) {
        xVelocity = 0;
        yVelocity = -unitSize;
        changingDirection = true;
    } else if ((key === "ArrowRight" || key.toLowerCase() === "d") && !goingLeft) {
        xVelocity = unitSize;
        yVelocity = 0;
        changingDirection = true;
    } else if ((key === "ArrowDown" || key.toLowerCase() === "s") && !goingUp) {
        xVelocity = 0;
        yVelocity = unitSize;
        changingDirection = true;
    }
}

function togglePause() {
    paused = !paused;
    if (paused) {
        clearTimeout(tickTimeout);

        if (DIFFICULTIES[currentDiff].movingApple) {
            clearTimeout(foodMoveTimeout);
            foodMoveRemaining = Math.max(0, foodMoveRemaining - (Date.now() - foodMoveStart));
        }

        if (poisonApple) {
            clearTimeout(poisonDespawnTimeout);
            poisonDespawnRemaining = Math.max(0, poisonDespawnRemaining - (Date.now() - poisonDespawnStart));
        } else {
            clearTimeout(poisonSpawnTimeout);
            poisonSpawnRemaining = Math.max(0, poisonSpawnRemaining - (Date.now() - poisonSpawnStart));
        }

        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, gameWidth, gameHeight);
        ctx.font = "40px Segoe UI";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText("PAUSA", gameWidth / 2, gameHeight / 2);
    } else {
        if (DIFFICULTIES[currentDiff].movingApple) {
            scheduleAppleMove(foodMoveRemaining);
        }

        if (poisonApple) {
            schedulePoisonDespawn(poisonDespawnRemaining);
        } else {
            schedulePoisonSpawn(poisonSpawnRemaining);
        }

        nextTick();
    }
}

function checkGameOver() {
    const hitWall =
        snake[0].x < 0 ||
        snake[0].x >= gameWidth ||
        snake[0].y < 0 ||
        snake[0].y >= gameHeight;

    const hitSelf = snake.slice(1).some(part => part.x === snake[0].x && part.y === snake[0].y);

    if (hitWall || hitSelf) {
        running = false;
        clearAllTimers();
        displayGameOver();
    }
}

function displayGameOver() {
    ctx.font = "50px MV boli, sans-serif";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER!!", gameWidth / 2, gameHeight / 2);
}

function displayYouWin() {
    ctx.font = "50px MV boli, sans-serif";
    ctx.fillStyle = "#4cd187";
    ctx.textAlign = "center";
    ctx.fillText("YOU WIN!!", gameWidth / 2, gameHeight / 2);
    running = false;
    clearAllTimers();
}

function clearAllTimers() {
    clearTimeout(tickTimeout);
    clearTimeout(foodMoveTimeout);
    clearTimeout(poisonSpawnTimeout);
    clearTimeout(poisonDespawnTimeout);
}

function resetGame() {
    clearAllTimers();
    running = false;
    paused = false;
    changingDirection = false;
    poisonApple = null;
    score = 0;
    scoreText.textContent = score;
    xVelocity = unitSize;
    yVelocity = 0;
    snake = createInitialSnake();
    gameStart();
}