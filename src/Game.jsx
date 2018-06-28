import React from 'react';
import Board from './Board';
import Backgammon from './util/backgammon.js';
import { clearGame, saveGame, savedActiveGame, savedTally, seriesInProgress } from './util/gamesHelper.js'
import ChipAnimation from './util/animation.js'
import { TIMEOUT, SHORT_TIMEOUT, LONG_TIMEOUT } from './util/constants.js'

export default class Game extends React.Component {
  constructor(props) {
    super(props);
    this.startNew = this.startNew.bind(this);
    this.playerRoll = this.playerRoll.bind(this);
    this.hideDice = this.hideDice.bind(this);
    this.doDecidingRoll = this.doDecidingRoll.bind(this);
    this.updateGame = this.updateGame.bind(this);
    this.turnComplete = this.turnComplete.bind(this);
    this.completeGame = this.completeGame.bind(this);
    this.doAutomatedMove = this.doAutomatedMove.bind(this);
    this.animatePlayerClick = this.animatePlayerClick.bind(this);
    this.showGameOptions = this.showGameOptions.bind(this);
    this.undoLastMove = this.undoLastMove.bind(this);
    this.afterAnimation = this.afterAnimation.bind(this);
    this.ifNoAnimation = this.ifNoAnimation.bind(this);
    this.handleAnimationFinish = this.handleAnimationFinish.bind(this);
    this.handleUnload = this.handleUnload.bind(this);
    this.animationInProgress = false;

    // TODO should probably do this in startNew()
    let backgammon = new Backgammon();

    this.state = {
      game: backgammon,
      tie: false,
      startButton: true,
      resumeButton: !!savedActiveGame(),
      nextGameButton: !savedActiveGame() && seriesInProgress(),
      rolling: false,
    }
  }

  coverText() {
    let text;
    const game = this.state.game;
    const player = this.currentPlayerDark() ? ' Player ' : ' Computer ';

    if (this.state.winner) {
      text = player + ' has won the game!';
    } else if (this.state.noMoves) {
      text = player + ' has no moves..';
    } else if (this.state.rolling) {
      const decidingRoll = this.state.showDecision;
      text = (decidingRoll) ?
        (decidingRoll[0] + ', ' + decidingRoll[1] + player + 'starts...') :
        player + 'Rolling...';
      if (game.gameActive() && !game.currentPlayer) {
        text = this.state.tie ?
          (this.state.showDecision ? 'OOPS! Tie!' : ' Rolling again') :
          'Opening roll...';
      }
    }
    return text;
  }

  currentPlayerDark() {
    return this.state.game && this.state.game.currentPlayer === 'dark';
  }

  startNew(resume) {
    const game = this.state.game, _this = this;
    let lastGame;

    game.start();

    if (resume && (lastGame = savedActiveGame())) {
      game.setGame(lastGame);
    }

    if (!resume) {
      clearGame();
    }

    this.tally = savedTally();

    this.setState({
      game: game,
      startButton: false,
      rolling: lastGame ? false : true,
    });

    setTimeout(lastGame ? (function() {
      lastGame.currentPlayer === 'light' && _this.doAutomatedMove();
    }) : this.doDecidingRoll, TIMEOUT);

    window.addEventListener('beforeunload', this.handleUnload);
  }

  handleUnload(e) {
    const msg = 'Game is in progress.. Leave page?';
    (e || window.event).returnValue = msg;
    return msg;
  }

  hideDice() {
    this.setState({
      showDecision: false,
    });
    setTimeout(this.doDecidingRoll, TIMEOUT);
  }

  // decide who gets opening move
  doDecidingRoll() {
    this.setState({
      showDecision: false
    });
    const roll = this.state.game.decide();
    const tie = roll[0] === roll[1];
    this.setState({
      tie: tie,
      showDecision: roll
    })
    setTimeout( tie ? this.hideDice : this.playerRoll, LONG_TIMEOUT);
  }

  playerRoll() {
    this.state.game.rollPlayerDice();
    var game = this.state.game;

    this.setState({
      game: game,
      showDecision: null,
      clearDice: false,
      rolling: false,
    });

    saveGame(game.currentHistoryState());

    if(!game.canMove()) {
      if (game.lastRoll && game.lastRoll.length) {
        this.setState({noMoves: true})
      }
      setTimeout(this.turnComplete, TIMEOUT);
    } else if (game.currentPlayer === 'light') {
      setTimeout(this.doAutomatedMove, SHORT_TIMEOUT);
    }
  }

  ifNoAnimation(callback) {
    if (!this.animationInProgress) {
      callback();
    }
  }

  // returns promise that resolves when animation is complete, or immediately if no animation.
  afterAnimation() {
    const _this = this;
    return new Promise(function(resolve, reject) {
      if (!_this.animationInProgress) {
        resolve();
      } else {
        _this.outsideResolve = resolve;
      }
    });
  }

  doAutomatedMove() {
    const game = this.state.game;
    if (game.currentPlayerHasWon()) {
      this.completeGame();
    } else {

      const move = game.automatedMove();
      if (move) {
        this.updateGame(move[0], move[1]);
      } else {
        if (game.lastRoll && game.lastRoll.length) {
          this.setState({noMoves: true})
        }
        setTimeout(this.turnComplete, TIMEOUT);
      }
    }
  }

  // move clicked chip to first available point.
  // TODO: highlight possible moves to select from
  animatePlayerClick(event, index) {
    const game = this.state.game;
    const moves = game.currentPlayerMoves(index);
    let move = moves.sort()[0];
    move = game.doMove(index, moves[0]);
    if(move) {
      if (game.currentPlayerHasWon()) {
        this.completeGame();
      } else if (move) {
        this.animationInProgress = true;
        const anim = new ChipAnimation(game.currentPlayer);
        anim.animateMove(move, game, this.handleAnimationFinish);
      }
    }
  }

  completeGame() {

    this.tally[this.state.game.currentPlayer] ++;
    saveGame(this.state.game.currentHistoryState(), this.tally);

    const tally = this.tally,
      target = tally.target,
      darkWon = tally.dark >= target,
      lightWon = tally.light >= target;

    if (darkWon || lightWon) {
      // TODO implement series winner screen
      alert(darkWon ? 'Player Wins Series!' : 'Computer Wins Series!');
      this.tally = this.DEFAULT_TALLY;
      saveGame(this.state.game.currentHistoryState());
    }

    this.setState({
      winner: this.state.game.currentPlayer,
      game: this.state.game,
      nextGameButton: !savedActiveGame() && seriesInProgress(),
    });

    window.removeEventListener('beforeunload', this.handleUnload);
    setTimeout(this.showGameOptions, LONG_TIMEOUT);
  }

  handleAnimationFinish() {
    this.animationInProgress = false;

    this.outsideResolve && this.outsideResolve();
    const game = this.state.game;
    this.setState({game: game});
    
    if (game.currentPlayerAutomated()) {
      this.doAutomatedMove();
    } else {
      if (game.lastRoll.length) {
        if(!game.canMove()) {
          this.setState({noMoves: true})
          setTimeout(this.turnComplete, TIMEOUT);
        }
      } else {
        setTimeout(this.turnComplete, TIMEOUT);
      }
    }
  }

  updateGame(from, to) {
    let game = this.state.game;
    let move = game.doMove(from, to);
    if(move) {
      if (this.currentPlayerDark() && game.currentPlayerHasWon()) {
        this.completeGame();
      } else if (game.currentPlayer === 'light' && move) {
        this.animationInProgress = true;
        const anim = new ChipAnimation(game.currentPlayer);
        this.outsideResolve && this.outsideResolve();
        anim.animateMove(move, game, this.handleAnimationFinish);
      } else if(game.canMove()) {
         this.setState({game: game});
      } else {
        const _this = this;
        setTimeout(function() {
          if (game.lastRoll && game.lastRoll.length) {
            _this.setState({
              noMoves: true,
              game: game,
            })
          }
          setTimeout(_this.turnComplete, TIMEOUT);
        }, SHORT_TIMEOUT);
      }
    } else {
      this.setState({game: game})
      // TODO reset chip
    }
  }

  turnComplete() {
    const game = this.state.game;
    game.nextTurn();
    this.setState({
      noMoves: false,
      game: game,
      clearDice: true,
      rolling: true,
    });

    setTimeout(this.playerRoll, TIMEOUT);
  }

  showGameOptions() {
    this.setState({
      startButton: true,
      winner: null,
    });
  }

  undoLastMove() {
    const game = this.state.game
    game.undo();
    this.setState({game: game});
  }

  render() {
    // TODO figure out better way to preload dice imgs
    const coverText = this.coverText();

    return (
      <div className="game">
        <div className="top-area">
          <div className='images' style={{display: 'none'}}>
            <img src={require('./images/die1.png')} alt='' />
            <img src={require('./images/die2.png')} alt='' />
            <img src={require('./images/die3.png')} alt='' />
            <img src={require('./images/die4.png')} alt='' />
            <img src={require('./images/die5.png')} alt='' />
            <img src={require('./images/die6.png')} alt='' />
          </div>
        </div>
        <div className="">
          <Board
            game={this.state.game}
            rolling={this.state.rolling}
            updateGame={this.updateGame}
            tie={this.state.tie}
            showDecision={this.state.showDecision}
            showCover={this.state.startButton || coverText}
            coverText={coverText}
            undoLastMove={this.undoLastMove}
            tally={savedTally()}
            turnComplete={this.turnComplete}
            animatePlayerClick={this.animatePlayerClick}
            afterAnimation={this.afterAnimation}
            ifNoAnimation={this.ifNoAnimation}
            clearDice={this.state.clearDice}
            handleStartGame={this.startNew}
            startButton={this.state.startButton}
            nextGameButton={this.state.nextGameButton}
            resumeButton={this.state.resumeButton}
          />
        </div>
      </div>
    );
  }
}
