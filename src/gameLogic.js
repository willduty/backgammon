export default class GameLogic {

  BLANK_GAME = {
    currentPlayer: null,
    dark: {},
    light: {},
  };

  // standard initial game
  STANDARD_GAME = {
    currentPlayer: 'dark',
    dark: {0: 2, 11: 5, 16: 3, 18: 5},
    light: {5: 5, 7: 3, 12: 3, 23: 5},
    darkMoves: {},
    lightMoves: {},
    lastRoll: []
  };

  constructor(arg) {
    this.lastRoll = null;
    this.setGame(this.BLANK_GAME);
  }

  start = function() {
    this.setGame(this.STANDARD_GAME);
    while(true) {
      const roll = this.rollDecidingDice();
      if (roll[0] === roll[1]) {
        alert("It's a tie. Roll again...")
      } else {
        this.currentPlayer = roll[0] > roll[1] ? 'dark' : 'light';
        alert((this.currentPlayer === 'dark' ? 'player' : 'computer') + ' gets to start the game')
        break;
      }
    }
  }

  // basic roll for player's turn
  rollPlayerDice = function() {
    const lastRoll = this.rollDice();
    this.lastRoll = lastRoll;

    for(var sq in this.dark) {
      // Logic for which moves can be made from each occupied spike
      const curr = parseInt(sq),
        first = parseInt(lastRoll[0]),
        sec = parseInt(lastRoll[1]);
      this.darkMoves[sq] = [curr + first, curr + sec, curr + first + sec];
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
