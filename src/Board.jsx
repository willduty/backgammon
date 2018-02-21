import React from 'react';
import Square from './Square'
import Dice from './Dice'
import _ from 'lodash';

export default class Board extends React.Component {
  constructor(props) {
    super(props);
    this.showMoves = this.showMoves.bind(this);
    this.hideMoves = this.hideMoves.bind(this);
    this.startDrag = this.startDrag.bind(this);
    this.stopDrag = this.stopDrag.bind(this);
    this.dragging = this.dragging.bind(this);

    this.state = {
      game: this.props.game,
      highlightTargets: [],
      board: document.getElementById('draggableArea'),
      currentDragTargetIndex: null,
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

  startDrag(event, chipIndex) {
    const square = document.getElementById('square_' + chipIndex);
    const chip = _.find(square.children, function(e) {
      return e.className.indexOf('selectable') !== -1
    });
    this.state.dragObjOriginalY = chip.style.top;
    this.state.dragObjParentIndex = chipIndex;
    this.state.dragObj = chip;

    this.state.dragCursorYOffset = parseInt(this.state.dragObjOriginalY) - parseInt(event.pageY);
    this.state.dragCursorXOffset = square.getBoundingClientRect().x - parseInt(event.pageX);
  }

  stopDrag(e) {
    console.log('-->', e.target.parentElement, e.clientX)
    if (this.state.dragObj) {
      this.state.dragObj.style.left = null;
      this.state.dragObj.style.top = this.state.dragObjOriginalY;
      this.state.dragObj = null;
      this.setState({currentDragTargetIndex: null})
    }
  }

  dragging(e) {
    if(this.state.dragObj) {
      const boardRect = document.getElementById('draggableArea').getBoundingClientRect();
      const mouseX = Math.floor((e.pageX - boardRect.x)/51)
      const mouseY = Math.floor((e.pageY - boardRect.y)/300);
      const currentSq = (mouseY < 1) ? (mouseX + 12) : (11 - mouseX);
      this.setState({currentDragTargetIndex: currentSq});

      let y = (this.state.dragObjParentIndex < 12) ? ( 1000 - e.pageY ) : e.pageY;
      y += this.state.dragCursorYOffset;

      let x = e.pageX + this.state.dragCursorXOffset;

      this.state.dragObj.style.zIndex = 100000;
      this.state.dragObj.style.top = y + 'px';
      this.state.dragObj.style.left = x + 'px';
    }
  }

  renderSquare(i) {
    let highlight = this.state.highlightTargets.indexOf(i) !== -1;

    return (<Square
      index={i}
      chips={{dark: (this.state.game.dark[i] || 0), light: (this.state.game.light[i] || 0)}}
      player={this.state.game.currentPlayer}
      onMouseEnter={this.showMoves}
      onMouseLeave={this.hideMoves}
      onMouseDown={this.startDrag}
      onMouseUp={this.stopDrag}
      highlight={highlight}
      currentDragTargetIndex={this.state.currentDragTargetIndex}
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

        <div id='draggableArea' onMouseMove={this.dragging} onMouseUp={this.stopDrag}>
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
