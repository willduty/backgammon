import React from 'react';
import Chip from './Chip';

export default class Square extends React.Component {
  constructor(props) {
    super(props);
  }

  shouldComponentUpdate(nextProps, nextState) {
    const chipsUpdated = this.props.chips.dark !== nextProps.chips.dark ||
      this.props.chips.light !== nextProps.chips.light;
    const highlightChanged = this.props.highlight !== nextProps.highlight;
    const stoppedRolling = this.props.rolling !== nextProps.rolling;
    const isDropTarget = this.props.currentDragTargetIndex === this.props.index;
    return chipsUpdated || highlightChanged || stoppedRolling || isDropTarget || this.props.hasMoves !== nextProps.hasMoves;
  }

  makeChips(count, type) {
    let items = [];
    for (let i=0; i<count; i++) {

      const active =
        (this.props.player === 'dark') && (i === count - 1) && (type === 'chip_dark') && (this.props.hasMoves);

      items.push(
        <Chip
          parentIndex = {this.props.index}
          active = {active}
          type = {type}
          onMouseEnter={this.props.onMouseEnter}
          onMouseLeave={this.props.onMouseLeave}
          onMouseDown={this.props.onMouseDown}
        />
      )
    }
    return items;
  }

  render() {
    // build alternating board spikes
    let classNames = this.props.index > 11 ?
      this.props.index%2 ? ['dark'] : ['light'] :
      (this.props.index%2 ? ['light-bottom'] : ['dark-bottom']);

    if (this.props.highlight) {
      if(this.props.currentDragTargetIndex === this.props.index) {
        classNames.push('dropTargetSquare');
      } else  {
        classNames.push('highlightSquare');
      }
    }

    // basic square class
    classNames.push('square');

    let chips = this.makeChips(this.props.chips.dark, 'chip_dark');
    chips = chips.concat(this.makeChips(this.props.chips.light, 'chip_light'));

    let count, className;
    if (chips.length < 7) {
      count = 7;
      className = 'box box1';
    } else {
      count = chips.length + 1;
      className = 'box box' + (chips.length + 1);
    }

    const divs = []
    for (var i = 0; i < count; i++) {
      const box =
        <div
          id={'box_' + this.props.index + '_' + i}
          className={className}
          key={i}>
          {chips[i]}
        </div>
      this.props.index > 11 ? divs.push(box) : divs.unshift(box)
    }

    const aligner = this.props.index < 12 ? 'bottomer' : '';

    return (
      <div
          className={classNames.join(' ')}
          id={'square_' + this.props.index}
        >
        <div className={aligner}>
          {divs}
        </div>
      </div>
    );
  }
}
