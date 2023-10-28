const rows = Array.from(document.querySelectorAll('.tiles'));
const gameConsole = document.getElementById('console');
const scorePlayer1 = document.querySelector('.player.player1 .score');
const scorePlayer2 = document.querySelector('.player.player2 .score');

const PLAYER_1 = 1;
const PLAYER_2 = 2;
let playerTurn = PLAYER_1;
let isGameOver = false;

const movementDirections = getMovementDirections();
const placementHistory = [];
const board = [
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,PLAYER_1,PLAYER_2,0,0,0],
    [0,0,0,PLAYER_2,PLAYER_1,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0]
]

function updatePlayerTurn() {
    playerTurn = playerTurn === PLAYER_1 ? PLAYER_2 : PLAYER_1;
    setPlayerTurnMessage();
}

function setPlayerTurnMessage() {
    gameConsole.className = "";
    const playerNumber = playerTurn === PLAYER_1 ? "1" : "2";
    gameConsole.innerText = `Player ${playerNumber}'s turn`;
    gameConsole.classList.add(`player${playerNumber}`);
}

function getOtherPlayer() {
    return playerTurn === PLAYER_1 ? PLAYER_2 : PLAYER_1;
}

function getMovementDirections() {
    const directions = [];
    const possibleDirections = [-1, 0, 1];

    possibleDirections.forEach(rowMovement => {
        possibleDirections.forEach(cellMovement=> {
            if(rowMovement === 0 && cellMovement === 0) return;
            directions.push({rowDirection: rowMovement, cellDirection: cellMovement});
        })
    })
    return directions;
}

function navigateDiscLine(
    rowIndex,
    cellIndex,
    rowDirection,
    cellDirection,
    sawOtherPlayer,
    executeFuncIfValid
) {
    if(!isIndexValid(rowIndex) || !isIndexValid(cellIndex)) return false;
    
    const currentCellValue = board[rowIndex][cellIndex];
    if(currentCellValue === 0) return false;

    if(currentCellValue === playerTurn) return sawOtherPlayer;

    const isValidLine = navigateDiscLine(
        rowIndex + rowDirection,
        cellIndex + cellDirection,
        rowDirection,
        cellDirection,
        true,
        executeFuncIfValid
    );

    if (isValidLine && executeFuncIfValid) {
        executeFuncIfValid(rowIndex, cellIndex);
    }

    return isValidLine;
}

function checkPlacementIsValid(rowIndex, cellIndex) {
    let isValid = false;
    movementDirections.forEach(direction => {
        isValid |= navigateDiscLine(
            rowIndex + direction.rowDirection,
            cellIndex + direction.cellDirection,
            direction.rowDirection,
            direction.cellDirection,
            false,
            null
        );
    });
    return isValid;
}

function findValidPlacements() {
    const emptySpacesAroundOtherPlayer = findEmptyCellsAroundOtherPlayer();

    const validPlacements = [];
    const coordinatesAdded = new Set();
    emptySpacesAroundOtherPlayer.forEach(coords => {
        const coordsKey = `${coords.rowIndex}${coords.cellIndex}`;
        if(coordinatesAdded.has(coordsKey)) return;
        coordinatesAdded.add(coordsKey);

        const isValid = checkPlacementIsValid(coords.rowIndex, coords.cellIndex);
        if(isValid) {
            validPlacements.push(coords);
        }
    })
    return validPlacements;
}

function findEmptyCellsAroundOtherPlayer() {
    const indexesToCheck = [];
    const otherPlayerIndexes = findIndexesForPlayer(getOtherPlayer());
    otherPlayerIndexes.forEach(otherPlayer => {
        movementDirections.forEach(direction => {
            const checkRowIndex = otherPlayer.rowIndex + direction.rowDirection;
            const checkCellIndex = otherPlayer.cellIndex + direction.cellDirection;

            if (!isIndexValid(checkRowIndex) || !isIndexValid(checkCellIndex)) return;
            
            if(board[checkRowIndex][checkCellIndex] === 0) {
                indexesToCheck.push({rowIndex: checkRowIndex, cellIndex: checkCellIndex});
            }
        });
    })
    return indexesToCheck;
}

function isIndexValid(index) {
    return 0 <= index && index < board.length;
}

function findIndexesForPlayer(player){
    const indexes = [];
    board.forEach((row, rowIndex) => {
        row.forEach((cell, cellIndex) => {
            if(board[rowIndex][cellIndex] === player) {
                indexes.push({rowIndex, cellIndex});
            }
        })
    })    
    return indexes;
}

function flipDiscs(rowIndex, cellIndex) {
    movementDirections.forEach(direction => {
        navigateDiscLine(
            rowIndex + direction.rowDirection,
            cellIndex + direction.cellDirection,
            direction.rowDirection,
            direction.cellDirection,
            false,
            (updateRowIndex, updateCellIndex) => {
                board[updateRowIndex][updateCellIndex] = playerTurn;
            }
        );
    });
}

function addClickEventsToBoard() {
    rows.forEach((row, rowIndex) => {
        Array.from(row.children).forEach((cell, cellIndex) => {
            cell.addEventListener('click', function () {
                if (isGameOver) return;

                const addedSuccessfully = addDisc(rowIndex, cellIndex, cell);
                if(!addedSuccessfully) return;

                placementHistory.push({
                    rowIndex,
                    cellIndex,
                    player: playerTurn === PLAYER_1 ? "Player 1" : "Player 2"
                });
                console.log(placementHistory);
                
                flipDiscs(rowIndex, cellIndex);
                updatePlayerTurn();
                updateBoard();

                const {player1ScoreValue, player2ScoreValue} = updateScores();
                checkGameOver(player1ScoreValue, player2ScoreValue);
            })
        })
    })
}

function checkGameOver(player1ScoreValue, player2ScoreValue) {
    const maxScore = board.flat().length;

    if(player1ScoreValue + player2ScoreValue === maxScore) {
        gameConsole.className = "";
        gameConsole.innerText = `GAME OVER! ${getWinner(player1ScoreValue, player2ScoreValue)}`;
        isGameOver = true;
        return;
    }

    const validPlacements = findValidPlacements();
    if (!validPlacements || validPlacements.length === 0) {
        gameConsole.className = "";
        gameConsole.innerText = "Game Over. No valid placements available.";
        isGameOver = true;
    }
}

function getWinner(player1ScoreValue, player2ScoreValue) {
    if (player1ScoreValue > player2ScoreValue) return "Player 1 wins!";
    if (player1ScoreValue < player2ScoreValue) return "Player 2 wins!";
    return "";
}

function addDisc(rowIndex, cellIndex, cell) {
    if (!cell || cell.classList.contains('disc')) return;

    const validPlacements = findValidPlacements();
    const isSelectedPositionValid = validPlacements.find(placement => {
        return placement.rowIndex === rowIndex && placement.cellIndex === cellIndex;
    });
    if (!isSelectedPositionValid) return false;

    board[rowIndex][cellIndex] = playerTurn;
    return true;
}

function updateScores() {
    const allValuesOnBoard = board.flat();
    const player1ScoreValue = allValuesOnBoard.filter(value => value == PLAYER_1).length;
    const player2ScoreValue = allValuesOnBoard.filter(value => value == PLAYER_2).length;

    scorePlayer1.innerHTML = `Score: ${player1ScoreValue}`;
    scorePlayer2.innerHTML = `Score: ${player2ScoreValue}`;

    return {player1ScoreValue, player2ScoreValue};
}

function updateBoard() {
    board.forEach((row, rowIndex) => {
        row.forEach((cell, cellIndex) => {
            const updateBoardSquare = rows[rowIndex].children[cellIndex];
            updateBoardSquare.className = "";
            if (cell === PLAYER_1) {
                updateBoardSquare.classList.add("disc", "player1");
            } else if (cell === PLAYER_2) {
                updateBoardSquare.classList.add("disc", "player2");
            }
        })
    });

    const validPlacements = findValidPlacements();
    validPlacements.forEach(placement => {
        const updateCell = Array.from(rows[placement.rowIndex].children)[placement.cellIndex];
        updateCell.classList.add('validPlacement');
    });
}

addClickEventsToBoard();
updateBoard();
setPlayerTurnMessage();