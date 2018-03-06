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

    let gameLogic = new GameLogic();

    this.state = {
      game: gameLogic,
      tie: false,
    }
  }

  coverText() {
    let text;
    const game = this.state.game;
    const addressee = (game.currentPlayer === 'dark') ? ' Player ' : ' Computer ';
    if (this.state.noMoves) {
      text = addressee + ' has no moves..';
    } else if (this.state.game.rolling) {
      const decidingRoll = this.state.showDecision;
      text = (decidingRoll) ?
        (decidingRoll[0] + ', ' + decidingRoll[1] + addressee + 'starts...') :
        addressee + 'Rolling...';
      if (!game.currentPlayer) {
        text = this.state.tie ? 'OOPS! TIE! Rolling again' : 'Opening roll...';
      }
    }
    return text;
  }

  startNew() {
    var game = this.state.game;
    game.start();
    game.rolling = true;

    this.setState({
      game: game,
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
    this.updateStatus();
    var game = this.state.game;
    game.rolling = false;

    this.setState({
      game: game,
      showDecision: null,
      clearDice: false,
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
      // TODO: start "computer move" animation
      // TODO: figure out why this cycle times unevenly..

    } else {
      setTimeout( this.turnComplete, this.TIMEOUT);
    }
  }

  updateGame(from, to) {
    let game = this.state.game;
    if(game.doMove(from, to)) {
      this.setState({game: game})

      if(game.canMove()) {
        if(game.currentPlayer === 'light') {
          setTimeout( this.doAutomatedMove, this.SHORT_TIMEOUT)
        }
      } else {
        if (game.lastRoll && game.lastRoll.length) {
          this.setState({noMoves: true})
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
    game.rolling = true;
    game.nextTurn();
    this.setState({
      noMoves: false,
      game: game,
      clearDice: true,
    });

    setTimeout(this.playerRoll, this.TIMEOUT);
  }

  updateStatus() {
    const status = document.getElementById('status');
    status.html = 'adfas';
  }

  render() {
    return (
      <div className="game">
        <div className="top-area"></div>
        <div className="game-board">
          <Board
            game={this.state.game}
            rolling={this.state.game.rolling}
            updateGame={this.updateGame}
            tie={this.state.tie}
            showDecision={this.state.showDecision}
            rollingText={this.coverText()}
            clearDice={this.state.clearDice}
            />
        </div>
        <div>
          <button
            onClick={() => this.startNew()}>
            New Game...
          </button>
          <div>
            <div>
              <ol id="status">{
                this.state.game.currentPlayer &&
                (<span><b>Current Player:</b> {this.state.game.currentPlayer}</span>)
              }
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
