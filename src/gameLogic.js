
import _ from 'lodash';

export default class GameLogic {

  BLANK_GAME = {
    currentPlayer: null,
    dark: {},
    light: {},
  };

  // standard initial game
  STANDARD_OPENING = {
    currentPlayer: null,
    dark: {0: 2, 11: 5, 16: 3, 18: 5},
    light: {5: 5, 7: 3, 12: 3, 23: 5},
    darkMoves: {},
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
    const roll = [5,4]; // TESTING forces dark player first
    if (roll[0] === roll[1]) {
      return roll;
    } else {
      this.currentPlayer = roll[0] > roll[1] ? 'dark' : 'light';
      return roll;
    }
  }

  // basic roll for player's turn
  rollPlayerDice = function() {
    let lastRoll = this.rollDice();
//    lastRoll = [6, 6]; // TESTING

    if (lastRoll[0] === lastRoll[1]) {
      lastRoll = [lastRoll[0], lastRoll[0], lastRoll[0], lastRoll[0]]
    }

    this.lastInitialRoll = lastRoll.slice();
    this.lastRoll = lastRoll.slice();
    this.setPossibleMoves();
  }

  setPossibleMoves = function() {

    for(var sq in this.dark) {

      // Logic for which moves can be made from each occupied spike
      const curr = parseInt(sq, 10),
        first = parseInt(this.lastRoll[0], 10),
        sec = parseInt(this.lastRoll[1], 10);

      let possibleMoves;

      if (first === sec) {
        possibleMoves = _.map(this.lastRoll, function(val, i) {
          return (curr + (val * (i + 1)));
        });

      } else {

        if(first && sec) {
          possibleMoves = [curr + first, curr + sec, curr + first + sec];
        } else {
          possibleMoves = [curr + first];
        }
      }

      // exclude moves occupied by opponent, and offboard unless player can bear-off.
      let allowedMoves = [];
      for(var i in possibleMoves) {
        const occ = this.light[possibleMoves[i]] || 0,
          isOffboard = possibleMoves[i] > 23 && !this.canOffboard();

        if (!isOffboard && (!occ || (occ < 2))) {
          allowedMoves.push(possibleMoves[i]);
        }
      }

      this.darkMoves[sq] = allowedMoves
    }
  }

  canOffboard = function () {
    return false; // TODO implement
  }

  attemptChange = function(change) {

    // TODO: implement move types (switch or ifs)
    // TODO: implement if move allowed
    // TODO: implement change in available dice & moves

    if (change.move) {
      this.dark[change.move.to] = this.dark[change.move.to] ? (this.dark[change.move.to] + 1) : 1;
      this.dark[change.move.from]--;

      const diff = change.move.to - change.move.from;
      this.lastRoll.splice(this.lastRoll.indexOf(diff), 1);
      this.setPossibleMoves();
    }

    // TODO: return true or false appropriately
    return true;
  }

  // decides who gets first move
  rollDecidingDice = function() {
    return this.rollDice();
  }

  // utility method
  rollDice = function() {
    return [Math.ceil(Math.random() * 6), Math.ceil(Math.random() * 6)];
  }

  setGame = function(setting) {
    for(var property in setting) {
      this[property] = setting[property]
    }
  }
}
