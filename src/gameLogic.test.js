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

describe('move calculation and management', () => {
  let gl;

  beforeEach(() => {
    gl = new GameLogic;
    setDarkPlayerFirst(gl);
    gl.start();
    gl.decide();
  });

  describe('setPossibleMoves()', () => {
    test('sets up simple and compound moves', () => {
      gl.dark = { '0': 2 };
      gl.light = {};
      setPossibleMovesWithRoll(gl, [2, 3]);
      expect(gl.darkMoves).toEqual( {"0": [2, 3, [2, 5]]});
    });

    test('does not set up moves where opponent has 2 or more chips', () => {
      gl.dark = { '0': 2 };
      gl.light = { 3: 2 };
      setPossibleMovesWithRoll(gl, [2, 3]);
      expect(gl.darkMoves).toEqual( {"0": [2, [2, 5]]});
    });

    test('does not set up compound moves where opponent has 2 or more chips on compound target', () => {
      gl.dark = { '0': 2 };
      gl.light = { 5: 2 };
      setPossibleMovesWithRoll(gl, [2, 3]);
      expect(gl.darkMoves).toEqual( {"0": [2, 3]});
    });

    test('does not set up compound moves where opponent has 2 or more chips on intermediate target', () => {
      gl.dark = { '0': 2 };
      gl.light = { 2: 2, 3: 2 };
      setPossibleMovesWithRoll(gl, [2, 3]);
      expect(gl.darkMoves).toEqual( {});
    });

    test('does not set up compound moves where opponent has 2 or more chips on intermediate target, double roll', () => {
      gl.dark = { '0': 2 };
      gl.light = { 4: 2 };
      setPossibleMovesWithRoll(gl, [2, 2]);
      expect(gl.darkMoves).toEqual( {"0": [2]});
    });

    test('does not set up compound moves where opponent has 2 or more chips on intermediate target, double roll later', () => {
      gl.dark = { '0': 2 };
      gl.light = { 6: 2 };
      setPossibleMovesWithRoll(gl, [2, 2]);
      expect(gl.darkMoves).toEqual( {"0": [2, [2, 4]]});
    });

    test('does not set up compound moves where opponent has 2 or more chips on intermediate target, double roll later later', () => {
      gl.dark = { '0': 2 };
      gl.light = { 8: 2 };
      setPossibleMovesWithRoll(gl, [2, 2]);
      expect(gl.darkMoves).toEqual( {"0": [2, [2, 4], [2, 4, 6]]});
    });

    test('does not set up compound moves where opponent has 2 or more chips on intermediate target, double roll, from bar', () => {
      gl.dark = { '-1': 1 };
      gl.light = { 5: 2 };
      setPossibleMovesWithRoll(gl, [2, 2]);
      expect(gl.darkMoves).toEqual( {"-1": [1, [1, 3]]});
    });

    test('does not set up compound moves where opponent has 2 or more chips on compound target, light player', () => {
      gl.dark = {0: 2};
      gl.light = {5: 5};
      gl.nextTurn();
      setPossibleMovesWithRoll(gl, [4, 1]);
      expect(gl.lightMoves).toEqual( {5: [1, 4]});
    });

    test('allows compound moves when player has only 1 chip on bar', () => {
      gl.dark = { '-1': 1 };
      gl.light = { };
      setPossibleMovesWithRoll(gl, [2, 3]);
      expect(gl.darkMoves).toEqual( {"-1": [1, 2, [1, 4]]});
    });

    test('does not allow compound moves when player has 2 or more chips on bar', () => {
      gl.dark = { '-1': 2 };
      gl.light = { };
      setPossibleMovesWithRoll(gl, [2, 3]);
      expect(gl.darkMoves).toEqual( {"-1": [1, 2]});
    });
  });

  describe('currentPlayerMoves()', () => {
    test('gets moves', () => {
      gl.dark = { '0': 1 };
      gl.light = {};
      setPossibleMovesWithRoll(gl, [2, 3]);
      expect(gl.currentPlayerMoves()).toEqual( {"0": [2, 3, [2, 5]]});
    });

    test('gets moves by index', () => {
      gl.dark = { '0': 1, 6: 1 };
      gl.light = {};
      setPossibleMovesWithRoll(gl, [2, 3]);
      expect(gl.currentPlayerMoves(6)).toEqual([8, 9, [8, 11]]);
    });
  });

  describe('canMove()', () => {
    test('no index provided: returns true when at least some move possible', () => {
      gl.dark = { '0': 1 };
      gl.light = { 3: 2 };
      setPossibleMovesWithRoll(gl, [2, 3]);
      expect(gl.canMove()).toBeTruthy();
    });

    test('no index provided: returns false when no moves possible', () => {
      gl.dark = { '0': 1 };
      gl.light = { 2: 2, 3: 2 };
      setPossibleMovesWithRoll(gl, [2, 3]);
      expect(gl.canMove()).toBeFalsy();
    });

    test('index provided: returns true when moves possible from index', () => {
      gl.dark = { '0': 1, 5: 1};
      gl.light = { 2: 2, 3: 2 };
      setPossibleMovesWithRoll(gl, [2, 3]);
      expect(gl.canMove(5)).toBeTruthy();
    });

    test('index provided: returns false when no moves possible from index', () => {
      gl.dark = { '0': 1, 5: 1};
      gl.light = { 2: 2, 3: 2 };
      setPossibleMovesWithRoll(gl, [2, 3]);
      expect(gl.canMove(0)).toBeFalsy();
    });
  });

  describe('blotting', () => {
    test('knocks opponent onto bar', () => {
      gl.dark = { '0': 1 };
      gl.light = { 1: 1 };
      setPossibleMovesWithRoll(gl, [1, 2]);
      gl.doMove(0, 1);
      expect(gl.currentPlayerSpikes()).toEqual( {1: 1});
      expect(gl.opponentSpikes()).toEqual( {24: 1});
    });

    // TODO test light blotting dark also
  });

  describe('bar', () => {
    test('isBarIndex()', () => {
      expect(gl.isBarIndex(-1)).toBeTruthy();
      expect(gl.isBarIndex(24)).toBeTruthy();
      expect(gl.isBarIndex(5)).toBeFalsy();
    });

    test('playerHasBarMove() returns true if player has moves from bar', () => {
      gl.dark = { '-1': 1 };
      gl.light = { 24: 1 };
      setPossibleMovesWithRoll(gl, [1, 2]);
      expect(gl.currentPlayer).toEqual('dark')
      expect(gl.playerHasBarMove('dark')).toBeTruthy();
      gl.nextTurn();
      setPossibleMovesWithRoll(gl, [1, 2]);
      expect(gl.playerHasBarMove('light')).toBeTruthy();
    });

    test('playerHasBarMove() returns false if player is blocked from bar moves', () => {
      gl.dark = { '-1': 1, 18: 2, 19: 2, 20: 2, 21: 2, 22: 2, 23: 2 };
      gl.light = { 0: 2, 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 24: 1 };
      setPossibleMovesWithRoll(gl, [1, 2]);
      expect(gl.currentPlayer).toEqual('dark')
      expect(gl.playerHasBarMove('dark')).toBeFalsy();
      gl.nextTurn();
      setPossibleMovesWithRoll(gl, [1, 2]);
      expect(gl.playerHasBarMove('light')).toBeFalsy();
    });

  });
});

describe('offboarding and game conclusion', () => {
  let gl;

  beforeEach(() => {
    gl = new GameLogic;
    setDarkPlayerFirst(gl);
    gl.start();
    gl.decide();
  });

  test('canOffboard() returns false if current player does not have all chips in home board', () => {
    gl.dark = { 17: 1, 23: 14 };
    setPossibleMovesWithRoll(gl, [1, 2]);
    expect(gl.currentPlayer).toEqual('dark');
    expect(gl.canOffboard('dark')).toBeFalsy();
  });

  test('canOffboard() returns true if current player has all chips in home board', () => {
    gl.dark = { 18: 5, 23: 10 };
    setPossibleMovesWithRoll(gl, [1, 2]);
    expect(gl.currentPlayer).toEqual('dark');
    expect(gl.canOffboard('dark')).toBeTruthy();
  });

  test('doMove to an index beyond last board point moves chip to offboard holder', () => {
    gl.dark = { 18: 5, 23: 10 };
    setPossibleMovesWithRoll(gl, [6, 2]);
    expect(gl.darkOff).toEqual(0);
    gl.doMove(18, 'off');
    expect(gl.darkOff).toEqual(1);
  });

  test('doMove() to an index beyond last board point moves chip to offboard holder', () => {
    gl.dark = { 18: 5, 23: 10 };
    setPossibleMovesWithRoll(gl, [6, 2]);
    expect(gl.darkOff).toEqual(0);
    gl.doMove(18, 'off');
    expect(gl.darkOff).toEqual(1);
    expect(gl.dark).toEqual({ 18: 4, 23: 10 });
  });

  test('currentPlayerHasWon() returns true after last chip has been borne off', () => {
    gl.dark = { 18: 1 };
    gl.darkOff = 14;
    setPossibleMovesWithRoll(gl, [6, 2]);
    expect(gl.currentPlayerHasWon()).toBeFalsy();
    gl.doMove(18, 'off');
    expect(gl.currentPlayerHasWon()).toBeTruthy();
  });
});

function setPossibleMovesWithRoll(gl, roll) {
  let rollDiceMock = jest.fn();
  rollDiceMock.mockReturnValue(roll);
  gl.rollDice = rollDiceMock;
  gl.rollPlayerDice();
  gl.setPossibleMoves();
}

function setDarkPlayerFirst(gl) {
  let rollDecidingDiceMock = jest.fn();
  rollDecidingDiceMock.mockReturnValue([6, 3]);
  gl.rollDecidingDice = rollDecidingDiceMock;
}
