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

describe('dice rolls, rollPlayerDice', () => {
  let gameLogic,
    rollDiceMock = jest.fn();

  beforeEach(() => {
    rollDiceMock.mockReturnValue([5, 5]);
    gameLogic = new GameLogic;
    gameLogic.rollDice = rollDiceMock;
    setDarkPlayerFirst(gameLogic);
    gameLogic.start();
    gameLogic.decide();
  });

  test('doubles dice on a double', () => {
    gameLogic.rollPlayerDice();
    expect(gameLogic.lastRoll).toEqual([5,5,5,5]);
  });

  test('doMove does one at a time', () => {
    gameLogic.rollPlayerDice();
    gameLogic.doMove(11, 16);
    expect(gameLogic.lastRoll).toEqual([5,5,5]);
    gameLogic.doMove(11, 16);
    expect(gameLogic.lastRoll).toEqual([5,5]);
    gameLogic.doMove(11, 16);
    expect(gameLogic.lastRoll).toEqual([5]);
    gameLogic.doMove(11, 16);
    expect(gameLogic.lastRoll).toEqual([]);
  });
});

function setDarkPlayerFirst(gameLogic) {
  let rollDecidingDiceMock = jest.fn();
  rollDecidingDiceMock.mockReturnValue([6, 3]);
  gameLogic.rollDecidingDice = rollDecidingDiceMock;
}
