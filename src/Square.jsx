import React from 'react';
import Chip from './Chip';

export default class Square extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: null,
      chips: []
    }
    this.CHIP_SPACING = 40;
    this.MAX_UNSPACED = 250;
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
    for (let i=0; i<count; i++) {

      const active =
        (this.props.player === 'dark') && (i === count - 1) && (type === 'chip_dark') && (this.props.hasMoves);
      const spacing = (count > 6 ? this.MAX_UNSPACED / count : this.CHIP_SPACING);

      this.state.chips.push(
        <Chip
          parentIndex = {this.props.index}
          active = {active}
          offset = {i * spacing}
          type = {type}
          onMouseEnter={this.props.onMouseEnter}
          onMouseLeave={this.props.onMouseLeave}
          onMouseDown={this.props.onMouseDown}
        />
      )
    }
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

    this.state.chips = [];
    this.makeChips(this.props.chips.dark, 'chip_dark');
    this.makeChips(this.props.chips.light, 'chip_light');

    return (
      <div
        className={classNames.join(' ')}
        id={'square_' + this.props.index}
        >
        {this.state.chips}
      </div>
    );
  }
}
