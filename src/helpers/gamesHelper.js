import Cookies from 'universal-cookie';

export const DEFAULT_TALLY = {light: 0, dark: 0, target: 2}

export const clearGame = () => {
  const cookies = new Cookies();
  cookies.set('backgammon', {
    current: null,
    tally: DEFAULT_TALLY,
  }, { path: '/' });
}

export const saveGame = (state, tally) => {
  const cookies = new Cookies();
  cookies.set('backgammon', {
    current: state,
    tally: tally || DEFAULT_TALLY,
  }, { path: '/' });
}

export const savedActiveGame = () => {
  const cookie = savedState();
  if (cookie) {
    const lastGame = cookie.current;
    if (lastGame && !lastGame.winner) {
      return lastGame;
    }
  }
}

export const savedTally = () => {
  const cookie = savedState();
  if (cookie) {
    return cookie.tally || DEFAULT_TALLY;
  } else {
    return DEFAULT_TALLY;
  }
}

export const savedState = () => {
  const cookies = new Cookies();
  var cookie = cookies.get('backgammon');
  return cookie;
}
