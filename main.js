const gameEl = document.getElementById('game'),
	scoreEl = document.getElementById('score'),
	speedEl = document.getElementById('speed'),
	newGameEl = document.getElementById('new'),
	playGameEl = document.getElementById('play'),
	pauseEl = document.getElementById('pause'),
	recordEl = document.getElementById('record');


const config = {
	initialLength: 5,
	stepDuration: 500,
	speedUp: 0.9,
	foodScore: 20,
	speedUpScoreN: 100,
	fieldWidth: 20,
	fieldHeight: 20,
	cellSize: 15,
};

let gameStatus = 'new'; //'new', 'play', 'stopped'
let score = 0;
let speed = 1;
let record = localStorage.getItem('SnakeRecord') || 0;
let currentSpeedDuration = config.stepDuration;
let food = [];
let isEating = false;
let snake = [];
let snakeDirection = 'right';
let snakeChunksDirections = [];
let tickId = null;
let currentStepDuration = config.stepDuration;

function initField() {
	const fieldEl = document.createElement('div');
	fieldEl.classList.add('field');
	fieldEl.setAttribute('style', `width: ${config.cellSize * config.fieldWidth}px; height: ${config.cellSize * config.fieldHeight}px`)

	for (let i = 0; i < config.fieldWidth; i++) {
		for (let j = 0; j < config.fieldHeight; j++) {
			const cellEl = document.createElement('div');
			cellEl.classList.add('cell');
			cellEl.setAttribute('id', `${j}.${i}`);
			cellEl.setAttribute('style', `width: ${config.cellSize}px; height: ${config.cellSize}px`);
			fieldEl.append(cellEl);
		}
	}

	gameEl.textContent = '';
	gameEl.append(fieldEl);
	recordEl.textContent = record;
};

function initSnake() {
	const newSnake = [...snake];
	const newSnakeChunksDirections = [...snakeChunksDirections];

	const initialY = Math.floor(config.fieldHeight / 2);
	const initialX = 0;

	for (let i = 0; i < config.initialLength; i++) {
		newSnake.push([initialX + i, initialY]);
		newSnakeChunksDirections.push('right');
	}

	snake = [...newSnake.reverse()];
	snakeChunksDirections = [...newSnakeChunksDirections.reverse()];

};

const checkIfOnSnake = (coords) => {
	for (let i = 0; i < snake.length; i++) {
		const chunk = snake[i];
		if (coords[0] === chunk[0] && coords[1] === chunk[1]) return true;
	}
};

function createFood() {
	let x;
	let y;

	let notOnSnake = true;

	while (notOnSnake) {
		y = Math.floor(Math.random() * config.fieldHeight);
		x = Math.floor(Math.random() * config.fieldWidth);
		notOnSnake = checkIfOnSnake([x, y])
	}
	food = [x, y];
};

function clearFood() {
	const foodCellEl = document.querySelectorAll('.food');
	for (chunk of foodCellEl) {
		if (chunk) {
			chunk.classList.remove('food')
		}
	}
};

function drawFood() {
	clearFood();
	const cellFoodEl = document.getElementById(`${food[0]}.${food[1]}`);
	if (cellFoodEl) {
		cellFoodEl.classList.add('food');
	}
};

function eatFood() {
	score += config.foodScore;
	food = [];
	createFood();
	drawFood();
	isEating = true;
	scoreEl.innerHTML = score;

	if (score > 0 && score % config.speedUpScoreN === 0) {
		speed++;
		speedEl.innerHTML = speed;
		currentStepDuration = currentStepDuration * config.speedUp;
		stopTick();
		tick();
	}
};

function clearSnake() {
	const snakeCellEl = document.querySelectorAll('.snake');

	for (chunk of snakeCellEl) {
		chunk.classList.remove('snake')
	}
};

function drawSnake() {
	clearSnake();
	const drawingSnake = [...snake];

	for (let i = 0; i < drawingSnake.length; i++) {
		const x = drawingSnake[i][0];
		const y = drawingSnake[i][1];

		const snakeCellEl = document.getElementById(`${x}.${y}`);
		if (snakeCellEl) {
			snakeCellEl.classList.add('snake');
		}
	}
};

function snakeChangeChunksDirections() {

	let movedSnakeChunksDirections = [...snakeChunksDirections]

	for (let i = 0; i < movedSnakeChunksDirections.length - 1; i++) {
		const index = movedSnakeChunksDirections.length - 1 - i;
		movedSnakeChunksDirections[index] = movedSnakeChunksDirections[index - 1]
	}
	snakeChunksDirections = [...movedSnakeChunksDirections]
};

function canTurn(direction) {
	if (snakeDirection === direction) {
		return false;
	}

	if (snakeDirection === 'right' && direction === 'left') {
		return false;
	}
	if (snakeDirection === 'left' && direction === 'right') {
		return false;
	}
	if (snakeDirection === 'up' && direction === 'down') {
		return false;
	}
	if (snakeDirection === 'down' && direction === 'up') {
		return false;
	}
	return true;
};

function moveSnake() {
	let movedSnake = [...snake];
	const currentSnakeChunksDirections = [...snakeChunksDirections];
	const tail = {
		location: movedSnake[movedSnake.length - 1],
		direction: currentSnakeChunksDirections[currentSnakeChunksDirections.length - 1]
	};
	for (let i = 0; i < movedSnake.length; i++) {
		const direction = currentSnakeChunksDirections[i];
		let chunk = movedSnake[i]
		if (direction == 'up') {
			chunk = [chunk[0], chunk[1] - 1];
		}
		if (direction == 'down') {
			chunk = [chunk[0], chunk[1] + 1];
		}
		if (direction == 'left') {
			chunk = [chunk[0] - 1, chunk[1]];
		}
		if (direction == 'right') {
			chunk = [chunk[0] + 1, chunk[1]];
		}
		movedSnake[i] = chunk;
	}
	if (isEating) {
		movedSnake.push(tail.location);
		snakeChunksDirections.push(tail.direction);
		isEating = false;
	}

	snake = [...movedSnake];

};

function ifCollision() {
	const snakeHead = snake.slice(0, 1)[0];
	const direction = snakeChunksDirections.slice(0, 1)[0];
	let nextStepSnakeHead = (direction === 'up') ? [snakeHead[0], snakeHead[1] - 1] :
		(direction === 'down') ? [snakeHead[0], snakeHead[1] + 1] :
			(direction === 'left') ? [snakeHead[0] - 1, snakeHead[1]] :
				[snakeHead[0] + 1, snakeHead[1]];

	if (direction == 'up' && nextStepSnakeHead[1] < 0 || checkIfOnSnake(nextStepSnakeHead)) return true;
	if (direction == 'down' && nextStepSnakeHead[1] >= config.fieldHeight || checkIfOnSnake(nextStepSnakeHead)) return true;
	if (direction == 'left' && nextStepSnakeHead[0] < 0 || checkIfOnSnake(nextStepSnakeHead)) return true;
	if (direction == 'right' && nextStepSnakeHead[0] >= config.fieldWidth || checkIfOnSnake(nextStepSnakeHead)) return true;
	if (nextStepSnakeHead[0] === food[0] && nextStepSnakeHead[1] === food[1]) {
		eatFood();
	}
	return false;
};

function saveRecord() {
	if (score > record) {
		localStorage.setItem('SnakeRecord', score);
		recordEl.innerHTML = score;
	}
};

function stopTick() {
	if (tickId) {
		clearInterval(tickId);
		tickId = null;
	}
};

function tick() {
	stopTick();

	tickId = setInterval(function () {
		if (ifCollision()) {
			stopTick();
			alert('Game over');
			saveRecord();
			pauseEl.setAttribute('style', 'display: none');
			newGameEl.setAttribute('style', 'display: block');
		} else {
			moveSnake();
			snakeChangeChunksDirections();
			drawSnake();
		}
	}, currentStepDuration);
};

function setListeners() {
	newGameEl.addEventListener('click', event => {
		setDefault();
		startGame();
		newGameEl.setAttribute('style', 'display: none');
		playGameEl.setAttribute('style', 'display: block');
	})

	playGameEl.addEventListener('click', () => {
		tick();
		playGameEl.setAttribute('style', 'display: none');
		pauseEl.setAttribute('style', 'display: block');
	})

	pauseEl.addEventListener('click', () => {
		stopTick();
		pauseEl.setAttribute('style', 'display: none');
		playGameEl.setAttribute('style', 'display: block');
	})

	document.addEventListener('keydown', event => {
		const keyCode = event.keyCode;
		const directions = {
			38: 'up',
			87: 'up',
			39: 'right',
			68: 'right',
			40: 'down',
			83: 'down',
			37: 'left',
			65: 'left',
		};

		if (directions[keyCode]) {
			event.preventDefault();
			if (canTurn(directions[keyCode])) {
				snakeDirection = directions[keyCode];
				snakeChunksDirections[0] = snakeDirection;
				if (!ifCollision()) {
					tick();
					moveSnake();
					snakeChangeChunksDirections();
					drawSnake();
				}
			}
		}
	})
};

function setDefault() {
	score = 0;
	speed = 1;
	currentStepDuration = config.stepDuration;
	food = [];
	snake = [];
	snakeDirection = 'right';
	snakeChunksDirections = [];
	tickId = null;
	currentStepDuration = config.stepDuration;
	scoreEl.innerHTML = score;
	speedEl.innerHTML = speed;

};

function startGame() {
	setDefault()
	initField();
	initSnake();
	drawSnake();
	createFood();
	drawFood();
};

const main = function () {
	startGame();
	setListeners();
};

window.onload = main();