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

    this.setState({
      squares: squares,
      xIsNext: !this.state.xIsNext,
    });
  }

  renderSquare(i) {
    const className = (this.state.winners && this.state.winners.indexOf(i) !== -1) ? 'bold-square' : null;
    return (<Square
      index={i}
      value={this.state.squares[i]}
      onClick={() => this.handleClick(i)}
      class={className}
    />);
  }

  render() {
    const status = '';
    return (
      <div>
        <div className="status">{status}</div>
        <div className="board-row">
          {this.renderSquare(0)}
          {this.renderSquare(1)}
          {this.renderSquare(2)}
          {this.renderSquare(3)}
          {this.renderSquare(4)}
          {this.renderSquare(5)}
          <div class='bar'>&nbsp;</div>
          {this.renderSquare(6)}
          {this.renderSquare(7)}
          {this.renderSquare(8)}
          {this.renderSquare(9)}
          {this.renderSquare(10)}
          {this.renderSquare(11)}
        </div>
        <div className="board-row">
          {this.renderSquare(12)}
          {this.renderSquare(13)}
          {this.renderSquare(14)}
          {this.renderSquare(15)}
          {this.renderSquare(16)}
          {this.renderSquare(17)}
          <div class='bar'>&nbsp;</div>
          {this.renderSquare(18)}
          {this.renderSquare(19)}
          {this.renderSquare(20)}
          {this.renderSquare(21)}
          {this.renderSquare(22)}
          {this.renderSquare(23)}
        </div>
      </div>
    );
  }
}
