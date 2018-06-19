import _ from 'lodash';
import { TIMEOUT, SHORT_TIMEOUT, LONG_TIMEOUT } from './constants.js'


export default class ChipAnimation {
  constructor(currentPlayer) {
    this.currentPlayer = currentPlayer;
  }

  animateMove(moveSummary, game, callback, path, chip) {
    const move = moveSummary.move;
    const _this = this;
    const startIndex = move[0];
    chip = chip || this.findAnimationChipBox(startIndex, true).firstChild;
    path = path || this.buildPaths(chip, startIndex, moveSummary);

    this.animationInProgress = true;
    if (path.length) {
      let FRAME_RATE, frameInfo = path[0];
      if(frameInfo === 'highlight') {
        FRAME_RATE = 100;
        chip.className = 'chip selectable-light';
      } else if (frameInfo === 'pause') {
        FRAME_RATE = 200;
      } else {
        FRAME_RATE = 15;
        frameInfo.chip.style.left = frameInfo.position[0] + 'px';
        frameInfo.chip.style.top = frameInfo.position[1] + 'px';
        frameInfo.chip.style.zIndex = 1000000;
      }

      path = path.slice(1);
      setTimeout(function() {
        _this.animateMove(moveSummary, game, callback, path, frameInfo.chip);
      }, FRAME_RATE);
    } else {
      //this.setState({game: this.state.game});

      if(this.lastBlotIndex || this.lastBlotIndex === 0) {
        const box = document.getElementById('box_' + this.lastBlotIndex + '_0');
        const chip = box.firstChild;
        chip.style.left = box.style.left;
        chip.style.top = box.style.top;
        chip.style.zIndex = box.style.zIndex;
        this.lastBlotIndex = null;
      }

      this.animationInProgress = false;
      callback();

//      if (game.currentPlayerAutomated()) {
//      if (this.currentPlayer === 'light') {
//        this.doAutomatedMove();
//      } else {
//        if (game.lastRoll.length) {
//          if(!game.canMove()) {
//            this.setState({noMoves: true})
//            setTimeout(this.turnComplete, TIMEOUT);
//          }
//        } else {
//          setTimeout(this.turnComplete, TIMEOUT);
//        }
//      }
    }
  }


  // Returns an array of positions ([x, y]) for the path from container at startIndex to container at targetIndex.
  buildPath(startIndex, targetIndex, isStart) {
    const start = this.findAnimationTarget(startIndex, isStart);
    const end = this.findAnimationTarget(targetIndex, false);
    const diffX = end[0] - start[0];
    const diffY = end[1] - start[1];
    let path = [start.slice()];

    // calculate intermediate points
    const frame_count = 20;
    for (var i = 0; i < frame_count; i++) {
      const last = _.last(path).slice();
      last[0] = start[0] + (diffX / frame_count * i);
      last[1] = start[1] + (diffY / frame_count * i);
      path.push(last);
    }

    path.push(end.slice());
    return path;
  }

  // returns the position ([x, y]) of where a chip should be given targetIndex for a board element
  // if isStart is true, accounts for the chip itself being present, else calculates hypothetical position
  findAnimationTarget(targetIndex, isStart) {
    const boardRect = document.getElementById('board').getBoundingClientRect();
    const chipBox = this.findAnimationChipBox(targetIndex, isStart);
    return [chipBox.getBoundingClientRect().x - boardRect.x,
      chipBox.getBoundingClientRect().y - boardRect.y - (targetIndex === 'off' ? 43 : 0)];
  }

  findAnimationChipBox(targetIndex, isStart) {
    const targetContainer = this.findContainer(targetIndex);
    let boxIds = [];
    const off = (targetIndex === 'off') ? (this.currentPlayer + '_') : '';
    for(let i = 0; i < targetContainer.firstChild.children.length; i++) {
      boxIds.push('box_' + targetIndex + '_' + (off) + i);
    }

    const _this = this;
    let lastBoxIndex = _.findLastIndex(boxIds, function(boxId) {
      const chips = document.getElementById(boxId).children;
      if (targetIndex === 'off') {
        return chips.length;
      } else {
        return chips.length && (chips[0].className.indexOf(_this.currentPlayer) !== -1);
      }
    });

    (!isStart && lastBoxIndex > -1) && lastBoxIndex++;
    (lastBoxIndex === -1) && (lastBoxIndex = 0);

    const lastBox = 'box_' + targetIndex + '_' + off + lastBoxIndex;

    return document.getElementById(lastBox);
  }


  // Returns an array of animation steps for an entire move, including blots moving to bar.
  // Each array item is either an animation step (hash of position and chip)
  // or a directive string like 'highlight' or 'pause'.
  buildPaths(chip, startIndex, moveSummary) {
    const move = moveSummary.move
    let pathPoints = _.flatten([move[0], move[1]]);
    let subMoves = [];
    const _this = this;
    for(var n = 0; n < pathPoints.length - 1; n++) {
      subMoves.push([pathPoints[n], pathPoints[n + 1]]);
    }

    let path = ['highlight'];

    _.each(subMoves, function(fromTo) {
      let pathpoints = _this.buildPath(fromTo[0], fromTo[1], startIndex === fromTo[0]);

      pathpoints = pathpoints.map(function(arr) {
        return {position: arr.slice(), chip: chip};
      }).slice();

      path  = _.concat(path, pathpoints);
      path  = _.concat(path, ['pause']);

      _this.lastBlotIndex = null;

      let blottedChip;
      // if a blot occurs, animate blotted chip to bar
      if (moveSummary.blots && moveSummary.blots.indexOf(fromTo[1]) !== -1) {
        const barIndex = _this.currentPlayer === 'dark' ? 24 : -1;
        pathpoints = _this.buildPath(fromTo[1], barIndex , true);
        const blotContainer = _this.findAnimationChipBox(fromTo[1], true);

        // TODO: bad, render should take care of chip position...
        if (!_this.lastBlotIndex) {
          _this.lastBlotIndex = fromTo[1];
        }

        blottedChip = blotContainer.firstChild;

        pathpoints = pathpoints.map(function(arr) {
          return {position: arr.slice(), chip: blottedChip};
        });

        path  = _.concat(path, pathpoints);
        path  = _.concat(path, ['pause']);
      }
    });
    return path;
  }


  // returns dom element where chips can be placed, based on position index.
  // this will be either a point, a spot on the center bar, or an offboard chip holder.
  findContainer(index) {
    let id;
    if(index > -1 && index < 24) {
      id = 'square_' + index;
    } else if (index === -1) {
      id = 'bar-holder-dark';
    } else if (index === 24) {
      id = 'bar-holder-light';
    } else if (index === 'off') {
      id = 'light-offboard';
    }
    return document.getElementById(id);
  }

}
