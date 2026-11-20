const gameBoard = document.querySelector("#gameBoard");
const ctx = gameBoard.getContext("2d");
const scoreText = document.querySelector("#scoreText");
const recordText = document.querySelector("#recordText");
const resetBtn = document.querySelector("#resetBtn");
const diffButtons = document.querySelectorAll(".diffBtn");
const arrowButtons = document.querySelectorAll(".arrowBtn");

const gameWidth = gameBoard.width;
const gameHeight = gameBoard.height;
const boardBackground = "rgb(13, 13, 39)";
const gridColor = "rgba(255, 255, 255, 0.05)";
const snakeHeadColor = "#32cd32";
const snakeColor = "green";
const snakeBorder = "black";
const foodColor = "crimson";
const poisonColor = "#9b59b6";
const unitSize = 25;

const DIFFICULTIES = {
    easy: {
        speed: 130,
        appleCount: 2,
        movingApple: false,
        maxPoison: 1,
        poisonMinDelay: 6000,
        poisonMaxDelay: 10000,
        doublePoisonChance: 0
    },
    medium: {
        speed: 75,
        appleCount: 1,
        movingApple: false,
        maxPoison: 1,
        poisonMinDelay: 6000,
        poisonMaxDelay: 10000,
        doublePoisonChance: 0
    },
    hard: {
        speed: 45,
        appleCount: 1,
        movingApple: true,
        moveMinDelay: 4000,
        moveMaxDelay: 5000,
        maxPoison: 1,
        poisonMinDelay: 6000,
        poisonMaxDelay: 10000,
        doublePoisonChance: 0
    },
    extraHard: {
        speed: 36,
        appleCount: 1,
        movingApple: true,
        moveMinDelay: 3000,
        moveMaxDelay: 4000,
        maxPoison: 2,
        poisonMinDelay: 2500,
        poisonMaxDelay: 4500,
        doublePoisonChance: 0.5
    }
};

let currentDiff = "medium";
let running = false;
let paused = false;
let changingDirection = false;
let tickTimeout = null;

// Timer spostamento mela (modalità Difficile ed Extra Difficile)
let foodMoveTimeout = null;
let foodMoveRemaining = 0;
let foodMoveStart = 0;

// Gestione mele avvelenate (array per supportarne fino a 2 contemporaneamente)
let poisonApples = [];
let poisonSpawnTimeout = null;
let poisonSpawnRemaining = 0;
let poisonSpawnStart = 0;

// Coordinate iniziali per il trascinamento touch (swipe)
let touchStartX = 0;
let touchStartY = 0;

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

// Eventi pulsanti direzionali mobile
arrowButtons.forEach(btn => {
    btn.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        setDirection(btn.dataset.dir);
    });
});

// Eventi trascinamento touch (swipe) sul canvas
gameBoard.addEventListener("touchstart", (event) => {
    if (event.touches.length > 0) {
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
    }
}, { passive: false });

gameBoard.addEventListener("touchmove", (event) => {
    event.preventDefault();
    if (event.touches.length === 0) return;

    const currentX = event.touches[0].clientX;
    const currentY = event.touches[0].clientY;
    const diffX = currentX - touchStartX;
    const diffY = currentY - touchStartY;
    const minSwipeDistance = 25;

    if (Math.abs(diffX) > minSwipeDistance || Math.abs(diffY) > minSwipeDistance) {
        if (Math.abs(diffX) > Math.abs(diffY)) {
            setDirection(diffX > 0 ? "RIGHT" : "LEFT");
        } else {
            setDirection(diffY > 0 ? "DOWN" : "UP");
        }
        touchStartX = currentX;
        touchStartY = currentY;
    }
}, { passive: false });

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

function getCurrentSpeed() {
    const baseSpeed = DIFFICULTIES[currentDiff].speed;

    if (currentDiff === "hard") {
        if (score >= 30) return 30;
        if (score >= 20) return 35;
        if (score >= 10) return 40;
    } else if (currentDiff === "extraHard") {
        if (score >= 30) return 24;
        if (score >= 20) return 28;
        if (score >= 10) return 32;
    }

    return baseSpeed;
}

function gameStart() {
    running = true;
    paused = false;
    scoreText.textContent = score;
    foods = [];
    poisonApples = [];

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
        drawPoisonApples();
        moveSnake();

        if (!running) return;

        drawSnake();
        checkGameOver();

        if (running) {
            nextTick();
        }
    }, getCurrentSpeed());
}

function clearBoard() {
    ctx.fillStyle = boardBackground;
    ctx.fillRect(0, 0, gameWidth, gameHeight);

    // Disegna la griglia sottile sullo sfondo
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;

    for (let x = unitSize; x < gameWidth; x += unitSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, gameHeight);
        ctx.stroke();
    }

    for (let y = unitSize; y < gameHeight; y += unitSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(gameWidth, y);
        ctx.stroke();
    }
}

function isCellOccupied(x, y) {
    const onSnake = snake.some(part => part.x === x && part.y === y);
    const onFood = foods.some(food => food.x === x && food.y === y);
    const onPoison = poisonApples.some(poison => poison.x === x && poison.y === y);
    return onSnake || onFood || onPoison;
}

function spawnApple() {
    const totalCells = (gameWidth / unitSize) * (gameHeight / unitSize);

    if (snake.length >= totalCells) {
        displayYouWin();
        return;
    }

    const occupiedCount = snake.length + foods.length + poisonApples.length;
    if (occupiedCount >= totalCells) {
        return;
    }

    let validPosition = false;
    let newX, newY;

    while (!validPosition) {
        newX = Math.floor(Math.random() * (gameWidth / unitSize)) * unitSize;
        newY = Math.floor(Math.random() * (gameHeight / unitSize)) * unitSize;
        validPosition = !isCellOccupied(newX, newY);
    }

    foods.push({ x: newX, y: newY });
}

function scheduleAppleMove(customDelay) {
    clearTimeout(foodMoveTimeout);
    const config = DIFFICULTIES[currentDiff];
    if (!config.movingApple || !running) return;

    foodMoveRemaining = customDelay ?? (config.moveMinDelay + Math.random() * (config.moveMaxDelay - config.moveMinDelay));
    foodMoveStart = Date.now();

    foodMoveTimeout = setTimeout(() => {
        if (running && !paused) {
            foods = [];
            spawnApple();
            scheduleAppleMove();
        }
    }, foodMoveRemaining);
}

// --- LOGICA MELE AVVELENATE ---

function schedulePoisonSpawn(customDelay) {
    clearTimeout(poisonSpawnTimeout);
    const config = DIFFICULTIES[currentDiff];
    if (!running || poisonApples.length >= config.maxPoison) return;

    poisonSpawnRemaining = customDelay ?? (config.poisonMinDelay + Math.random() * (config.poisonMaxDelay - config.poisonMinDelay));
    poisonSpawnStart = Date.now();

    poisonSpawnTimeout = setTimeout(() => {
        if (running && !paused) {
            const slotsAvailable = config.maxPoison - poisonApples.length;
            if (slotsAvailable > 0) {
                const shouldSpawnTwo = slotsAvailable >= 2 && Math.random() < config.doublePoisonChance;
                const countToSpawn = shouldSpawnTwo ? 2 : 1;

                for (let i = 0; i < countToSpawn; i++) {
                    spawnPoisonApple();
                }
            }

            if (poisonApples.length < config.maxPoison) {
                schedulePoisonSpawn();
            }
        }
    }, poisonSpawnRemaining);
}

function spawnPoisonApple() {
    const totalCells = (gameWidth / unitSize) * (gameHeight / unitSize);
    if (snake.length + foods.length + poisonApples.length >= totalCells) {
        return;
    }

    let validPosition = false;
    let newX, newY;

    while (!validPosition) {
        newX = Math.floor(Math.random() * (gameWidth / unitSize)) * unitSize;
        newY = Math.floor(Math.random() * (gameHeight / unitSize)) * unitSize;
        validPosition = !isCellOccupied(newX, newY);
    }

    const poisonObj = {
        x: newX,
        y: newY,
        despawnTimeout: null,
        despawnRemaining: 4000,
        despawnStart: Date.now()
    };

    poisonApples.push(poisonObj);
    startPoisonDespawnTimer(poisonObj, 4000);
}

function startPoisonDespawnTimer(poisonObj, duration) {
    clearTimeout(poisonObj.despawnTimeout);
    poisonObj.despawnRemaining = duration;
    poisonObj.despawnStart = Date.now();

    poisonObj.despawnTimeout = setTimeout(() => {
        if (running && !paused) {
            const idx = poisonApples.indexOf(poisonObj);
            if (idx !== -1) {
                poisonApples.splice(idx, 1);
            }
            schedulePoisonSpawn();
        }
    }, duration);
}

function drawPoisonApples() {
    poisonApples.forEach(poison => {
        const timeLeft = poison.despawnRemaining - (Date.now() - poison.despawnStart);
        const isAboutToVanish = !paused && timeLeft < 1000;

        if (isAboutToVanish && Math.floor(Date.now() / 150) % 2 === 0) {
            ctx.fillStyle = "#d2b4de";
        } else {
            ctx.fillStyle = poisonColor;
        }

        ctx.fillRect(poison.x, poison.y, unitSize, unitSize);
    });
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

    // Controlla se ha mangiato una mela avvelenata
    const poisonIndex = poisonApples.findIndex(p => p.x === head.x && p.y === head.y);
    if (poisonIndex !== -1) {
        const eatenPoison = poisonApples[poisonIndex];
        clearTimeout(eatenPoison.despawnTimeout);
        poisonApples.splice(poisonIndex, 1);

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
    ctx.lineWidth = 1;
    snake.forEach((snakePart, index) => {
        ctx.fillStyle = index === 0 ? snakeHeadColor : snakeColor;
        ctx.strokeStyle = snakeBorder;
        ctx.fillRect(snakePart.x, snakePart.y, unitSize, unitSize);
        ctx.strokeRect(snakePart.x, snakePart.y, unitSize, unitSize);
    });
}

function setDirection(direction) {
    if (changingDirection || paused || !running) return;

    const goingUp = (yVelocity === -unitSize);
    const goingDown = (yVelocity === unitSize);
    const goingLeft = (xVelocity === -unitSize);
    const goingRight = (xVelocity === unitSize);

    if (direction === "LEFT" && !goingRight) {
        xVelocity = -unitSize;
        yVelocity = 0;
        changingDirection = true;
    } else if (direction === "UP" && !goingDown) {
        xVelocity = 0;
        yVelocity = -unitSize;
        changingDirection = true;
    } else if (direction === "RIGHT" && !goingLeft) {
        xVelocity = unitSize;
        yVelocity = 0;
        changingDirection = true;
    } else if (direction === "DOWN" && !goingUp) {
        xVelocity = 0;
        yVelocity = unitSize;
        changingDirection = true;
    }
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

    const key = event.key.toLowerCase();
    if (key === "arrowleft" || key === "a") {
        setDirection("LEFT");
    } else if (key === "arrowup" || key === "w") {
        setDirection("UP");
    } else if (key === "arrowright" || key === "d") {
        setDirection("RIGHT");
    } else if (key === "arrowdown" || key === "s") {
        setDirection("DOWN");
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

        clearTimeout(poisonSpawnTimeout);
        poisonSpawnRemaining = Math.max(0, poisonSpawnRemaining - (Date.now() - poisonSpawnStart));

        poisonApples.forEach(poison => {
            clearTimeout(poison.despawnTimeout);
            poison.despawnRemaining = Math.max(0, poison.despawnRemaining - (Date.now() - poison.despawnStart));
        });

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

        poisonApples.forEach(poison => {
            startPoisonDespawnTimer(poison, poison.despawnRemaining);
        });

        if (poisonApples.length < DIFFICULTIES[currentDiff].maxPoison) {
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
    poisonApples.forEach(poison => clearTimeout(poison.despawnTimeout));
}

function resetGame() {
    clearAllTimers();
    running = false;
    paused = false;
    changingDirection = false;
    poisonApples = [];
    score = 0;
    scoreText.textContent = score;
    xVelocity = unitSize;
    yVelocity = 0;
    snake = createInitialSnake();
    gameStart();
}