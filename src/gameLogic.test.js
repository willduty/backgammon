import GameLogic from './gameLogic';

describe('game setup', () => {
  let gameLogic;
  beforeEach(() => {
    gameLogic = new GameLogic;
  });

  test('currentPlayer is initially null', () => {
    expect(gameLogic.currentPlayer).toBe(null);
  });

  test('currentPlayer is null after start', () => {
    gameLogic.start();
    expect(gameLogic.currentPlayer).toBe(null);
  });

  test('currentPlayer is not null after decide', () => {
    gameLogic.start();
    gameLogic.decide();
    expect(gameLogic.currentPlayer).not.toBe(null);
  });

});
