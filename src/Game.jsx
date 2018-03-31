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
      if (this.gameOn && !game.currentPlayer) {
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

    this.setState({
      game: game,
      startButton: false,
      rolling: true,
    });
    setTimeout(this.doDecidingRoll, this.TIMEOUT);
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
      const m = game.automatedMove();
      if (m) {
        this.updateGame(m[0], m[1]);
      } else {
        setTimeout(this.turnComplete, this.SHORT_TIMEOUT);
      }
    }
  }

  completeGame() {
    this.setState({
      winner: this.state.game.currentPlayer,
      game: this.state.game,
    });
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

  // returns the position ([x, y]) of where a chip should be given targetIndex for a board element
  // if isStart is true, accounts for the chip itself being present, else calculates hypothetical position
  // isBarChip is needed to account for different bar offsets than rest of board // TODO get rid of this?
  findAnimationTarget(targetIndex, isStart, isBarChip) {
    const boardRect = document.getElementById('board').getBoundingClientRect();
    const targetContainer = this.findContainer(targetIndex);
    const currPlayerTargetChips = _.filter(targetContainer.children, function(chip) {
      return chip.className.indexOf('light') !== -1;
    });

    let targetRect, targetChip, target, yOffset = 0, xOffset = 0;

    // adjust depending on whether target is empty or has chips..
    if(currPlayerTargetChips.length === 0 || (isStart && currPlayerTargetChips.length === 1)) {
    // TODO, insert a temp chip? or get an array of 'zero' chips on start
      targetChip = targetContainer;
      targetRect = targetChip.getBoundingClientRect();
      yOffset = targetIndex < 12 ? 250 : 0;
    } else {
      targetChip = currPlayerTargetChips[currPlayerTargetChips.length - (isStart ? 2 : 1)];
      targetRect = targetChip.getBoundingClientRect();
      yOffset = targetIndex < 12 ? -40 : 40;
    }

    if(targetChip.className === 'bar-holder-dark') {
      const offset = document.getElementById('bar-holder-dark').children.length * 7;
      xOffset = -8;
      yOffset = offset + 50;
    }

    if(targetChip.className === 'bar-holder-light') {
      xOffset = -8;
      yOffset = 0;
    }

    if(targetChip.parentElement.className === 'bar-holder-light') {
      const offset = (document.getElementById('bar-holder-light').children.length - 1) * 7;
      xOffset = 0;
      yOffset = 7;
    }

    if (targetIndex === 'off') {
      const holderChipCount = targetContainer.children[0].children.length;
      xOffset -= 3;
      yOffset += 57 - holderChipCount * 7;
    }

    return [targetChip.getBoundingClientRect().x - boardRect.x + xOffset, targetChip.getBoundingClientRect().y - boardRect.y + yOffset]
  }

  // Returns an array of positions ([x, y]) for the path from container at startIndex to container at targetIndex.
  buildPath(startIndex, targetIndex, isStart, isBarChip) {
    // START POSITION
    const start = this.findAnimationTarget(startIndex, isStart, isBarChip).slice();

    // END POSITION
    const end = this.findAnimationTarget(targetIndex, false, isBarChip);
    const diffX = end[0] - start[0];
    const diffY = end[1] - start[1];
    let path = [start.slice()];

    // calculate intermediate points
    const frame_count = 20;
    for (var i = 0; i < frame_count; i++) {
      const last = path[path.length - 1].slice();
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
    const startContainer = this.findContainer(move[0]);
    const chips = startContainer.children;
    chip = chips[chips.length - 1];

    // TODO move to function buildAllPaths
    if(!path) {
      let pathPoints = _.flatten([move[0], move[1]])
      let subMoves = [];
      for(var n = 0; n < pathPoints.length - 1; n++) {
        subMoves.push([pathPoints[n], pathPoints[n + 1]]);
      }

      path = ['highlight'];
      const isBarChip = move[0] === 24 || move[0] === -1;

      _.each(subMoves, function(fromTo) {
        let pathpoints = _this.buildPath(fromTo[0], fromTo[1], move[0] === fromTo[0], isBarChip);
        pathpoints = pathpoints.map(function(arr) {
          return {position: arr.slice(), chip: chip};
        }).slice();

        path  = _.concat(path, pathpoints);
        path  = _.concat(path, ['pause']);

        _this.lastBlot = null;
        _this.lastBlotIndex = null;

        let blottedChip;
        // if a blot occurs, animate blotted chip to bar
        if (moveSummary.blots && moveSummary.blots.indexOf(fromTo[1]) !== -1) {
          pathpoints = _this.buildPath(fromTo[1], -1, true, true);
          const blotContainer = _this.findContainer(fromTo[1]);

          // TODO: bad, render should take care of chip position...
          if (!_this.lastBlot) {
            _this.lastBlot = pathpoints[0].slice();
            _this.lastBlotIndex = fromTo[1];
          }

          blottedChip = _.find(blotContainer.children, function(elem) {
            return elem.className.indexOf('dark') !== -1;
          });

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
        }

        path = path.slice(1);
        setTimeout(function() {
          _this.animateMove(moveSummary, game, path, frameInfo.chip);
        }, FRAME_RATE);
      } else {
        _this.setState({game: this.state.game});

        // TODO whatta mess
        if(_this.lastBlot) {
           document.getElementById('square_'+_this.lastBlotIndex).children[0].style.left = _this.lastBlot[0] + 'px';
           document.getElementById('square_'+_this.lastBlotIndex).children[0].style.top = _this.lastBlot[1] + 'px';
           _this.lastBlot = null;
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
        if (game.lastRoll && game.lastRoll.length) {
          this.setState({
            noMoves: true,
            game: game,
          })
        }
        setTimeout(this.turnComplete, this.TIMEOUT);
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
