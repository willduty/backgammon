import React from 'react';
import Square from './Square'
import Dice from './Dice'
import Holder from './Holder'
import _ from 'lodash';

export default class Board extends React.Component {
  constructor(props) {
    super(props);
    this.showMoves = this.showMoves.bind(this);
    this.hideMoves = this.hideMoves.bind(this);
    this.startDrag = this.startDrag.bind(this);
    this.stopDrag = this.stopDrag.bind(this);
    this.dragging = this.dragging.bind(this);
    this.SQUARE_WIDTH = 51;

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
    if (this.state.dragObj) {
      this.props.updateGame({
        move: {from: this.state.dragObjParentIndex, to: this.state.currentDragTargetIndex}
      });

      this.setState({
        currentDragTargetIndex: null,
        dragObjParentIndex: null,
        dragObj: null,
        highlightTargets: [],
      });
    }
  }

  dragging(e) {
    if(this.state.dragObj) {
      const boardRect = this.state.boardRect || document.getElementById('draggableArea').getBoundingClientRect();
      const leftBoard = this.state.leftBoard || document.getElementById('left-board').getBoundingClientRect();
      const rightBoard = this.state.rightBoard || document.getElementById('right-board').getBoundingClientRect();
      const mouseY = Math.floor((e.pageY - boardRect.y) / 300);

      let currentSq;
      if(rightBoard.x < e.pageX && rightBoard.x + rightBoard.width > e.pageX) {
        if (mouseY < 1) {
          currentSq = Math.floor((e.pageX - rightBoard.left) / this.SQUARE_WIDTH) + 18;
        } else {
          currentSq = Math.floor((rightBoard.right - e.pageX) / this.SQUARE_WIDTH);
        }

      } else if (leftBoard.x < e.pageX && leftBoard.x + leftBoard.width > e.pageX) {
        if (mouseY < 1) {
          currentSq = Math.floor((e.pageX - leftBoard.left) / this.SQUARE_WIDTH) + 12;
        } else {
          currentSq = Math.floor((leftBoard.right - e.pageX) / this.SQUARE_WIDTH) + 6;
        }
      }


      let y = e.pageY;
      y += this.state.dragCursorYOffset;

      let x = ((this.state.dragObjParentIndex < 12) ? ( e.pageX  ) : e.pageX );
      x += this.state.dragCursorXOffset;

      let dragObj = this.state.dragObj;
      dragObj.style.zIndex = 100000;
      dragObj.style.top = y + 'px';
      dragObj.style.left = x + 'px';

      this.setState({
        dragObj: dragObj,
        boardRect: boardRect,
        leftBoard: leftBoard,
        rightBoard: rightBoard,
        currentDragTargetIndex: currentSq,
      });

    }
  }

  renderSquare(i) {
    let highlight = this.state.highlightTargets.indexOf(i) !== -1;

    const dm = this.state.game.darkMoves;
    let hasMoves = (this.state.game.lastRoll && this.state.game.lastRoll.length === 0) ? false :
      (dm && dm[i] && dm[i].length > 0);

    return (<Square
      index={i}
      chips={{dark: (this.state.game.dark[i] || 0), light: (this.state.game.light[i] || 0)}}
      player={this.state.game.currentPlayer}
      onMouseEnter={this.showMoves}
      onMouseLeave={this.hideMoves}
      onMouseDown={this.startDrag}
      onMouseUp={this.stopDrag}
      highlight={highlight}
      hasMoves={hasMoves}
      currentDragTargetIndex={this.state.currentDragTargetIndex}
      rolling={this.state.rolling}
    />);
  }

  render() {
    const status = '';
    // TODO make cover a component
    return (
      <div className='board'>
        <div className={this.state.rolling ? 'cover' : '' }>
          <div>{this.state.rolling ? 'Rolling...' : ''}</div>
        </div>
        <Dice game={this.state.game}/>

        <div id='draggableArea'  onMouseUp={this.stopDrag}>
          <div className="board-section" id="left-board" onMouseMove={this.dragging}>
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
          <div className='bar' id='bar'>&nbsp;</div>
          <div className="board-section" id="right-board" onMouseMove={this.dragging}>
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
        <div className='sep'>&nbsp;</div>

        <div className="board-section">
          <div className="part">
            <Holder />
            <div className='cube'>dcube</div>
            <Holder />
          </div>
        </div>
      </div>
    );
  }
}
