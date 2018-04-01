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
      dark: {0: 2, 11: 5, 16: 3, 18: 5}, // chip counts for dark player's points. if nothing on point, key is removed.
      light: {5: 5, 7: 3, 12: 5, 23: 2}, // same as above for light player
      darkMoves: {}, // key indices for active board points. 0 thru 23 are board point. key '-1' is dark bar.
      lightMoves: {}, // same for light player. 24 is light bar.
      darkOff: 0, // count of offboarded chips
      lightOff: 0,
      lastRoll: [], // current state of dice in a turn: changes as the player uses up dice, or undoes moves.
      lastInitialRoll: [], // original state of dice in a turn. does not change until new turn.
    };

    this.GAME_PROPS = Object.keys(this.STANDARD_OPENING);
    this.history = [];

    this.gameOn = false;
    this.lastRoll = null;
    this.setGame(this.BLANK_GAME);
  }

  // Sets board with standard chips in place.
  // Does not set currentPlayer... call decide() to set who starts.
  start() {
    this.gameOn = true;
    this.setGame(this.STANDARD_OPENING);
    this.snapHistory();
  }

  // undo game to previous history state. (before latest move)
  undo() {
    this.history.pop();
    const last = _.last(this.history);
    const _this = this;
    _.each(last, function(value, key) {
      _this[key] = JSON.parse(JSON.stringify(value));
    });
  }

  // pip count
  pips(player) {
    let count = 0;
    const spikes = this[player];
    for(var i in spikes) {
      count += (this.int(spikes[i]) * Math.abs(((player == 'dark' ? 24 : -1) - this.int(i))));
    }
    return count;
  }

  // Rolls dice to start the first turn.
  //  - if dice are different, sets who starts the game. ie, sets this.currentPlayer and this.opponent
  //  - returns roll value so gui can display.
  //  - does NOT start the turn, which happens on rollPlayerDice().
  decide() {
    let roll = this.rollDecidingDice();
    if (roll[0] !== roll[1]) {
      this.currentPlayer = (roll[0] > roll[1]) ? 'dark' : 'light';
      this.opponent = (this.currentPlayer === 'dark') ? 'light' : 'dark';
    }
    return roll;
  }

  // Roll for current player's turn.
  // Sets lastRoll, lastInitialRoll, and the player's possible moves.
  // Once this is called, the player can begin moving pieces, or automated moves can be performed.
  rollPlayerDice() {
    let lastRoll = this.rollDice();

    if (lastRoll[0] === lastRoll[1]) {
      lastRoll = [lastRoll[0], lastRoll[0], lastRoll[0], lastRoll[0]];
    }

    this.lastInitialRoll = lastRoll.slice();
    this.lastRoll = lastRoll.slice();
    this.setPossibleMoves();
  }

  // Switches the opponent to be the current player and vice versa.
  // must be called externally when the gui is ready to proceed
  nextTurn() {
    const current = this.currentPlayer;
    this.currentPlayer = this.opponent;
    this.opponent = current;
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

  // returns true if the current player has any possible moves.
  // TODO this shouldn't rely on automatedMove directly since automatedMove might eventually have heavy logic for "computer" player
  //  instead have an intermediate method that returns the possible moves to service both canMove and automatedMove
  canMove(from) {
    return !!this.automatedMove(from);
  }

  // returns count of chips for a given player at a point on the board.
  // player: 'dark' or 'light', index: point index
  chipsAt(player, index) {
    const curr = this[player];
    return curr[index] || 0;
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
        return Array.isArray(item) ? _.last(item) : item;
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

  gameActive() {
    return this.gameOn;
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
  // return a summary of the move and what points, if any, where a blot occurred.
  doMove(from, to) {
    const possibleMoves = this.currentPlayerMoves(from),
      _this = this;

    // TODO: this should return an array if 2 different compound moves are possible
    // then, if either compound move involves an intermediate blot, return a Clarify object as to which is intended.
    const target = _.find(possibleMoves, function (item) {
      const target = Array.isArray(item) ? _.last(item) : item;
      return target === to;
    });

    // Figure out which dice and knock down current roll (this.lastRoll)
    if (Array.isArray(target)) {
      const finalTarget = _.last(target);
      if (finalTarget === 'off') {

        let subMoves = [[from, target[0]]];
        for(var n = 0; n < target.length - 1; n++) {
          const last = target[n + 1],
            to = last === 'off' ? (this.currentPlayer === 'dark' ? 24 : -1) : last;
          const item = to - target[n]
          subMoves.push([target[n], to]);
        }

        _.each(subMoves, function(move) {
          const item = move[1] - move[0];
          const dieIndex = _this.lastRoll.indexOf(item);
          _this.lastRoll.splice(dieIndex, 1);
        });

      } else {

        if (this.lastInitialRoll.length === 2) {
          this.lastRoll = [];
        } else {
          for(var i in target) {
            // TODO: use slice here instead?
            this.lastRoll.pop();
          }
        }
      }
    } else if (typeof target !== 'undefined') {
      let diff = Math.abs(to - from);
      if (target === 'off') {
        // find first die value large enough to get off board
        const requiredDie = Math.abs((to === 'off' ? 24 : to) - from);
        diff = _.find(_.sortBy(this.lastRoll), function(die) {
          return requiredDie <= die;
        });
      }

      const dieIndex = this.lastRoll.indexOf(diff);
      this.lastRoll.splice(dieIndex, 1);
    };

    // now adjust the spikes
    let spikes = this.currentPlayerSpikes();

    if (typeof target !== 'undefined') {
      let blots = [];
      if (Array.isArray(target)) {
        const _this = this;
        _.each(target, function(i){
          if(_this.opponentSpikes()[i] === 1) {
            blots.push(i);
          }
        })
      } else if (this.opponentSpikes()[to] === 1) {
        blots.push(to);
      }

      // if one or more blots occurred during move
      if (blots.length) {
        const _this = this;
        _.each(blots, function(to) {
          _this.decrementOpponentAt(to);
          const opponentBarIndex = _this.opponent === 'dark' ? '-1' : 24;
          const curr = _this.opponentSpikes()[opponentBarIndex];
          _this.opponentSpikes()[opponentBarIndex] = curr ? curr + 1 : 1;
        })
      }

      // increase decrease chip counts..
      if (target === 'off' || to === 'off') {
        this[this.currentPlayer + 'Off']++;
      } else {
        spikes[to] = spikes[to] ? (spikes[to] + 1) : 1;
      }

      this.decrementCurrentPlayerAt(from);

      this.setPossibleMoves();
      if (this.currentPlayerHasWon()) {
        this.endGame();
      }
      return {move: [from, target], blots: blots};
    } else {
      return false;
    }
  }

  // private

  decrementCurrentPlayerAt(index) {
    this.currentPlayerSpikes()[index]--;
    this.currentPlayerSpikes()[index] === 0 && (delete this.currentPlayerSpikes()[index]);
  }

  decrementOpponentAt(index) {
    this.opponentSpikes()[index]--;
    this.opponentSpikes()[index] === 0 && (delete this.opponentSpikes()[index]);
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
    // movablePieceContainers is a hash of form {boardPosition => chipCount, ...}
    const movablePieceContainers = barHash || this.currentPlayerSpikes();

    // Logic for which moves can be made from each occupied spike of position `index`.
    for(var index in movablePieceContainers) {
      const curr = this.int(index);
      const light = (this.currentPlayer === 'light');
      let first = this.int(this.lastRoll[0]),
        sec = this.int(this.lastRoll[1]);

      // opponent goes backwards
      if (light) {
        first = -first;
        sec = - sec;
      }

      // Find all possible moves, as if there was no opponent.
      let possibleMoves;
      if (first) {
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
          if(sec) {
            possibleMoves = [
              curr + first,
              curr + sec,
              [curr + first, curr + first + sec],
              [curr + sec, curr + sec + first]
            ];
          } else {
            possibleMoves = [curr + first];
          }
        }

        // trim moves that go offboard..
        // a move like [20, 22] remains unchanged
        // a move like 26 becomes 'off'
        // a move like [22, 24] becomes [22, 'off']
        // a move like [22, 24, 26] becomes [22, 24, 'off']
        _.each(possibleMoves, function(move, i) {
          if (Array.isArray(move)) {
            // trim out excess
            const firstOffboardIndex = _.findIndex(move, function(val){
              return val > 23 || val < 0;
            });
            if (firstOffboardIndex !== -1) {
              move = move.slice().splice(0, firstOffboardIndex + 1);
              move[move.length - 1] = 'off';
              possibleMoves[i] = move.length === 1 ? 'off' : move;
            }
          } else if (move > 23 || move < 0) {
            possibleMoves[i] = 'off'
          }
        })

        possibleMoves = _.uniq(possibleMoves);
      } else {
        possibleMoves = [];
      }

      // TODO:
      // implement rule: Or if either number can be played but not both, the player must play the larger one.

      // Now, exclude targets occupied by opponent (2 or more chips) and all offboard moves unless player can bear-off.
      let allowedMoves = [];
      for(var i in possibleMoves) {
        let moveTarget = possibleMoves[i];
        let compound;

        if (Array.isArray(moveTarget)) {
          compound = true;
          moveTarget = _.last(moveTarget);
        }

        let taken = this.opponentSpikes()[moveTarget] || 0;
        if (compound) {
          const opponentSpikes = this.opponentSpikes();
          const point = _.find(possibleMoves[i], function(point) {
            return opponentSpikes[Array.isArray(point) ? _.last(point) : point] > 1;
          });
          if (point) {
            taken = opponentSpikes[Array.isArray(point) ? _.last(point) : point]
          }
        }

        if (barHash && (barHash[-1] > 1 || barHash[24] > 1) && compound) {
          // do nothing
        } else if ((moveTarget === 'off')) {
          this.canOffboard() && allowedMoves.push(possibleMoves[i]);
        } else if (!taken || (taken < 2)) {
          allowedMoves.push(possibleMoves[i]);
        }
      }

      if (allowedMoves.length) {
        this[this.currentPlayer + 'Moves'][index] = allowedMoves;
      }
    }
    this.snapHistory();
  }

  selectRandomMove(index) {
    const possibleMoves = this.currentPlayerMoves();
    let movablePieceKeys  = Object.keys(this.currentPlayerMoves());

    // TODO shouldn't really need this. setPossibleMoves shouldn't populate key if there's no moves
    if (!movablePieceKeys || !_.find(movablePieceKeys, function(i) { return possibleMoves[i] }) ) {
      return;
    }

    const whichKey = (typeof arguments[0] !== 'undefined' ) ? index : _.sample(movablePieceKeys);
    if (!possibleMoves[whichKey]) {
      return;
    }
    const move = _.sample(possibleMoves[whichKey]),
      to = Array.isArray(move) ? _.last(move) : move;
    return [this.int(whichKey), to];
  }

  rollDecidingDice() {
    return this.rollDice().slice();
  }

  currentHistoryState() {
    let hist = {};
    const _this = this;
    _.each(this.GAME_PROPS, function(prop) {
      hist[prop] = JSON.parse(JSON.stringify(_this[prop]));
    });
    return hist;
  }

  snapHistory() {
    this.history.push(this.currentHistoryState());
  }

  int(n) {
    return parseInt(n, 10);
  }

  rollDice() {
    return [Math.ceil(Math.random() * 6), Math.ceil(Math.random() * 6)];
  }

  setGame(setting) {
    const obj = JSON.parse(JSON.stringify(setting));
    for(var property in obj) {
      this[property] = obj[property]
    }
  }

  endGame() {
    this.gameOn = false;
  }
}
