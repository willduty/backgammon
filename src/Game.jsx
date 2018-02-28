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
    if (this.state.game.rolling) {
      const decidingRoll = this.state.showDecision;
      text = (decidingRoll) ?
        (decidingRoll[0] + ', ' + decidingRoll[1] + ((game.currentPlayer == 'dark') ? ' Player ' : ' Computer ') + 'starts...') :
        (game.currentPlayer == 'light' ? 'Computer ' : 'Player ') + 'Rolling...';

      if (!game.currentPlayer) {
        text = this.props.tie ? 'OOPS! TIE! Rolling again' : 'Opening roll...';
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

  // decide who goes first
  doDecidingRoll() {
    this.setState({showDecision: null})
    const roll = this.state.game.decide();
    if (roll[0] === roll[1]) {
      this.setState({
        tie: true,
        showDecision: roll
      })
      setTimeout(this.doDecidingRoll, this.TIMEOUT);
    } else {
      this.setState({
        tie: false,
        showDecision: roll
      });

    setTimeout(this.playerRoll, this.LONG_TIMEOUT);
    }
  }

  playerRoll() {
    this.state.game.rollPlayerDice();
    this.updateStatus();
    var game = this.state.game;
    game.rolling = false;

    this.setState({
      game: game,
      showDecision: null,
    });

    if (game.currentPlayer === 'light') {
      setTimeout(this.doAutomatedMove, this.SHORT_TIMEOUT);
    }
  }

  doAutomatedMove() {
    if (this.state.game.canMove()) {
      const m = this.state.game.automatedMove();
      this.updateGame(m[0][0], m[0][1]);
      // TODO: start "computer move" animation
      // TODO: figure out why this cycle times unevenly..

      setTimeout( this.doAutomatedMove, this.SHORT_TIMEOUT);
    } else {
      setTimeout( this.turnComplete, this.TIMEOUT);
    }
  }

  updateGame(from, to) {
    let game = this.state.game;
    if(game.doMove(from, to)) {
      this.setState({game: game})
    } else {
      this.setState({game: game})
      // TODO reset chip
    }
  }

  turnComplete() {
    var game = this.state.game;
    game.rolling = true;
    game.nextTurn();
    this.setState({
      game: game,
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
            turnComplete={this.turnComplete}
            tie={this.state.tie}
            showDecision={this.state.showDecision}
            rollingText={this.coverText()}
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
