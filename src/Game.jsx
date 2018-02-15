import React from 'react';
import Board from './Board';
import GameLogic from './gameLogic.js';

export default class Game extends React.Component {
  constructor(props) {
    super(props);
    this.startNew = this.startNew.bind(this);
    this.playerRoll = this.playerRoll.bind(this);
    this.doDecidingRoll = this.doDecidingRoll.bind(this);
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
    setTimeout(this.doDecidingRoll, 500);
  }

  doDecidingRoll() {
    const roll = this.state.game.decide();
    if (roll[0] === roll[1]) {
      console.log('oops, tie!');
      setTimeout(this.doDecidingRoll, 1000);
    } else {
      setTimeout(this.playerRoll, 500);
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

  updateStatus() {
    const status = document.getElementById('status');
    status.html = 'adfas';
  }

  render() {
    return (
      <div className="game">

        <div className="game-board">
          <Board
            game={this.state.game}
            rolling={this.state.game.rolling}
            />
        </div>
        <div>
          <button
            onClick={() => this.startNew()}>
            New Game...
          </button>
          <div>
            <div>GAME STATUS...
              <ol id="status">current...{this.state.currentPlayer}</ol>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
