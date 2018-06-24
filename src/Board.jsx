import React from 'react';
import Square from './Square'
import Dice from './Dice'
import Bar from './Bar'
import Holder from './Holder'
import _ from 'lodash';
import PlayerCard from './PlayerCard';

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
    const targets = this.state.game.currentPlayerTargets(rolloverIndex);
    const _this = this;

    this.props.ifNoAnimation(function(){
       _this.setState({highlightTargets: targets});
    });
  }

  hideMoves() {
    const _this = this;
    this.props.afterAnimation().then(function() {
      _this.setState({
        highlightTargets: []
      });
    });
  }

  startDrag(event, chipIndex) {
    const game = this.state.game;
    const dragObjParent = game.isBarIndex(chipIndex) ?
      document.getElementById('bar-holder-' + game.currentPlayer) :
      document.getElementById('square_' + chipIndex);

    const chips = _.map(dragObjParent.firstChild.children, function(e) {
      return e.firstChild
    });
    const chip = _.find(chips, function(e) {
      return e && e.className.indexOf('selectable') !== -1;
    });

    this.boardRect = document.getElementById('draggableArea').getBoundingClientRect();

    this.setState({
      dragObj: chip,
      dragCursorXOffset: event.pageX - chip.getBoundingClientRect().x,
      dragCursorYOffset: event.pageY - chip.getBoundingClientRect().y,
      dragObjParentIndex: chipIndex,
    });
  }

  stopDrag(e) {
    if (this.state.dragObj) {
      const update = (typeof this.state.currentDragTargetIndex === 'undefined') ? null :
        this.props.updateGame(this.state.dragObjParentIndex, this.state.currentDragTargetIndex);

      if (!update) {
        const dragObj = this.state.dragObj;
        const parent = dragObj.parentElement;
        if (parent) {
          dragObj.style.top = parent.style.top;
          dragObj.style.left = parent.style.left;
          dragObj.style.zIndex = null;
        }
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
    if (!this.state.dragObj) return;

    const leftBoard = this.leftBoard || document.getElementById('left-board').getBoundingClientRect(),
      rightBoard = this.rightBoard || document.getElementById('right-board').getBoundingClientRect(),
      currOffboard = this.currOffboard ||
        document.getElementById(this.state.game.currentPlayer + '-offboard').getBoundingClientRect(),
      mouseY = Math.floor((e.pageY - this.boardRect.y) / 300);

    let currentSq, upper = (mouseY < 1);
    if(rightBoard.x < e.pageX && rightBoard.x + rightBoard.width > e.pageX) {
      const pos = upper ? (e.pageX - rightBoard.left) : (rightBoard.right - e.pageX);
      currentSq = Math.floor(pos / this.SQUARE_WIDTH) + (upper ? 18 : 0);
    } else if (leftBoard.x < e.pageX && leftBoard.x + leftBoard.width > e.pageX) {
      const pos = upper ? (e.pageX - leftBoard.left) : (leftBoard.right - e.pageX);
      currentSq = Math.floor(pos / this.SQUARE_WIDTH) + (upper ? 12 : 6);
    } else if (currOffboard.x < e.pageX && currOffboard.x + currOffboard.width > e.pageX) {
      currentSq = 'off';
    }

    let x = e.pageX - this.boardRect.x - this.state.dragCursorXOffset;
    let y = e.pageY - this.boardRect.y - this.state.dragCursorYOffset;

    let dragObj = this.state.dragObj;
    dragObj.style.zIndex = 100000;
    dragObj.style.left = x + 'px';
    dragObj.style.top = y + 'px';

    this.setState({
      dragObj: dragObj,
      currentDragTargetIndex: currentSq,
    });
  }

  renderSquare(i) {
    const game = this.state.game;
    return (<Square
      index={i}
      chips={
        {
          dark: (game.chipsAt('dark', i)),
          light: (game.chipsAt('light', i))
        }
      }
      player={game.currentPlayer}
      onMouseEnter={this.showMoves}
      onMouseLeave={this.hideMoves}
      onMouseDown={this.startDrag}
      onMouseUp={this.stopDrag}
      onDoubleClick={this.props.animatePlayerClick}
      highlight={this.state.highlightTargets.indexOf(i) !== -1}
      hasMoves={game.canMove(i)}
      currentDragTargetIndex={this.state.currentDragTargetIndex}
      rolling={this.state.rolling}
    />);
  }

  render() {
    const game = this.state.game;
    const barChipActive = !this.props.coverText &&
      game.playerHasBarMove('dark');
    const darkPlayer = game.currentPlayer === 'dark',
      canOffboard = this.state.highlightTargets.indexOf('off') !== -1,
      holderHover = this.state.currentDragTargetIndex === 'off';

    // Undo button only shown if player is partway through move.
    let undoClass;
    if(game.gameActive()
      && game.currentPlayer === 'dark'
      && game.lastRoll.length > 0
      && game.lastRoll.length !== game.lastInitialRoll.length
      ) {
      undoClass = 'undo';
    } else {
      undoClass = 'hide';
    }

    document.body.onmouseup = this.stopDrag;
    document.body.onmousemove = this.dragging;

    // TODO componentize buttons

    return (
      <div
        className='board'
        id='board'
        onContextMenu={function(e) {
          e.preventDefault();
        }}
      >
      <div className={this.props.showCover ? 'cover' : 'hide'} />
      <div className={this.props.showCover ? 'cover-text' : 'hide'}>
        {this.props.startButton ?
          [
            (!this.props.nextGameButton && this.props.resumeButton &&
            <div
              className='cover-button'
              onClick={() => this.props.handleStartGame(true)}
              key='resume-button'>
              Resume Game..
            </div>
            ),
            (this.props.nextGameButton &&
            <div
              className='cover-button'
              onClick={() => this.props.handleStartGame(true)}
              key='next-game-button'>
              Next Game..
            </div>
            ),
            (this.props.startButton &&
            <div
              className='cover-button'
              onClick={() => this.props.handleStartGame()}
              key='start-game-button'>
              {(this.props.resumeButton || this.props.nextGameButton) ? 'Start New Series' : 'Start Game..' }
            </div>
            ),
          ]
          : this.props.coverText}
        </div>

        <Dice
          game={game}
          showDecision={this.props.showDecision}
          clearDice={this.props.clearDice}
        />

        <div id='draggableArea' >
          <div className="board-section" id="left-board">
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
            bar={game.bar()}
            active={barChipActive}
            onMouseEnter={this.showMoves}
            onMouseLeave={this.hideMoves}
            onMouseDown={this.startDrag}
            onMouseUp={this.stopDrag}
            onDoubleClick={this.props.animatePlayerClick}
          />
          <div className="board-section" id="right-board">
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

        <div className='sep no-select'>&nbsp;</div>

        <div className="board-section">
          <div className="part">
            <Holder
              highlighted={darkPlayer && canOffboard}
              isDropTarget={darkPlayer && holderHover && canOffboard}
              count={game.darkOff}
              player='dark'
            />
            <div className='cube'>dcube</div>
            <Holder
              highlighted={!darkPlayer && canOffboard}
              isDropTarget={!darkPlayer && holderHover}
              count={game.lightOff}
              player='light'
            />
          </div>
        </div>

        <div className='sep no-select'>&nbsp;</div>

        <div className="player-cards">
          <PlayerCard
            playerName='Player'
            pips={game.pips('dark')}
            playerType='dark'
            active={game.currentPlayer === 'dark'}
            score={this.props.tally.dark + ' / ' + this.props.tally.target}
          />
          <PlayerCard
            playerName='Computer'
            pips={game.pips('light')}
            playerType='light'
            active={game.currentPlayer === 'light'}
            score={this.props.tally.light + ' / ' + this.props.tally.target}
          />
          <button
            className={undoClass}
            onClick={this.props.undoLastMove}
          >
            undo
          </button>
        </div>

      </div>
    );
  }
}
