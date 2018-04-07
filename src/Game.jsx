import React from 'react';
import Board from './Board';
import GameLogic from './gameLogic.js';
import _ from 'lodash';

export default class Game extends React.Component {
  constructor(props) {
    super(props);
    this.TIMEOUT = 1000;
    this.SHORT_TIMEOUT = 500;
    this.LONG_TIMEOUT = 2000;
    this.startNew = this.startNew.bind(this);
    this.playerRoll = this.playerRoll.bind(this);
    this.doDecidingRoll = this.doDecidingRoll.bind(this);
    this.updateGame = this.updateGame.bind(this);
    this.turnComplete = this.turnComplete.bind(this);
    this.completeGame = this.completeGame.bind(this);
    this.doAutomatedMove = this.doAutomatedMove.bind(this);
    this.showGameOptions = this.showGameOptions.bind(this);
    this.undoLastMove = this.undoLastMove.bind(this);
    this.animateMove = this.animateMove.bind(this);
    this.handleUnload = this.handleUnload.bind(this);

    // TODO should probably do this in startNew()
    let gameLogic = new GameLogic();

    this.state = {
      game: gameLogic,
      tie: false,
      startButton: true,
      rolling: false,
    }
  }

  coverText() {
    let text;
    const game = this.state.game;
    const addressee = (game.currentPlayer === 'dark') ? ' Player ' : ' Computer ';

    if (this.state.winner) {
      text = addressee + ' has won the game!';
    } else if (this.state.noMoves) {
      text = addressee + ' has no moves..';
    } else if (this.state.rolling) {
      const decidingRoll = this.state.showDecision;
      text = (decidingRoll) ?
        (decidingRoll[0] + ', ' + decidingRoll[1] + addressee + 'starts...') :
        addressee + 'Rolling...';
      if (game.gameActive() && !game.currentPlayer) {
        text = this.state.tie ?
          'OOPS! Tie! Rolling again' :
          'Opening roll...';
      }
    }
    return text;
  }

  startNew() {
    var game = this.state.game;
    game.start();

    window.addEventListener('beforeunload', this.handleUnload);

    this.setState({
      game: game,
      startButton: false,
      rolling: true,
    });
    setTimeout(this.doDecidingRoll, this.TIMEOUT);
  }

  handleUnload(e) {
    const msg = 'Game is in progress.. Leave page?';
    (e || window.event).returnValue = msg;
    return msg;
  }

  // decide who gets opening move
  doDecidingRoll() {
    this.setState({showDecision: null})
    const roll = this.state.game.decide();
    const tie = roll[0] === roll[1];
    this.setState({
      tie: tie,
      showDecision: roll
    })
    setTimeout( tie ? this.doDecidingRoll : this.playerRoll, this.LONG_TIMEOUT);
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

    if(!game.canMove()) {
      if (game.lastRoll && game.lastRoll.length) {
        this.setState({noMoves: true})
      }
      setTimeout(this.turnComplete, this.TIMEOUT);
    } else if (game.currentPlayer === 'light') {
      setTimeout(this.doAutomatedMove, this.SHORT_TIMEOUT);
    }
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
        setTimeout(this.turnComplete, this.TIMEOUT);
      }
    }
  }

  completeGame() {
    this.setState({
      winner: this.state.game.currentPlayer,
      game: this.state.game,
    });

    window.removeEventListener('beforeunload', this.handleUnload);

    setTimeout(this.showGameOptions, this.LONG_TIMEOUT);
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
  buildPath(startIndex, targetIndex, isStart, isBarChip) {

    // START POSITION
    const start = this.findAnimationTarget(startIndex, isStart);

    // END POSITION
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

  animateMove(moveSummary, game, path, chip) {
    const move = moveSummary.move;
    const _this = this;
    const startIndex = move[0];

    // TODO move to function buildAllPaths
    if(!path) {
      chip = chip || this.findAnimationChipBox(startIndex, true).firstChild;
      let pathPoints = _.flatten([move[0], move[1]]);
      let subMoves = [];
      for(var n = 0; n < pathPoints.length - 1; n++) {
        subMoves.push([pathPoints[n], pathPoints[n + 1]]);
      }

      path = ['highlight'];
      const isBarChip = startIndex === 24 || startIndex === -1;

      _.each(subMoves, function(fromTo) {
        let pathpoints = _this.buildPath(fromTo[0], fromTo[1], startIndex === fromTo[0], isBarChip);

        pathpoints = pathpoints.map(function(arr) {
          return {position: arr.slice(), chip: chip};
        }).slice();

        path  = _.concat(path, pathpoints);
        path  = _.concat(path, ['pause']);

        _this.lastBlotIndex = null;

        let blottedChip;
        // if a blot occurs, animate blotted chip to bar
        if (moveSummary.blots && moveSummary.blots.indexOf(fromTo[1]) !== -1) {
          pathpoints = _this.buildPath(fromTo[1], -1, true, true);
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
    }

    if (path) {
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

        _this.setState({game: this.state.game});

        if(_this.lastBlotIndex || _this.lastBlotIndex === 0) {
            const box = document.getElementById('box_' + _this.lastBlotIndex + '_0');
            const chip = box.firstChild;
            chip.style.left = box.style.left;
            chip.style.top = box.style.top;
            chip.style.zIndex = box.style.zIndex;
           _this.lastBlotIndex = null;
         }
        _this.doAutomatedMove();
      }
    }
  }

  updateGame(from, to) {
    let game = this.state.game;
    let move = game.doMove(from, to);
    if(move) {
      if (game.currentPlayer === 'dark' && game.currentPlayerHasWon()) {
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
          setTimeout(_this.turnComplete, _this.TIMEOUT);
        }, this.SHORT_TIMEOUT);
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

    setTimeout(this.playerRoll, this.TIMEOUT);
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
    // TODO componentize start button or general button

    const coverText = this.coverText();

    return (
      <div className="game">
        <div className="top-area"></div>
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
            startButton={this.state.startButton &&
              <div
                className='cover-button'
                onClick={() => this.startNew()}>
                Start Game..
              </div>
            }
            clearDice={this.state.clearDice}
          />

        </div>
      </div>
    );
  }
}
