export default class GameLogic {

  blankGame = {
    dark: {},
    light: {}
  };

  standardGame = {
    currentPlayer: 'light',
      dark: {
      4: 3,
        6: 5,
        12: 5,
        23: 2
    },
    light: {
      0: 5,
        11: 2,
        16: 3,
        18: 5
    }
  };

}