import React from 'react';
import Board from './Board';
import GameLogic from './gameLogic.js';

export default class Game extends React.Component {
  constructor(props) {
    super(props);
    this.TIMEOUT = 800;
    this.startNew = this.startNew.bind(this);
    this.playerRoll = this.playerRoll.bind(this);
    this.doDecidingRoll = this.doDecidingRoll.bind(this);
    this.updateGame = this.updateGame.bind(this);
    this.turnComplete = this.turnComplete.bind(this);
    this.doAutomatedMove = this.doAutomatedMove.bind(this);

    let gameLogic = new GameLogic();

    this.state = {
      game: gameLogic
    }
  }

  startNew() {
    var game = this.state.game;
    game.start();
    game.rolling = true;

    this.setState({
      game: game,
      rolling: false,
    });
    setTimeout(this.doDecidingRoll, this.TIMEOUT);
  }

  // decide who goes first
  doDecidingRoll() {
    const roll = this.state.game.decide();
    if (roll[0] === roll[1]) {
      console.log('oops, tie!');
      setTimeout(this.doDecidingRoll, this.TIMEOUT);
    } else {
      setTimeout(this.playerRoll, this.TIMEOUT);
    }
  }

  playerRoll() {
    const roll = this.state.game.rollPlayerDice();
    this.updateStatus();
    var game = this.state.game;
    game.rolling = false;

    this.setState({
      game: game,
    });

    if (game.currentPlayer == 'light') {
      setTimeout(this.doAutomatedMove, this.TIMEOUT);
    }
  }

  doAutomatedMove() {
    const m = this.state.game.automatedMoves();
    for (var i in m) {
      this.updateGame(m[i][0], m[i][1]);
    }

    // TODO: start computer move animation

    setTimeout( this.turnComplete, this.TIMEOUT);
  }

  updateGame(from, to) {
    let game = this.state.game;
    if(game.doMove(from, to)) {
      this.setState({game: game})
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
