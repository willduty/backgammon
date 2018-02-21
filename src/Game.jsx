import React from 'react';
import Board from './Board';
import GameLogic from './gameLogic.js';

export default class Game extends React.Component {
  constructor(props) {
    super(props);
    this.TIMEOUT = 400;
    this.startNew = this.startNew.bind(this);
    this.playerRoll = this.playerRoll.bind(this);
    this.doDecidingRoll = this.doDecidingRoll.bind(this);
    this.updateGame = this.updateGame.bind(this);

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
  }

  updateGame(change) {
    let game = this.state.game;
    if(game.attemptChange(change)) {
      this.setState({game: game})
    }
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
