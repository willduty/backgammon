import React from 'react';
import Board from './Board';
import GameLogic from './gameLogic.js';

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
    const m = game.automatedMove();
    if (m) {
      this.updateGame(m[0], m[1]);
    } else {
      setTimeout(this.turnComplete, this.SHORT_TIMEOUT);
    }
  }


  // TODO move all this anim stuff to a util file AND make animation optional
  findBoardContainer(index) {
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

  findAnimationChip(index) {
    const startContainer = this.findBoardContainer(index);
    const chips = startContainer.children;
    const chip = chips[chips.length - 1];
    return chip;
  }

  findAnimationTarget(targetIndex, move) {
  // TODO use a method and some destructuring for this mess
    const board = document.getElementById('board');
    const boardRect = board.getBoundingClientRect();
    const boardXOffset = boardRect.x;
    const boardYOffset = boardRect.y;
    const targetContainer = this.findBoardContainer(targetIndex);
    const targetChips = targetContainer.children;
    let targetRect, targetChip, y, x, end, yOffset = 0;
    if(targetChips.length === 0) {
      targetChip = targetContainer;
      targetRect = targetChip.getBoundingClientRect();
      yOffset = targetIndex < 12 ? 230 : -boardYOffset;
    } else {
      targetChip = targetChips[targetChips.length - 1];
      targetRect = targetChip.getBoundingClientRect();
      yOffset = targetIndex < 12 ? -51 : boardYOffset;
    }

    end = [targetRect.x - boardXOffset, targetRect.y + yOffset];

    if (move[0] > 23 || move[0] < 0) {
      const adj = targetChips ? (targetChips.length * 35) : 0;
      end = [targetRect.x - boardXOffset - 300, targetRect.y - 230 + adj];
    }
    return end;
  }

  animateMove(move, game, path, chip) {
    const _this = this;
    const board = document.getElementById('board');
    const boardRect = board.getBoundingClientRect();
    const boardXOffset = boardRect.x;
    const boardYOffset = boardRect.y;

    // TODO this needs to break into 2 moves
    const targetIndex = Array.isArray(move[1]) ? move[1][move[1].length - 1] : move[1];

    if(!path) {
      // START POSITION
      chip = this.findAnimationChip(move[0]);
      const rect = chip.getBoundingClientRect();
      const moveStart = move[0]
      let start = (moveStart > 23 || moveStart < 0) ?
        [0, 0] :
        [Math.round(rect.x - boardXOffset), Math.round(rect.y) - boardYOffset];
      path = ['highlight', start.slice()];

      // END POSITION
      const end = this.findAnimationTarget(targetIndex, move);
      const diffX = end[0] - start[0];
      const diffY = end[1] - start[1];
      const dist = Math.sqrt(diffX * diffX + diffY * diffY)

      // calculate intermediate points
      const frame_count = 20;
      for (var i = 0; i < frame_count; i++) {
        const last = path[path.length - 1].slice();
        last[0] = start[0] + (diffX / frame_count * i);
        last[1] = start[1] + (diffY / frame_count * i);
        path.push(last);
      }
    }

    if (path) {
      if (path.length) {
        let FRAME_RATE;
        if(path[0] === 'highlight') {
          FRAME_RATE = 800;
          chip.className = chip.className + ' selectable-light'
        } else {
          FRAME_RATE = 15;
          chip.style.left = path[0][0] + 'px'
          chip.style.top = path[0][1] + 'px'
        }
        path = path.slice(1);
        setTimeout(function() {
          _this.animateMove(move, game, path, chip);
        }, FRAME_RATE);
      } else {
        _this.setState({game: game});
        setTimeout(_this.doAutomatedMove, this.SHORT_TIMEOUT);
      }
    }
  }

  updateGame(from, to) {
    let game = this.state.game;
    let move;
    if(move = game.doMove(from, to)) {
      if (game.currentPlayerHasWon()) {
        this.setState({
          winner: game.currentPlayer,
          game: game,
        });
        setTimeout(this.showGameOptions, this.LONG_TIMEOUT);
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
