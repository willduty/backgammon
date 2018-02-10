import React from 'react';
import _ from 'lodash';
import Square from './Square'

export default class Board extends React.Component {
  constructor(props) {
    super(props);
    this.showMoves = this.showMoves.bind(this);
    this.hideMoves = this.hideMoves.bind(this);

    this.state = {
      game: this.props.game,
      highlightTargets: []
    }
  };

  componentDidUpdate(prevProps, prevState) {
    const changed = (prevState.highlightTargets.length !== this.state.highlightTargets.length);
    const gameChanged = JSON.stringify(this.props.game) !== JSON.stringify(prevState.game);
    if (gameChanged || changed) {
      this.setState({game: this.props.game})
    }
  }

  showMoves() {
    const i = Math.round(Math.random() * 23);
    this.setState({highlightTargets: [2,3,5]});
  }

  hideMoves() {
    this.setState({highlightTargets: []});
  }

  renderSquare(i) {
    return (<Square
      index={i}
      chips={{dark: (this.state.game.dark[i] || 0), light: (this.state.game.light[i] || 0)}}
      player={this.state.game.currentPlayer}
      onMouseEnter={this.showMoves}
      onMouseLeave={this.hideMoves}
      highlight={this.state.highlightTargets.indexOf(i) !== -1}
    />);
  }

  render() {
    const status = '';
    return (
      <div>
        <div className="board-section">
          <div>
            {this.renderSquare(0)}
            {this.renderSquare(1)}
            {this.renderSquare(2)}
            {this.renderSquare(3)}
            {this.renderSquare(4)}
            {this.renderSquare(5)}
          </div>
          <div>
            {this.renderSquare(12)}
            {this.renderSquare(13)}
            {this.renderSquare(14)}
            {this.renderSquare(15)}
            {this.renderSquare(16)}
            {this.renderSquare(17)}
          </div>
        </div>
        <div className='bar'>&nbsp;</div>
        <div className="board-section">
          <div>
            {this.renderSquare(6)}
            {this.renderSquare(7)}
            {this.renderSquare(8)}
            {this.renderSquare(9)}
            {this.renderSquare(10)}
            {this.renderSquare(11)}
          </div>
          <div>
            {this.renderSquare(18)}
            {this.renderSquare(19)}
            {this.renderSquare(20)}
            {this.renderSquare(21)}
            {this.renderSquare(22)}
            {this.renderSquare(23)}
          </div>
        </div>
        <div className="board-section">
          <div className="part">
            TODO doubling cube and chip stashers
          </div>
        </div>
      </div>
    );
  }
}
