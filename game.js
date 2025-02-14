const gameBoard = document.querySelector("#gameBoard");
const ctx = gameBoard.getContext("2d");
const scoreText = document.querySelector("#scoreText");
const resetBtn = document.querySelector("#resetBtn");
const gameWidth = gameBoard.width;
const gameHeight = gameBoard.height;
const boardBackground = "white";
const snakeColor = "green";
const snakeBorder = "black";
const foodColor = "red";
const unitSize = 25;
let running = false;
let xVelocity = unitSize;
let yVelocity = 0;
let foodX;
let foodY;
let score = 0;

// SNAKE: each object is a body part of the snake
let snake = [
    {x:0, y:0},
    {x:unitSize, y:0},
    {x:unitSize * 2, y:0},
    {x:unitSize * 3, y:0},
    {x:unitSize * 4, y:0}
];

// input
window.addEventListener("keydown", changeDirection);
resetBtn.addEventListener("click", resetGame);

gameStart();

function gameStart(){
    running = true; // game's running
    scoreText.textContent = score;

    createFood();
    drawFood();
    nextTick(); // update
};

// refreshes game
function nextTick(){
    if (running) {
        setTimeout(()=>{
            clearBoard();
            drawFood();
            moveSnake();
            drawSnake();
            checkGameOver();
            nextTick();
        }, 75);
    } else { // game over
        displayGameOver();
    }
};


function clearBoard(){
    ctx.fillStyle = boardBackground;
    ctx.fillRect(0, 0, gameWidth, gameHeight);
};

// randomly choose coordinates for the food to be drawn
function createFood(){
    // random number for food generation
    function randomFood(min, max) {
        return Math.round((Math.random()*(max-min)+min) / unitSize)*unitSize;
    }

    // coordinates
    foodX = randomFood(0, gameWidth - unitSize);
    foodY = randomFood(0, gameWidth - unitSize);
};

// draw food
function drawFood(){
    ctx.fillStyle = foodColor;
    ctx.fillRect(foodX, foodY, unitSize, unitSize);
};

function moveSnake(){
    const head = {x: snake[0].x + xVelocity,
        y: snake[0].y + yVelocity};
    
        snake.unshift(head);

        // if food is eaten
        if (snake[0].x == foodX && snake[0].y == foodY) {
            score++;
            scoreText.textContent = score;
            createFood();
        } else {
            snake.pop();
        }
};

function drawSnake(){
    ctx.fillStyle = snakeColor;
    ctx.strokeStyle = snakeBorder;
    snake.forEach(snakePart => {
        ctx.fillRect(snakePart.x, snakePart.y, unitSize, unitSize);
        ctx.strokeRect(snakePart.x, snakePart.y, unitSize, unitSize);
    });
};

function changeDirection(event){
    const keyPressed = event.keyCode;

    // keys
    const LEFT = 37;
    const UP = 38;
    const RIGHT = 39;
    const DOWN = 40;

    // current direction
    const goingUp = (yVelocity == -unitSize);
    const goingDown = (yVelocity == unitSize);
    const goingLeft = (xVelocity == -unitSize);
    const goingRight = (xVelocity == unitSize);

    // change direction without making an u turn
    switch(true){
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
};

// game over
function checkGameOver(){
    // https://www.youtube.com/watch?v=Je0B3nHhKmM
};

function displayGameOver(){};
function resetGame(){};