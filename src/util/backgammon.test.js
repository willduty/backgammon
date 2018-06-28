import Backgammon from './backgammon';

describe('game setup', () => {
  let bg;
  beforeEach(() => {
    bg = new Backgammon;
  });

  test('currentPlayer is initially null', () => {
    expect(bg.currentPlayer).toBe(null);
  });

  describe('start()', () => {
    test('currentPlayer is null after start', () => {
      bg.start();
      expect(bg.currentPlayer).toBe(null);
    });

    test('game is set to standard opening values after start', () => {
      bg.start();
      expect(bg.currentPlayer).toBe(null);
    });
  });

  test('currentPlayer is null after decide() if roll is a tie', () => {
    let rollDiceMock = jest.fn();
    rollDiceMock.mockReturnValue([5, 5]);
    bg.rollDice = rollDiceMock;
    bg.start();
    bg.decide();
    expect(bg.currentPlayer).toBe(null);
  });

  test('currentPlayer is set after decide() if roll is not a tie', () => {
    let rollDiceMock = jest.fn();
    rollDiceMock.mockReturnValue([1, 2]);
    bg.rollDice = rollDiceMock;
    bg.start();
    bg.decide();
    expect(bg.currentPlayer).not.toBe(null);
  });
});

describe('turns and dice rolls', () => {
  let bg, rollDiceMock = jest.fn();

  beforeEach(() => {
    rollDiceMock.mockReturnValue([5, 5]);
    bg = new Backgammon;
    bg.rollDice = rollDiceMock;
    setDarkPlayerFirst(bg);
    bg.start();
    bg.decide();
  });

  describe('rollPlayerDice()', () => {
    test('doubles dice on a double', () => {
      bg.rollPlayerDice();
      expect(bg.lastRoll).toEqual([5,5,5,5]);
    });
  });

  describe('doMove()', () => {
    test('doMove does one at a time', () => {
      bg.rollPlayerDice();
      bg.doMove(11, 16);
      expect(bg.lastRoll).toEqual([5,5,5]);
      bg.doMove(11, 16);
      expect(bg.lastRoll).toEqual([5,5]);
      bg.doMove(11, 16);
      expect(bg.lastRoll).toEqual([5]);
      bg.doMove(11, 16);
      expect(bg.lastRoll).toEqual([]);
    });
  });

  describe('nextTurn()', () => {
    test('currentPlayer switched to opponent on nextTurn', () => {
      bg.start();
      bg.decide();
      const before = bg.currentPlayer;
      const expected = (before === 'dark' ? 'light' : 'dark');

      bg.nextTurn();
      expect(bg.currentPlayer).toEqual(expected);
      expect(bg.opponent).toEqual(before);
    });
  });
});

describe('move calculation and management', () => {
  let bg;

  beforeEach(() => {
    bg = new Backgammon;
    setDarkPlayerFirst(bg);
    bg.start();
    bg.decide();
  });

  describe('setPossibleMoves()', () => {
    test('sets up simple and compound moves', () => {
      bg.dark = { '0': 2 };
      bg.light = {};
      setPossibleMovesWithRoll(bg, [2, 3]);
      expect(bg.darkMoves).toEqual({'0': [2, 3, [2, 5], [3, 5]]});
    });

    test('does not set up moves where opponent has 2 or more chips', () => {
      bg.dark = { '0': 2 };
      bg.light = { 3: 2 };
      setPossibleMovesWithRoll(bg, [2, 3]);
      expect(bg.darkMoves).toEqual({'0': [2, [2, 5]]});
    });

    test('does not set up compound moves where opponent has 2 or more chips on compound target', () => {
      bg.dark = { '0': 2 };
      bg.light = { 5: 2 };
      setPossibleMovesWithRoll(bg, [2, 3]);
      expect(bg.darkMoves).toEqual({'0': [2, 3]});
    });

    test('does not set up compound moves where opponent has 2 or more chips on both intermediate targets', () => {
      bg.dark = { '0': 2 };
      bg.light = { 2: 2, 3: 2 };
      setPossibleMovesWithRoll(bg, [2, 3]);
      expect(bg.darkMoves).toEqual({});
    });

    test('on double roll, does not set up compound moves where opponent has 2 or more chips on intermediate target', () => {
      bg.dark = { '0': 2 };
      bg.light = { 4: 2 };
      setPossibleMovesWithRoll(bg, [2, 2]);
      expect(bg.darkMoves).toEqual({'0': [2]});
    });

    test('on double roll, sets up compound moves only to where opponent has 2 or more chips on an intermediate target', () => {
      bg.dark = { '0': 2 };
      bg.light = { 6: 2 };
      setPossibleMovesWithRoll(bg, [2, 2]);
      expect(bg.darkMoves).toEqual({'0': [2, [2, 4]]});
    });

    test('on double roll, sets up compound moves only to where opponent has 2 or more chips on an intermediate target', () => {
      bg.dark = { '0': 2 };
      bg.light = { 8: 2 };
      setPossibleMovesWithRoll(bg, [2, 2]);
      expect(bg.darkMoves).toEqual({'0': [2, [2, 4], [2, 4, 6]]});
    });

    test('on double roll, does not set up compound moves where opponent has 2 or more chips on intermediate target, from bar', () => {
      bg.dark = { '-1': 1 };
      bg.light = { 5: 2 };
      setPossibleMovesWithRoll(bg, [2, 2]);
      expect(bg.darkMoves).toEqual({'-1': [1, [1, 3]]});
    });

    test('does not set up compound moves where opponent has 2 or more chips on compound target, light player', () => {
      bg.dark = {0: 2};
      bg.light = {5: 5};
      bg.nextTurn();
      setPossibleMovesWithRoll(bg, [4, 1]);
      expect(bg.lightMoves).toEqual({5: [1, 4]});
    });

    test('allows compound moves when player has only 1 chip on bar', () => {
      bg.dark = { '-1': 1 };
      bg.light = { };
      setPossibleMovesWithRoll(bg, [2, 3]);
      expect(bg.darkMoves).toEqual({'-1': [1, 2, [1, 4], [2, 4]]});
    });

    test('does not allow compound moves when player has 2 or more chips on bar', () => {
      bg.dark = { '-1': 2 };
      bg.light = { };
      setPossibleMovesWithRoll(bg, [2, 3]);
      expect(bg.darkMoves).toEqual({'-1': [1, 2]});
    });

    test('sets up move combinations for offboarding, two chips can offboard', () => {
      bg.dark = { 20: 1, 22: 1 };
      bg.darkOff = 13;
      setPossibleMovesWithRoll(bg, [4, 2]);
      expect(bg.currentPlayerMoves()).toEqual({'20': ['off', 22, [22, 'off']], '22': ['off']});
    });

    test('sets up move combinations for offboarding, only one chip can offboard', () => {
      bg.dark = { 19: 1, 23: 1 };
      bg.darkOff = 13;
      bg.light = { 5: 15 }
      setPossibleMovesWithRoll(bg, [3, 1]);
      expect(bg.currentPlayerMoves()).toEqual({'19': [22, 20, [22, 23], [20, 23]], '23': ['off']});
    });

    test('in double roll, player blocked from compound offboard move', () => {
      bg.dark = { 22: 1 };
      bg.light = { 23: 2 };
      bg.darkOff = 14;
      setPossibleMovesWithRoll(bg, [1, 1]);
      expect(bg.canMove()).toBeFalsy();
    });

    test('player blocked from compound offboard move', () => {
      bg.dark = { 21: 1 };
      bg.light = { 22: 2, 23: 2 };
      bg.darkOff = 14;
      setPossibleMovesWithRoll(bg, [1, 2]);
      expect(bg.canMove()).toBeFalsy();
    });

    test('light player blocked from compound offboard move', () => {
      bg.dark = {0: 2, 1: 2, 2: 2, 3: 2, 4: 2 };
      bg.light = {5: 1};
      bg.nextTurn();
      expect(bg.currentPlayer).toBe('light');
      setPossibleMovesWithRoll(bg, [5, 1]);
      expect(bg.canMove()).toBeFalsy();
    });

    test('in double roll, light player blocked from compound offboard move', () => {
      bg.dark = {0: 2, 1: 2, 2: 2, 3: 2, 4: 2 };
      bg.light = {5: 1};
      bg.nextTurn();
      setPossibleMovesWithRoll(bg, [2, 2]);
      expect(bg.canMove()).toBeFalsy();
    });
  });

  describe('currentPlayerMoves()', () => {
    test('gets moves', () => {
      bg.dark = { '0': 1 };
      bg.light = {};
      setPossibleMovesWithRoll(bg, [2, 3]);
      expect(bg.currentPlayerMoves()).toEqual({'0': [2, 3, [2, 5], [3, 5]]});
    });

    test('gets moves by index', () => {
      bg.dark = { '0': 1, 6: 1 };
      bg.light = {};
      setPossibleMovesWithRoll(bg, [2, 3]);
      expect(bg.currentPlayerMoves(6)).toEqual([8, 9, [8, 11], [9, 11]]);
    });
  });

  describe('canMove()', () => {
    test('no index provided: returns true when at least some move possible', () => {
      bg.dark = { '0': 1 };
      bg.light = { 3: 2 };
      setPossibleMovesWithRoll(bg, [2, 3]);
      expect(bg.canMove()).toBeTruthy();
    });

    test('no index provided: returns false when no moves possible', () => {
      bg.dark = { '0': 1 };
      bg.light = { 2: 2, 3: 2 };
      setPossibleMovesWithRoll(bg, [2, 3]);
      expect(bg.canMove()).toBeFalsy();
    });

    test('index provided: returns true when moves possible from index', () => {
      bg.dark = { '0': 1, 5: 1};
      bg.light = { 2: 2, 3: 2 };
      setPossibleMovesWithRoll(bg, [2, 3]);
      expect(bg.canMove(5)).toBeTruthy();
    });

    test('index provided: returns false when no moves possible from index', () => {
      bg.dark = { '0': 1, 5: 1};
      bg.light = { 2: 2, 3: 2 };
      setPossibleMovesWithRoll(bg, [2, 3]);
      expect(bg.canMove(0)).toBeFalsy();
    });

    test('returns true when one but not the other compound path is both blocked', () => {
      bg.dark = { '0': 1 };
      bg.light = {  2: 2 };
      setPossibleMovesWithRoll(bg, [1, 2]);
      expect(bg.canMove(0)).toBeTruthy();
    });

    test('returns false when both compound paths are blocked', () => {
      bg.dark = { '0': 1 };
      bg.light = { 1: 2, 2: 2 };
      setPossibleMovesWithRoll(bg, [1, 2]);
      expect(bg.canMove(0)).toBeFalsy();
    });
  });

  describe('blotting', () => {
    test('knocks opponent onto bar', () => {
      bg.dark = { '0': 1 };
      bg.light = { 1: 1 };
      setPossibleMovesWithRoll(bg, [1, 2]);
      bg.doMove(0, 1);
      expect(bg.currentPlayerSpikes()).toEqual({ 1: 1 });
      expect(bg.opponentSpikes()).toEqual({ 24: 1 }); // 24 is bar
    });

    test('knocks opponent onto bar with intermediate point of a compound move', () => {
      bg.dark = { '0': 1 };
      bg.light = { 1: 1 };
      setPossibleMovesWithRoll(bg, [1, 2]);
      bg.doMove(0, 3);
      expect(bg.currentPlayerSpikes()).toEqual({ 3: 1 });
      expect(bg.opponentSpikes()).toEqual({ 24: 1 });
    });

    test('double roll, knocks opponent onto bar with intermediate point of multiple compound move', () => {
      bg.dark = { '0': 1 };
      bg.light = { 1: 1, 2: 1 };
      setPossibleMovesWithRoll(bg, [1, 1]);
      bg.doMove(0, 4);
      expect(bg.currentPlayerSpikes()).toEqual({ 4: 1 });
      expect(bg.opponentSpikes()).toEqual({ 24: 2 });
    });

    test('double roll, knocks opponent onto bar with final point of multiple compound move', () => {
      bg.dark = { 8: 1 },
      bg.light = { 18: 1 },
      setPossibleMovesWithRoll(bg, [5, 5]);
      bg.doMove(8, 18);
      expect(bg.currentPlayerSpikes()).toEqual({ 18: 1 });
      expect(bg.opponentSpikes()).toEqual({ 24: 1 });
    });

    // TODO test light blotting dark also
  });

  describe('bar', () => {
    test('isBarIndex()', () => {
      expect(bg.isBarIndex(-1)).toBeTruthy();
      expect(bg.isBarIndex(24)).toBeTruthy();
      expect(bg.isBarIndex(5)).toBeFalsy();
    });

    test('playerHasBarMove() returns true if player has moves from bar', () => {
      bg.dark = { '-1': 1 };
      bg.light = { 24: 1 };
      setPossibleMovesWithRoll(bg, [1, 2]);
      expect(bg.currentPlayer).toEqual('dark')
      expect(bg.playerHasBarMove('dark')).toBeTruthy();
      bg.nextTurn();
      setPossibleMovesWithRoll(bg, [1, 2]);
      expect(bg.playerHasBarMove('light')).toBeTruthy();
    });

    test('playerHasBarMove() returns false if player has chips on bar but moves expended', () => {
      bg.dark = { '-1': 3 };
      bg.light = { 24: 1 };
      setPossibleMovesWithRoll(bg, [1, 2]);
      expect(bg.currentPlayer).toEqual('dark')
      expect(bg.playerHasBarMove('dark')).toBeTruthy();
      bg.doMove(-1, 1);
      bg.doMove(-1, 0);
      expect(bg.playerHasBarMove('dark')).toBeFalsy();
    });

    test('playerHasBarMove() returns false if player is blocked from bar moves', () => {
      bg.dark = { '-1': 1, 18: 2, 19: 2, 20: 2, 21: 2, 22: 2, 23: 2 };
      bg.light = { 0: 2, 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 24: 1 };
      setPossibleMovesWithRoll(bg, [1, 2]);
      expect(bg.currentPlayer).toEqual('dark')
      expect(bg.playerHasBarMove('dark')).toBeFalsy();
      bg.nextTurn();
      setPossibleMovesWithRoll(bg, [1, 2]);
      expect(bg.playerHasBarMove('light')).toBeFalsy();
    });

  });
});

describe('offboarding and game conclusion', () => {
  let bg;

  beforeEach(() => {
    bg = new Backgammon;
    setDarkPlayerFirst(bg);
    bg.start();
    bg.decide();
  });

  test('canOffboard() returns false if current player does not have all chips in home board', () => {
    bg.dark = { 17: 1, 23: 14 };
    setPossibleMovesWithRoll(bg, [1, 2]);
    expect(bg.currentPlayer).toEqual('dark');
    expect(bg.canOffboard('dark')).toBeFalsy();
  });

  test('canOffboard() returns true if current player has all chips in home board', () => {
    bg.dark = { 18: 5, 23: 10 };
    setPossibleMovesWithRoll(bg, [1, 2]);
    expect(bg.currentPlayer).toEqual('dark');
    expect(bg.canOffboard('dark')).toBeTruthy();
  });

  test('doMove to an index beyond last board point moves chip to offboard holder', () => {
    bg.dark = { 18: 5, 23: 10 };
    setPossibleMovesWithRoll(bg, [6, 2]);
    expect(bg.darkOff).toEqual(0);
    bg.doMove(18, 'off');
    expect(bg.darkOff).toEqual(1);
  });

  test('doMove() to an index beyond last board point moves chip to offboard holder', () => {
    bg.dark = { 18: 5, 23: 10 };
    setPossibleMovesWithRoll(bg, [6, 2]);
    expect(bg.darkOff).toEqual(0);
    bg.doMove(18, 'off');
    expect(bg.darkOff).toEqual(1);
    expect(bg.dark).toEqual({ 18: 4, 23: 10 });
  });

  test('currentPlayerHasWon() returns true after last chip has been borne off', () => {
    bg.dark = { 18: 1 };
    bg.darkOff = 14;
    setPossibleMovesWithRoll(bg, [6, 2]);
    expect(bg.currentPlayerHasWon()).toBeFalsy();
    bg.doMove(18, 'off');
    expect(bg.currentPlayerHasWon()).toBeTruthy();
  });

  test('uses a die minimally required if not all dies are sufficient for move', () => {
    bg.dark = { 20: 1, 22: 1 };
    bg.darkOff = 13;
    setPossibleMovesWithRoll(bg, [4, 2]);
    const move = bg.doMove(20, 'off');
    expect(bg.lastRoll).toEqual([2]);
  });

  // TODO: is this rule-conformant?
  test('choose the least expensive available die if more than one possible die can offboard a chip', () => {
    bg.dark = { 20: 1, 22: 1 };
    bg.darkOff = 13;
    setPossibleMovesWithRoll(bg, [4, 2]);
    const move = bg.doMove(22, 'off');
    expect(bg.lastRoll).toEqual([4]);
  });

  test('in double roll, uses all dies required for offboard, none left', () => {
    bg.dark = { 20: 1 };
    bg.light = { };
    bg.darkOff = 14;
    setPossibleMovesWithRoll(bg, [1, 1]);
    const move = bg.doMove(20, 'off');
    expect(bg.lastRoll).toEqual([]);
    expect(bg.dark).toEqual({ });
    expect(bg.darkOff).toEqual(15);
  });

  test('in double roll, uses all dies required for offboard, some left', () => {
    bg.dark = { 21: 1 };
    bg.light = { };
    bg.darkOff = 14;
    setPossibleMovesWithRoll(bg, [1, 1]);
    const move = bg.doMove(21, 'off');
    expect(bg.lastRoll).toEqual([1]);
    expect(bg.dark).toEqual({ });
    expect(bg.darkOff).toEqual(15);
  });

  test('in double roll, uses all dies required for offboard, some left', () => {
    bg.dark = { 20: 1 };
    bg.darkOff = 14;
    setPossibleMovesWithRoll(bg, [4, 4]);
    const move = bg.doMove(20, 'off');
    expect(bg.lastRoll).toEqual([4, 4, 4]);
  });

  test('in double roll, blots opponent', () => {
    bg.light = { 22: 1 };
    bg.dark = { 21: 1 };
    bg.darkOff = 14;
    setPossibleMovesWithRoll(bg, [1, 1]);
    const move = bg.doMove(21, 'off');
    expect(bg.lastRoll).toEqual([1]);
    expect(bg.dark).toEqual({ });
    expect(bg.light).toEqual({ 24: 1 });
    expect(bg.darkOff).toEqual(15);
  });
});


describe('pips', () => {
  let bg;

  beforeEach(() => {
    bg = new Backgammon;
    setDarkPlayerFirst(bg);
    bg.start();
    bg.decide();
  });

  test('pips are initially 167', () => {
    expect(bg.pips('dark')).toEqual(167);
    expect(bg.pips('light')).toEqual(167);
  });

  test('pips change accordinbgy with moves', () => {
    setPossibleMovesWithRoll(bg, [2, 1]);
    bg.doMove(0, 2);
    expect(bg.pips('dark')).toEqual(165);
    bg.nextTurn();
    setPossibleMovesWithRoll(bg, [2, 1]);
    bg.doMove(23, 20);
    expect(bg.pips('light')).toEqual(164);
  });
});

describe('history', () => {
  let bg;

  beforeEach(() => {
    bg = new Backgammon;
    setDarkPlayerFirst(bg);
    bg.start();
    bg.decide();
  });

  describe('undo()', () => {
    test('history can be restored', () => {
      setPossibleMovesWithRoll(bg, [2, 1]);
      const snapshot1 = bg.currentHistoryState();
      bg.doMove(0, 2);
      const snapshot2 = bg.currentHistoryState();
      bg.undo();
      const snapshot3 = bg.currentHistoryState();
      expect(snapshot1).toEqual(snapshot3);
      expect(snapshot1).not.toEqual(snapshot2);
    });
  });
  // TODO: need some more tests around history
});


describe('game activity', () => {
  let bg;

  beforeEach(() => {
    bg = new Backgammon;
  });

  describe('gameActive()', () => {
    test('returns false before game has been started', () => {
      expect(bg.gameActive()).toEqual(false);
    });

    test('returns true after game has started but not ended', () => {
      bg.start();
      expect(bg.gameActive()).toEqual(true);
    });

    test('returns false after game has ended', () => {
      bg.start();
      setDarkPlayerFirst(bg);
      bg.decide();
      bg.dark = { 18: 1 };
      bg.darkOff = 14;
      setPossibleMovesWithRoll(bg, [6, 2]);
      bg.doMove(18, 'off');
      expect(bg.gameActive()).toEqual(false);
    });
  });
});


function setPossibleMovesWithRoll(bg, roll) {
  let rollDiceMock = jest.fn();
  rollDiceMock.mockReturnValue(roll.slice());
  bg.rollDice = rollDiceMock;
  bg.rollPlayerDice();
  bg.setPossibleMoves();
}

function setDarkPlayerFirst(bg) {
  let rollDecidingDiceMock = jest.fn();
  rollDecidingDiceMock.mockReturnValue([6, 3]);
  bg.rollDecidingDice = rollDecidingDiceMock;
}
