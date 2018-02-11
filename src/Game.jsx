import React from 'react';
import Board from './Board';
import GameLogic from './gameLogic.js';

export default class Game extends React.Component {
  constructor(props) {
    super(props);
    this.startNew = this.startNew.bind(this);
    let gameLogic = new GameLogic()
    this.state = {
      logic: gameLogic,
      game: gameLogic
    }
  }

  startNew() {
    this.state.game.start();
    setTimeout(function() {
      const roll = this.state.game.rollPlayerDice();
      this.setState({
        game: this.state.game,
      });
    }.bind(this), 200);
  }

  updateStatus() {
    const status = document.getElementById('status');
    status.text = 'adfas';
  }

  render() {
    return (
      <div className="game">
        <div className="game-board">
          <Board game={this.state.game} />
        </div>
        <div>
          <div>GAME STATUS...
            <ol id="status">current...{this.state.currentPlayer}</ol>
          </div>
        </div>
        <div>
          <button
            onClick={() => this.startNew()}>
            New Game...
          </button>
        </div>
      </div>
    );
  }
}
