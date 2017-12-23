import React from 'react';
import _ from 'lodash';
import Square from './Square'
const X_ICON = 'X', O_ICON = 'O';

export default class Board extends React.Component {
  constructor(props) {
    super(props);
    let arr = Array(9);
    _.each(arr, (a, i) => { arr[i] = null; })

    this.state = {
      squares: arr,
      xIsNext: true,
      winners: null,
    }
  };

  handleClick(i) {
    if (this.state.winners) {
      return;
    }

    if (this.state.squares[i]) {
      alert('taken!');
      return;
    }
    const squares = this.state.squares.slice();
    squares[i] = this.state.xIsNext ? X_ICON : O_ICON;
    const n = getWinnerSquares(squares)
    if (n) {
      this.setState({
        winners: n,
      });
    }

    this.setState({
      squares: squares,
      xIsNext: !this.state.xIsNext,
    });
  }

  renderSquare(i) {
    const className = (this.state.winners && this.state.winners.indexOf(i) !== -1) ? 'bold-square' : null;
    return (<Square
      value={this.state.squares[i]}
      onClick={() => this.handleClick(i)}
      class={className}
    />);
  }

  render() {
    const status =
      this.state.winners
        ?  'Winner is: ' + (this.state.xIsNext ? O_ICON : X_ICON) + '!'
        : 'Next player: ' + (this.state.xIsNext ? X_ICON : O_ICON);

    return (
      <div>
        <div className="status">{status}</div>
        <div className="board-row">
          {this.renderSquare(0)}
          {this.renderSquare(1)}
          {this.renderSquare(2)}
        </div>
        <div className="board-row">
          {this.renderSquare(3)}
          {this.renderSquare(4)}
          {this.renderSquare(5)}
        </div>
        <div className="board-row">
          {this.renderSquare(6)}
          {this.renderSquare(7)}
          {this.renderSquare(8)}
        </div>
      </div>
      );
  }
}

function getWinnerSquares(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return lines[i];
    }
  }
  return null;
}
