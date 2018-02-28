import _ from 'lodash';

export default class GameLogic {

  BLANK_GAME = {
    currentPlayer: null,
    dark: {},
    light: {},
  };

  // standard initial game
  STANDARD_OPENING = {
    currentPlayer: null, // either 'dark' or 'light'
    opponent: null, // opposite of `currentPlayer`
    dark: {0: 2, 11: 5, 16: 3, 18: 5},
    light: {5: 5, 7: 3, 12: 3, 23: 5},
    darkMoves: {}, // maybe should be an object with methods
    lightMoves: {},
    lastRoll: [],
    lastInitialRoll: [],
  };

  constructor() {
    this.lastRoll = null;
    this.setGame(this.BLANK_GAME);
  }

  rolling = false;

  start = function() {
    this.setGame(this.STANDARD_OPENING);
  }

  decide = function() {
//    const roll = this.rollDecidingDice();
    const roll = [3, 6]; // TESTING forces computer player first
//    const roll = [6, 3]; // TESTING forces dark player first
    if (roll[0] === roll[1]) {
      return roll;
    } else {
      this.currentPlayer = (roll[0] > roll[1]) ? 'dark' : 'light';
      this.opponent = (this.currentPlayer === 'dark') ? 'light' : 'dark';
      return roll;
    }
  }

  nextTurn = function () {
    const current = this.currentPlayer;
    this.currentPlayer = this.opponent;
    this.opponent = current;
  }

  // basic roll for player's turn
  rollPlayerDice = function() {
    let lastRoll = this.rollDice();
//    lastRoll = [2, 2]; // TESTING

    if (lastRoll[0] === lastRoll[1]) {
      lastRoll = [lastRoll[0], lastRoll[0], lastRoll[0], lastRoll[0]]
    }

    this.lastInitialRoll = lastRoll.slice();
    this.lastRoll = lastRoll.slice();
    this.setPossibleMoves();
  }

  setPossibleMoves = function() {
    this[this.currentPlayer + 'Moves'] = {}; // clear existing moves
    for(var sq in this[this.currentPlayer]) {
      // Logic for which moves can be made from each occupied spike
      const curr = parseInt(sq, 10);
      const light = (this.currentPlayer === 'light');
      let   first = parseInt(this.lastRoll[0], 10),
       sec = parseInt(this.lastRoll[1], 10);

      // opponent goes backwards
      if (light) {
        first = -first;
        sec = - sec;
      }

      let possibleMoves;

      if (first === sec) {
        possibleMoves = _.map(this.lastRoll, function(val, i) {
          let move;
          const n = light ? -val : val;

          // TODO: simplify
          switch(i) {
            case 0:
              move = curr + n;
              break;
            case 1:
              move = [curr + n, curr + (n * 2)];
              break;
            case 2:
              move = [curr + n, curr + (n * 2), curr + (n * 3)];
              break;
            case 3:
              move = [curr + n, curr + (n * 2), curr + (n * 3), curr + (n * 4)];
              break;
          }
          return move;
        });
      } else {
        if(first && sec) {
          possibleMoves = [curr + first, curr + sec, [curr + first, curr + first + sec]];
        } else {
          possibleMoves = [curr + first];
        }
      }

      // exclude moves occupied by opponent (2 or more chips) and offboard moves, unless player can bear-off.
      let allowedMoves = [];
      const opponentSpikes = this[this.opponent];

      for(var i in possibleMoves) {

        let moveIndex = possibleMoves[i];
        if (Array.isArray(moveIndex)) {
          moveIndex = moveIndex[moveIndex.length - 1];
        }

        const taken = opponentSpikes[moveIndex] || 0,
          isOffboard = (moveIndex > 23 || moveIndex < 0) && !this.canOffboard();

        if (!isOffboard && (!taken || (taken < 2))) {
          allowedMoves.push(possibleMoves[i]);
        }
      }
      this[this.currentPlayer + 'Moves'][sq] = allowedMoves;
    }
  }

  canOffboard = function () {
    return false; // TODO implement
  }

  doMove = function(from, to) {
    const possibleMoves = this[this.currentPlayer + 'Moves'][from];
    const move = _.find(possibleMoves, function (item) {
      const test = Array.isArray(item) ? item[item.length - 1] : item;
      return test === to;
    });

    if (Array.isArray(move)) {
      if (this.lastInitialRoll.length === 2) {
        this.lastRoll = [];
      } else {
        for(var i in move) {
          this.lastRoll.pop();
        }
      }
    } else if (move) {
      this.lastRoll.splice(this.lastRoll.indexOf(to - from), 1);
    };

    const spikes = this[this.currentPlayer];

    if (move) {
      spikes[to] = spikes[to] ? (spikes[to] + 1) : 1;
      spikes[from]--;
      this.setPossibleMoves();
      return true;
    } else {
      return false;
    }
  }

  random = function(val) {
    return Math.floor(Math.random() * val)
  }

  selectRandomMove = function() {
    // TODO this.lightMoves needs to distinguish individual vs compound moves
    const possibleMoves = this.lightMoves,
      movablePieceKeys = Object.keys(this.lightMoves);

    const whichKey = movablePieceKeys[this.random(movablePieceKeys.length)];
    let index = this.random(possibleMoves[whichKey].length);
    let to = possibleMoves[whichKey][index];
    to = Array.isArray(to) ? to[to.length - 1] : to;
    return [parseInt(whichKey), to];
  }

  canMove = function() {
    // TODO: distinguish no moves available
    return this.lastRoll.length;
  }

  automatedMove = function() {
    let moves = [];
    moves.push(this.selectRandomMove());
    return moves;
  }

  // decides who gets first move
  rollDecidingDice = function() {
    return this.rollDice();
  }

  // utility method
  rollDice = function() {
    return [this.random(6) + 1, this.random(6) + 1];
  }

  setGame = function(setting) {
    const obj = JSON.parse(JSON.stringify(setting));
    for(var property in obj) {
      this[property] = obj[property]
    }
  }
}
