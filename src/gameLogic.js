import _ from 'lodash';

export default class GameLogic {

  constructor() {

    this.BLANK_GAME = {
      currentPlayer: null,
      dark: {},
      light: {},
      bar: {dark: 0, light: 0},
    };

    // standard initial game
    this.STANDARD_OPENING = {
      currentPlayer: null, // either 'dark' or 'light'
      opponent: null, // opposite of `currentPlayer`
      dark: {0: 2, 11: 5, 16: 3, 18: 5},
      light: {5: 5, 7: 3, 12: 5, 23: 2},
      darkMoves: {}, // maybe should be an object with methods
      lightMoves: {},
      lastRoll: [],
      lastInitialRoll: [],
      bar: {dark: 0, light: 0},
    };

    this.rolling = false;

    this.lastRoll = null;
    this.setGame(this.BLANK_GAME);
  }


  start() {
    this.setGame(this.STANDARD_OPENING);
  }

  decide() {
    let roll = this.rollDecidingDice();
//     roll = [3, 6]; // TESTING forces computer player first
//     roll = [6, 3]; // TESTING forces dark player first
    if (roll[0] === roll[1]) {
      return roll;
    } else {
      this.currentPlayer = (roll[0] > roll[1]) ? 'dark' : 'light';
      this.opponent = (this.currentPlayer === 'dark') ? 'light' : 'dark';
      return roll;
    }
  }

  nextTurn() {
    const current = this.currentPlayer;
    this.currentPlayer = this.opponent;
    this.opponent = current;
  }

  // basic roll for player's turn
  rollPlayerDice() {
    let lastRoll = this.rollDice();
//    lastRoll = [5,5]; // TESTING

    if (lastRoll[0] === lastRoll[1]) {
      lastRoll = [lastRoll[0], lastRoll[0], lastRoll[0], lastRoll[0]]
    }

    this.lastInitialRoll = lastRoll.slice();
    this.lastRoll = lastRoll.slice();
    this.setPossibleMoves();
  }

  currentPlayerMoves() {
    return this[this.currentPlayer + 'Moves'];
  }

  setPossibleMoves() {
    this[this.currentPlayer + 'Moves'] = {}; // clear existing moves

    let barHash = {};
    barHash[this.currentPlayer === 'dark' ? '-1' : 24] = this.bar[this.currentPlayer];

    // Possible moves are always either from board positions, or from the bar, but never both.
    const movablePieceContainers = this.bar[this.currentPlayer] > 0 ? barHash : this.currentPlayerSpikes();

    for(var index in movablePieceContainers) {
      // Logic for which moves can be made from each occupied spike
      const curr = parseInt(index, 10);
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
          const n = light ? -val : val;
          let move = curr + n;

          if (i > 0) {
            move = [move];
            for(var z = 1; z <= i; z++) {
              move.push(curr + (n * (z + 1)));
            }
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

      for(var i in possibleMoves) {

        let moveIndex = possibleMoves[i];
        if (Array.isArray(moveIndex)) {
          moveIndex = moveIndex[moveIndex.length - 1];
        }

        const taken = this.opponentSpikes()[moveIndex] || 0,
          isOffboard = (moveIndex > 23 || moveIndex < 0) && !this.canOffboard();

        if (!isOffboard && (!taken || (taken < 2))) {
          allowedMoves.push(possibleMoves[i]);
        }
      }

      if (allowedMoves && allowedMoves.length) {
        this.currentPlayerMoves()[index] = allowedMoves;
      }
    }
  }

  canOffboard () {
    return false; // TODO implement
  }

  // TODO these should take an argument for index, else return all
  opponentSpikes() {
    return this[this.opponent];
  }

  currentPlayerSpikes() {
    return this[this.currentPlayer];
  }

  increaseBar(position) {
    // TODO make decrement fn
    this.opponentSpikes()[position]--;
    this.opponentSpikes()[position] === 0 && (delete this.opponentSpikes()[position])

    this.bar[this.opponent]++;
  }

  removeFromBar() {
    this.bar[this.currentPlayer]--;
  }

  doMove(from, to) {

    const possibleMoves = this.currentPlayerMoves()[from];
    const move = _.find(possibleMoves, function (item) {
      const target = Array.isArray(item) ? item[item.length - 1] : item;
      return target === to;
    });

    if (Array.isArray(move)) {
      if (this.lastInitialRoll.length === 2) {
        this.lastRoll = [];
      } else {
        for(var i in move) {
          this.lastRoll.pop();
        }
      }
    } else if (typeof move !== 'undefined') {
      this.lastRoll.splice(this.lastRoll.indexOf(to - from), 1);
    };

    let spikes = this.currentPlayerSpikes();

    if (typeof move !== 'undefined') {
      // blot
      if (this.opponentSpikes()[to] === 1) {
        this.increaseBar(to);
      }

      // chip from bar
      if (from === -1 || from === 24) {
        this.removeFromBar();
      }

      spikes[to] = spikes[to] ? (spikes[to] + 1) : 1;

      // TODO make decrement fn for this nonsense..
      spikes[from]--;
      if(spikes[from] === 0 || !spikes[from]) {
        delete spikes[from]
        delete spikes[from.toString()];
      }

      this.setPossibleMoves();
      return true;
    } else {
      return false;
    }
  }

  random(val) {
    return Math.floor(Math.random() * val);
  }

  selectRandomMove() {
    // TODO this.lightMoves needs to distinguish individual vs compound moves
    const possibleMoves = this.currentPlayerMoves(),
      movablePieceKeys = Object.keys(this.currentPlayerMoves());

    // TODO shouldn't really need this. setPossibleMoves shouldn't populate key if there's no moves
    if (!movablePieceKeys || !_.find(movablePieceKeys, function(i) { return possibleMoves[i] }) ) {
      return;
    }

    const whichKey = movablePieceKeys[this.random(movablePieceKeys.length)];
    let index = this.random(possibleMoves[whichKey].length);
    let to = possibleMoves[whichKey][index];
    to = Array.isArray(to) ? to[to.length - 1] : to;
    return [parseInt(whichKey, 10), to];
  }

  // returns a randomly selected move of those available for the current player,
  // or undefined if current player has no moves.
  automatedMove() {
    if (this.lastRoll && this.lastRoll.length) {
      const move = this.selectRandomMove();
      if (move) {
        return move;
      }
    }
  }

  canMove() {
    return !!this.automatedMove();
  }

  // decides who gets first move
  rollDecidingDice() {
    return this.rollDice();
  }

  // utility method
  rollDice() {
    return [this.random(6) + 1, this.random(6) + 1];
  }

  setGame(setting) {
    const obj = JSON.parse(JSON.stringify(setting));
    for(var property in obj) {
      this[property] = obj[property]
    }
  }
}
