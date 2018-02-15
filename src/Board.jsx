import React from 'react';
import Square from './Square'
import Dice from './Dice'

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
    const changed = (prevState.highlightTargets.length !== this.state.highlightTargets.length) ||
      (prevState.game.player !== this.state.game.player);
    const gameChanged = this.props.rolling !== prevProps.rolling;
    if (gameChanged || changed) {
      this.setState({
        game: this.props.game,
        rolling: this.props.rolling
      })
    }
  }

  showMoves(rolloverIndex) {
    const targets = this.state.game.darkMoves[rolloverIndex] || [];
    this.setState({highlightTargets: targets});
  }

  hideMoves() {
    this.setState({highlightTargets: []});
  }

  renderSquare(i) {
    let a = this.state.highlightTargets.indexOf(i) !== -1;

    return (<Square
      index={i}
      chips={{dark: (this.state.game.dark[i] || 0), light: (this.state.game.light[i] || 0)}}
      player={this.state.game.currentPlayer}
      onMouseEnter={this.showMoves}
      onMouseLeave={this.hideMoves}
      highlight={a}
      rolling={this.state.rolling}
    />);
  }

  render() {
    const status = '';
    // TODO make cover a component
    return (
      <div className='test'>
        <div className={this.state.rolling ? 'cover' : '' }>
          <div>{this.state.rolling ? 'Rolling...' : ''}</div>
        </div>
        <Dice game={this.state.game}/>
        <div className="board-section">
          <div>
            {this.renderSquare(12)}
            {this.renderSquare(13)}
            {this.renderSquare(14)}
            {this.renderSquare(15)}
            {this.renderSquare(16)}
            {this.renderSquare(17)}
          </div>
          <div>
            {this.renderSquare(11)}
            {this.renderSquare(10)}
            {this.renderSquare(9)}
            {this.renderSquare(8)}
            {this.renderSquare(7)}
            {this.renderSquare(6)}
          </div>
        </div>
        <div className='bar'>&nbsp;</div>
        <div className="board-section">
          <div>
            {this.renderSquare(18)}
            {this.renderSquare(19)}
            {this.renderSquare(20)}
            {this.renderSquare(21)}
            {this.renderSquare(22)}
            {this.renderSquare(23)}
          </div>
          <div>
            {this.renderSquare(5)}
            {this.renderSquare(4)}
            {this.renderSquare(3)}
            {this.renderSquare(2)}
            {this.renderSquare(1)}
            {this.renderSquare(0)}
          </div>
        </div>
        <div className="board-section">
          <div className="part">
            <div>box1</div>
            <div>dcube</div>
            <div>box2</div>
          </div>
        </div>
      </div>
    );
  }
}
