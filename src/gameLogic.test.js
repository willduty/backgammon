import GameLogic from './gameLogic';

describe('game setup', () => {
  let gl;
  beforeEach(() => {
    gl = new GameLogic;
  });

  test('currentPlayer is initially null', () => {
    expect(gl.currentPlayer).toBe(null);
  });

  describe('start()', () => {
    test('currentPlayer is null after start', () => {
      gl.start();
      expect(gl.currentPlayer).toBe(null);
    });

    test('game is set to standard opening values after start', () => {
      gl.start();
      expect(gl.currentPlayer).toBe(null);
    });
  });

  test('currentPlayer is not null after decide', () => {
    gl.start();
    gl.decide();
    expect(gl.currentPlayer).not.toBe(null);
  });

  test('currentPlayer switched to opponent on nextTurn', () => {
    gl.start();
    gl.decide();
    const before = gl.currentPlayer;
    const expected = (before === 'dark' ? 'light' : 'dark');

    gl.nextTurn();
    expect(gl.currentPlayer).toEqual(expected);
    expect(gl.opponent).toEqual(before);
  });
});

describe('turns and dice rolls', () => {
  let gl, rollDiceMock = jest.fn();

  beforeEach(() => {
    rollDiceMock.mockReturnValue([5, 5]);
    gl = new GameLogic;
    gl.rollDice = rollDiceMock;
    setDarkPlayerFirst(gl);
    gl.start();
    gl.decide();
  });

  describe('rollPlayerDice()', () => {
    test('doubles dice on a double', () => {
      gl.rollPlayerDice();
      expect(gl.lastRoll).toEqual([5,5,5,5]);
    });
  });

  describe('doMove()', () => {
    test('doMove does one at a time', () => {
      gl.rollPlayerDice();
      gl.doMove(11, 16);
      expect(gl.lastRoll).toEqual([5,5,5]);
      gl.doMove(11, 16);
      expect(gl.lastRoll).toEqual([5,5]);
      gl.doMove(11, 16);
      expect(gl.lastRoll).toEqual([5]);
      gl.doMove(11, 16);
      expect(gl.lastRoll).toEqual([]);
    });
  });
});

function setDarkPlayerFirst(gl) {
  let rollDecidingDiceMock = jest.fn();
  rollDecidingDiceMock.mockReturnValue([6, 3]);
  gl.rollDecidingDice = rollDecidingDiceMock;
}
