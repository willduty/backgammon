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
    this.rollDecidingDice()
    alert((this.currentPlayer === 'dark' ? 'player' : 'computer') + ' gets to start the game')
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
    const roll = this.rollDice();
    this.currentPlayer = roll[0] > roll[1] ? 'dark' : 'light';
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
