const gameBoard = document.querySelector("#gameBoard");
const ctx = gameBoard.getContext("2d");
const scoreText = document.querySelector("#scoreText");
const recordText = document.querySelector("#recordText");
const resetBtn = document.querySelector("#resetBtn");
const gameWidth = gameBoard.width;
const gameHeight = gameBoard.height;
const boardBackground = "rgb(13, 13, 39)";
const snakeColor = "green";
const snakeBorder = "black";
const foodColor = "darkred";
const unitSize = 25;
let running = false;
let xVelocity = 0;
let yVelocity = 0;
let foodX;
let foodY;
let score = 0;
let record = score;
let failureToDraw = 0;

// SNAKE: each object is a body part of the snake
let snake = [
    { x: gameWidth / 2, y: gameHeight / 2 },
    { x: gameWidth / 2 - unitSize, y: gameHeight / 2 },
    { x: gameWidth / 2 - unitSize * 2, y: gameHeight / 2 },
    { x: gameWidth / 2 - unitSize * 3, y: gameHeight / 2 },
    { x: gameWidth / 2 - unitSize * 4, y: gameHeight / 2 }
];

// Input events
window.addEventListener("keydown", changeDirection);
window.addEventListener("keydown", (event) => {
    if (event.key === " ") {
        event.preventDefault(); // Prevent page scrolling
        resetGame();
    }
});
resetBtn.addEventListener("click", resetGame);

gameStart();

function gameStart() {
    running = true; // The game is running
    scoreText.textContent = score;

    createFood();
    drawFood();
    nextTick(); // Update the game
};

// Game refresh function
function nextTick() {
    if (running) {
        setTimeout(() => {
            clearBoard();
            drawFood();
            moveSnake();
            checkGameOver();
            drawSnake();
            nextTick();
        }, 75);
    } else {
        displayGameOver();
    }
}

// Clears the game board
function clearBoard() {
    ctx.fillStyle = boardBackground;
    ctx.fillRect(0, 0, gameWidth, gameHeight);
}

// Creates food at random coordinates
function createFood() {
    // Random number generator for food placement
    function randomFood(min, max) {
        return Math.round((Math.random() * (max - min) + min) / unitSize) * unitSize;
    }

    // Random coordinates for the food
    foodX = randomFood(0, gameWidth - unitSize);
    foodY = randomFood(0, gameHeight - unitSize);
    
    checkDrawPossibility();
}

function checkDrawPossibility(){
    let PositionFree = true;
    for(let i = 0; i < snake.lenght; i++){

    if(foodX != snake[i].x && foodY != snake[i].y){
        Continue;
    }else{
        PositionFree = False;
        Break;
    }

    if(PositionFree){
        failureToDraw = 0;
        drawFood()
    }else{
         failureToDraw++;
    
         if(failureToDraw === 400){
             displayYouWin()
         }else{
             createFood()
        }
    }

}

function displayYouWin() {
    ctx.font = "50px MV boli";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText("You Win", gameWidth /           gameHeight / 2);
    running = false;
}

// Draws the food on the board
function drawFood() {
    ctx.fillStyle = foodColor;
    ctx.fillRect(foodX, foodY, unitSize, unitSize);
}

// Moves the snake based on its current velocity
function moveSnake() {
    const head = { x: snake[0].x + xVelocity, y: snake[0].y + yVelocity };
    snake.unshift(head);

    // If the snake eats the food
    if (snake[0].x == foodX && snake[0].y == foodY) {
        score++;
        scoreText.textContent = score;
        createFood();
    } else {
        snake.pop();
    }
}

// Draws the snake on the board
function drawSnake() {
    ctx.fillStyle = snakeColor;
    ctx.strokeStyle = snakeBorder;
    snake.forEach(snakePart => {
        ctx.fillRect(snakePart.x, snakePart.y, unitSize, unitSize);
        ctx.strokeRect(snakePart.x, snakePart.y, unitSize, unitSize);
    });
}

// Changes the direction of the snake based on the key pressed
function changeDirection(event) {
    const keyPressed = event.keyCode;

    // Arrow keys
    const LEFT = 37;
    const UP = 38;
    const RIGHT = 39;
    const DOWN = 40;

    // Current direction of the snake
    const goingUp = (yVelocity == -unitSize);
    const goingDown = (yVelocity == unitSize);
    const goingLeft = (xVelocity == -unitSize);
    const goingRight = (xVelocity == unitSize);

    // Change direction without making a U-turn
    switch (true) {
        case (keyPressed == LEFT && !goingRight):
            xVelocity = -unitSize;
            yVelocity = 0;
            break;
        case (keyPressed == UP && !goingDown):
            xVelocity = 0;
            yVelocity = -unitSize;
            break;
        case (keyPressed == RIGHT && !goingLeft):
            xVelocity = unitSize;
            yVelocity = 0;
            break;
        case (keyPressed == DOWN && !goingUp):
            xVelocity = 0;
            yVelocity = unitSize;
            break;
    }
}

// Checks if the game is over
function checkGameOver() {
    // Check if the snake touches the borders
    if (snake[0].x < 0 || snake[0].x >= gameWidth || snake[0].y < 0 || snake[0].y >= gameHeight) {
        running = false;
    }

    // TODO: Check if the snake collides with itself
    for(let i = 1; i < snake.length; i++) {
        if(snake[i].x == snake[0].x && snake[i].y == snake[0].y) {
            running = false;
        }
    }

    if (!running) {
        displayGameOver();
    }
}

// Displays the "Game Over" message
function displayGameOver() {
    ctx.font = "50px MV boli";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER!!", gameWidth / 2, gameHeight / 2);
    running = false;
}

// Resets the game
function resetGame() {
    // Check if there's a new record
    if (score > record) {
        record = score;
        recordText.textContent = record;
    }

    // Stop the current game
    running = false;

    // Reset game parameters
    score = 0;
    scoreText.textContent = score;
    xVelocity = unitSize;
    yVelocity = 0;

    // Recreate the snake
    snake = [
        { x: gameWidth / 2, y: gameHeight / 2 },
        { x: gameWidth / 2 - unitSize, y: gameHeight / 2 },
        { x: gameWidth / 2 - unitSize * 2, y: gameHeight / 2 },
        { x: gameWidth / 2 - unitSize * 3, y: gameHeight / 2 },
        { x: gameWidth / 2 - unitSize * 4, y: gameHeight / 2 }
    ];

    // Start the game again after a short delay
    setTimeout(gameStart, 100);
}