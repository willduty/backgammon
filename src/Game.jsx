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
      game: gameLogic.blankGame
    }
  }

  startNew() {
    this.setState({game: this.state.logic.standardGame})
  }

  render() {
    return (
      <div className="game">
        <div className="game-board">
          <Board game={this.state.game} />
        </div>
        <div>
          <div>GAME STATUS...
            <ol>TODO...{/* TODO */}</ol>
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
