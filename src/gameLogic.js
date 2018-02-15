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
    lastRoll: []
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
    const roll = this.rollDecidingDice();
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

    if (lastRoll[0] === lastRoll[1]) {
      lastRoll = [lastRoll[0], lastRoll[0], lastRoll[0], lastRoll[0]]
    }

    this.lastRoll = lastRoll;

    for(var sq in this.dark) {
      // Logic for which moves can be made from each occupied spike
      const curr = parseInt(sq, 10),
        first = parseInt(lastRoll[0], 10),
        sec = parseInt(lastRoll[1], 10);
      if (first === sec) {
        this.darkMoves[sq] = [curr + first, curr + first*2, curr + first*3, curr + first*4];
      } else {
        this.darkMoves[sq] = [curr + first, curr + sec, curr + first + sec];
      }
    }
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
