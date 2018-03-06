import React from 'react';
import Square from './Square'
import Dice from './Dice'
import Bar from './Bar'
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
    const thing = this.state.game.darkMoves[rolloverIndex]
    let targets = [];
    if(Array.isArray(thing)) {
      targets = thing.map(function(item) {
        return Array.isArray(item) ? item[item.length - 1] : item;
      });
    }
    this.setState({highlightTargets: targets});
  }

  hideMoves() {
    this.setState({highlightTargets: []});
  }

  isBarIndex(i) {
    return i === -1 || i === 24;
  }

  startDrag(event, chipIndex) {
    const dragObjParent = this.isBarIndex(chipIndex)  ?
     document.getElementById('bar-holder-' + this.state.game.currentPlayer) :
     document.getElementById('square_' + chipIndex);

    const chip = _.find(dragObjParent.children, function(e) {
      return e.className.indexOf('selectable') !== -1;
    });

    const dragObjOriginalY = chip.style.top || 0;
    this.setState({
      dragObjOriginalX: chip.style.left,
      dragObjOriginalY: dragObjOriginalY,
      dragObj: chip,
      dragCursorXOffset: dragObjParent.getBoundingClientRect().x - parseInt(event.pageX, 10),
      dragCursorYOffset: parseInt(dragObjOriginalY, 10) - parseInt(event.pageY, 10),
      dragObjParentIndex: chipIndex,
    })
  }

  stopDrag(e) {
    if (this.state.dragObj) {
      const update = this.props.updateGame(this.state.dragObjParentIndex, this.state.currentDragTargetIndex);
      if (!update) {
        const dragObj = this.state.dragObj;
        dragObj.style.top = this.state.dragObjOriginalY;
        dragObj.style.left = this.state.dragObjOriginalX;
      }

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

      // TODO why is this so slow?
      if(this.state.dragObjParentIndex === -1) {
        x -= 300;
      }
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

    const dm = this.state.game.darkMoves; // TODO set this to currentPlayer

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
    const barChipActive = !this.props.rollingText &&
      this.state.game.currentPlayer === 'dark' &&
      this.state.game.darkMoves &&
      this.state.game.darkMoves[-1];

    document.body.onmouseup = this.stopDrag

    // TODO make cover a component
    return (
      <div className='board' >
        <div className={this.props.rollingText ? 'cover' : 'hide' } />
        <div className={this.props.rollingText ? 'rolling' : 'hide'}>
          {this.props.rollingText}
        </div>

        <Dice
          game={this.state.game}
          showDecision={this.props.showDecision}
        />

        <div id='draggableArea' >
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
          <Bar
            bar={this.state.game.bar}
            active={barChipActive}
            onMouseEnter={this.showMoves}
            onMouseLeave={this.hideMoves}
            onMouseDown={this.startDrag}
            onMouseUp={this.stopDrag}
          />
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
