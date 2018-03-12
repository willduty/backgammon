import _ from 'lodash';

export default class GameLogic {

  constructor() {
    this.BLANK_GAME = {
      currentPlayer: null,
      dark: {},
      light: {},
    };

    // standard initial game
    this.STANDARD_OPENING = {
      currentPlayer: null, // either 'dark' or 'light'
      opponent: null, // opposite of `currentPlayer`
      dark: {0: 2, 11: 5, 16: 3, 18: 5},
      light: {5: 5, 7: 3, 12: 5, 23: 2},
      darkMoves: {}, // maybe should be an object with methods
      lightMoves: {},
      darkOff: 0,
      lightOff: 0,
      lastRoll: [],
      lastInitialRoll: [],
    };

    this.gameOn = false;
    this.lastRoll = null;
    this.setGame(this.BLANK_GAME);
  }

  // Sets board with standard chips in place.
  // Does not set currentPlayer... call decide() to set who starts.
  start() {
    this.gameOn = true;
    this.setGame(this.STANDARD_OPENING);
  }

  end() {
    this.gameOn = false;
    // TODO save history
  }

  // Sets who starts the game. ie, sets this.currentPlayer and this.opponent
  // Does not start the turn, which happens on rollPlayerDice().
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

  // Switches the opponent to be the current player and vice versa.
  nextTurn() {
    const current = this.currentPlayer;
    this.currentPlayer = this.opponent;
    this.opponent = current;
  }

  // Roll for current player's turn.
  // Sets lastRoll, lastInitialRoll, and the player's possible moves.
  // Once this is called, the player can begin moving pieces, or automated moves can be performed.
  rollPlayerDice() {
    let lastRoll = this.rollDice();
//    lastRoll = [1,2]; // TESTING

    if (lastRoll[0] === lastRoll[1]) {
      lastRoll = [lastRoll[0], lastRoll[0], lastRoll[0], lastRoll[0]];
    }

    this.lastInitialRoll = lastRoll.slice();
    this.lastRoll = lastRoll.slice();
    this.setPossibleMoves();
  }

  // Return moves hash or array depending on whether 'index' is provided.
  // if provided, returns just the array of moves from 'index'
  // if not provided, a hash of all 'from' indices with value array of moves is returned
  // array of moves is either target (a number) or array of numbers which are the steps in a compound move
  currentPlayerMoves(index) {
    const moves = this[this.currentPlayer + 'Moves'];
    if (moves) {
      return arguments.length ? moves[index] : moves;
    }
  }

  // Returns only the possible target points. 'index' is required.
  currentPlayerTargets(index) {
    const moves = this.currentPlayerMoves(index);
    let targets = [];
    if(Array.isArray(moves)) {
      targets = moves.map(function(item) {
        return Array.isArray(item) ? item[item.length - 1] : item;
      });
    }
    return targets;
  }

  isBarIndex(index) {
    return index === -1 || index === 24;
  }

  bar() {
    let hash = {'dark' : 0, 'light' : 0};
    if (this.currentPlayerSpikes()) {
      hash['dark'] = this.dark['-1'] || 0;
      hash['light'] = this.light[24] || 0;
    }
    return hash;
  }

  playerHasBarMove(player) {
    const ok = this.currentPlayerMoves(player === 'dark' ? '-1' : 24);
    return (this.currentPlayer === player) && ok;
  }

  // Sets the possible moves for currentPlayer based on the current value of this.lastRoll
  setPossibleMoves() {
    this[this.currentPlayer + 'Moves'] = {}; // clear existing moves

    let barHash;
    const val = this.bar()[this.currentPlayer];
    if (val > 0) {
      const idx = [this.currentPlayer === 'dark' ? '-1' : 24];
      barHash = {};
      barHash[idx] = this.currentPlayerSpikes()[idx];
    }

    // Possible moves are always either from board positions, or from the bar, but never both.
    const movablePieceContainers = barHash || this.currentPlayerSpikes();

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
        let moveTarget = possibleMoves[i];
        let compound;

        if (Array.isArray(moveTarget)) {
          compound = true;
          moveTarget = moveTarget[moveTarget.length - 1];
        }

        let taken = this.opponentSpikes()[moveTarget] || 0;
        if (compound) {
          const opponentSpikes = this.opponentSpikes();
          const point = _.find(possibleMoves[i], function(point) {
            return opponentSpikes[Array.isArray(point) ? point[point.length - 1] : point] > 1;
          });
          if (point) {
            taken = opponentSpikes[Array.isArray(point) ? point[point.length - 1] : point]
          }
        }

        if (barHash && (barHash[-1] > 1 || barHash[24] > 1) && compound) {
          // TODO nothing
        } else if ((moveTarget > 23 || moveTarget < 0)) {
          this.canOffboard() && allowedMoves.push('off');
        } else if (!taken || (taken < 2)) {
          allowedMoves.push(possibleMoves[i]);
        }
      }

      if (allowedMoves.length) {
        this[this.currentPlayer + 'Moves'][index] = allowedMoves;
      }
    }
  }

  gameActive() {
    return true; // TODO implement
  }

  canOffboard() {
    const currKeys = Object.keys(this.currentPlayerSpikes());
    const currPlayer = this.currentPlayer;
    const ready = !_.find(currKeys, function(key) {
      return currPlayer === 'dark' ? key < 18 : key > 5;
    });
    return ready;
  }

  // TODO these should take an argument for index, else return all
  opponentSpikes() {
    return this[this.opponent];
  }

  currentPlayerSpikes() {
    return this[this.currentPlayer];
  }

  currentPlayerHasWon() {
    const allChipsOff = this[this.currentPlayer + 'Off'] === 15,
      noChipsOnBoard = !Object.keys(this.currentPlayerSpikes()).length;

    return noChipsOnBoard && allChipsOff;
  }

  // Move a current player's chip from -> to and change this.lastRoll to exclude used dice.
  // This can be called again partway through a move as the moves are set on the current value of this.lastRoll
  doMove(from, to) {
    const possibleMoves = this.currentPlayerMoves(from);

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
      this.lastRoll.splice(this.lastRoll.indexOf(Math.abs(to - from)), 1);
    };

    let spikes = this.currentPlayerSpikes();

    if (typeof move !== 'undefined') {

      // TODO make decrement fn for the deletes below

      // if blot occurred...
      if (this.opponentSpikes()[to] === 1) {
        this.opponentSpikes()[to]--;
        this.opponentSpikes()[to] === 0 && (delete this.opponentSpikes()[to])
        const opponentBarIndex = this.opponent === 'dark' ? '-1' : 24;
        const curr = this.opponentSpikes()[opponentBarIndex];
        this.opponentSpikes()[opponentBarIndex] = curr ? curr + 1 : 1;
      }

      // increase decrease chip counts..
      if (move === 'off') {
        this[this.currentPlayer + 'Off']++;
      } else {
        spikes[to] = spikes[to] ? (spikes[to] + 1) : 1;
      }

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

  selectRandomMove(index) {
    const possibleMoves = this.currentPlayerMoves();
    let movablePieceKeys  = Object.keys(this.currentPlayerMoves());

    // TODO shouldn't really need this. setPossibleMoves shouldn't populate key if there's no moves
    if (!movablePieceKeys || !_.find(movablePieceKeys, function(i) { return possibleMoves[i] }) ) {
      return;
    }

    const whichKey = (typeof arguments[0] !== 'undefined' ) ? index : movablePieceKeys[this.random(movablePieceKeys.length)];
    if (!possibleMoves[whichKey]) {
      return;
    }
    let target = this.random(possibleMoves[whichKey].length);
    let to = possibleMoves[whichKey][target];
    to = Array.isArray(to) ? to[to.length - 1] : to;
    return [parseInt(whichKey, 10), to];
  }

  // returns a randomly selected move of those available for the current player,
  // or undefined if current player has no moves.
  automatedMove(from) {
    if (this.lastRoll && this.lastRoll.length) {
      const move = this.selectRandomMove(from);
      if (move) {
        return move;
      }
    }
  }

  // TODO move all these public type methods towards the top of file

  // TODO this shouldn't rely on automatedMove directly since automatedMove might eventually have heavy logic for "computer" player
  //  instead have an intermediate method that returns the possible moves to service both canMove and automatedMove
  canMove(from) {
    return !!this.automatedMove(from);
  }

  // decides who gets first turn
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
