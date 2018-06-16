import React from 'react';
import Board from './Board';
import GameLogic from './gameLogic.js';
import _ from 'lodash';
import { clearGame, saveGame, savedActiveGame, savedTally, seriesInProgress } from './util/gamesHelper.js'
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
    this.animateMove = this.animateMove.bind(this);
    this.afterAnimation = this.afterAnimation.bind(this);
    this.handleUnload = this.handleUnload.bind(this);
    this.animationInProgress = false;

    // TODO should probably do this in startNew()
    let gameLogic = new GameLogic();

    this.state = {
      game: gameLogic,
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

  afterAnimation() {
    const _this = this;
    return new Promise(function(resolve, reject) {
      if(!_this.animationInProgress) {
        resolve();
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
        this.animateMove(move, game);
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

  // TODO move all this anim stuff to a util file
  // TODO make animation optional

  // returns dom element where chips can be placed, based on position index.
  // this will be either a point, a spot on the center bar, or an offboard chip holder.
  findContainer(index) {
    let id;
    if(index > -1 && index < 24) {
      id = 'square_' + index;
    } else if (index === -1) {
      id = 'bar-holder-dark';
    } else if (index === 24) {
      id = 'bar-holder-light';
    } else if (index === 'off') {
      id = 'light-offboard';
    }
    return document.getElementById(id);
  }

  findAnimationChipBox(targetIndex, isStart) {
    const targetContainer = this.findContainer(targetIndex);
    let boxIds = [];
    const off = (targetIndex === 'off') ? (this.state.game.currentPlayer + '_') : '';
    for(let i = 0; i < targetContainer.firstChild.children.length; i++) {
      boxIds.push('box_' + targetIndex + '_' + (off) + i);
    }

    const _this = this;
    let lastBoxIndex = _.findLastIndex(boxIds, function(boxId) {
      const chips = document.getElementById(boxId).children;
      if (targetIndex === 'off') {
        return chips.length;
      } else {
        return chips.length && (chips[0].className.indexOf(_this.state.game.currentPlayer) !== -1);
      }
    });

    (!isStart && lastBoxIndex > -1) && lastBoxIndex++;
    (lastBoxIndex === -1) && (lastBoxIndex = 0);

    const lastBox = 'box_' + targetIndex + '_' + off + lastBoxIndex;

    return document.getElementById(lastBox);
  }

  // returns the position ([x, y]) of where a chip should be given targetIndex for a board element
  // if isStart is true, accounts for the chip itself being present, else calculates hypothetical position
  findAnimationTarget(targetIndex, isStart) {
    const boardRect = document.getElementById('board').getBoundingClientRect();
    const chipBox = this.findAnimationChipBox(targetIndex, isStart);
    return [chipBox.getBoundingClientRect().x - boardRect.x,
     chipBox.getBoundingClientRect().y - boardRect.y - (targetIndex === 'off' ? 43 : 0)];
  }

  // Returns an array of positions ([x, y]) for the path from container at startIndex to container at targetIndex.
  buildPath(startIndex, targetIndex, isStart) {
    const start = this.findAnimationTarget(startIndex, isStart);
    const end = this.findAnimationTarget(targetIndex, false);
    const diffX = end[0] - start[0];
    const diffY = end[1] - start[1];
    let path = [start.slice()];

    // calculate intermediate points
    const frame_count = 20;
    for (var i = 0; i < frame_count; i++) {
      const last = _.last(path).slice();
      last[0] = start[0] + (diffX / frame_count * i);
      last[1] = start[1] + (diffY / frame_count * i);
      path.push(last);
    }

    path.push(end.slice());
    return path;
  }

  // Returns an array of animation steps for an entire move, including blots moving to bar.
  // Each array item is either an animation step (hash of position and chip)
  // or a directive string like 'highlight' or 'pause'.
  buildPaths(chip, startIndex, moveSummary) {
    const move = moveSummary.move
    let pathPoints = _.flatten([move[0], move[1]]);
    let subMoves = [];
    const _this = this;
    for(var n = 0; n < pathPoints.length - 1; n++) {
      subMoves.push([pathPoints[n], pathPoints[n + 1]]);
    }

    let path = ['highlight'];

    _.each(subMoves, function(fromTo) {
      let pathpoints = _this.buildPath(fromTo[0], fromTo[1], startIndex === fromTo[0]);

      pathpoints = pathpoints.map(function(arr) {
        return {position: arr.slice(), chip: chip};
      }).slice();

      path  = _.concat(path, pathpoints);
      path  = _.concat(path, ['pause']);

      _this.lastBlotIndex = null;

      let blottedChip;
      // if a blot occurs, animate blotted chip to bar
      if (moveSummary.blots && moveSummary.blots.indexOf(fromTo[1]) !== -1) {
        const barIndex = _this.currentPlayerDark() ? 24 : -1;
        pathpoints = _this.buildPath(fromTo[1], barIndex , true);
        const blotContainer = _this.findAnimationChipBox(fromTo[1], true);

        // TODO: bad, render should take care of chip position...
        if (!_this.lastBlotIndex) {
          _this.lastBlotIndex = fromTo[1];
        }

        blottedChip = blotContainer.firstChild;

        pathpoints = pathpoints.map(function(arr) {
          return {position: arr.slice(), chip: blottedChip};
        });

        path  = _.concat(path, pathpoints);
        path  = _.concat(path, ['pause']);
      }
    });
    return path;
  }

  animateMove(moveSummary, game, path, chip) {
    const move = moveSummary.move;
    const _this = this;
    const startIndex = move[0];
    chip = chip || this.findAnimationChipBox(startIndex, true).firstChild;
    path = path || this.buildPaths(chip, startIndex, moveSummary);

    this.animationInProgress = true;
    if (path.length) {
      let FRAME_RATE, frameInfo = path[0];
      if(frameInfo === 'highlight') {
        FRAME_RATE = 100;
        chip.className = 'chip selectable-light';
      } else if (frameInfo === 'pause') {
        FRAME_RATE = 200;
      } else {
        FRAME_RATE = 15;
        frameInfo.chip.style.left = frameInfo.position[0] + 'px';
        frameInfo.chip.style.top = frameInfo.position[1] + 'px';
        frameInfo.chip.style.zIndex = 1000000;
      }

      path = path.slice(1);
      setTimeout(function() {
        _this.animateMove(moveSummary, game, path, frameInfo.chip);
      }, FRAME_RATE);
    } else {
      this.setState({game: this.state.game});

      if(this.lastBlotIndex || this.lastBlotIndex === 0) {
        const box = document.getElementById('box_' + this.lastBlotIndex + '_0');
        const chip = box.firstChild;
        chip.style.left = box.style.left;
        chip.style.top = box.style.top;
        chip.style.zIndex = box.style.zIndex;
        this.lastBlotIndex = null;
      }

      this.animationInProgress = false;

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
  }

  updateGame(from, to) {
    let game = this.state.game;
    let move = game.doMove(from, to);
    if(move) {
      if (this.currentPlayerDark() && game.currentPlayerHasWon()) {
        this.completeGame();
      } else if (game.currentPlayer === 'light' && move) {
        this.animateMove(move, game);
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
