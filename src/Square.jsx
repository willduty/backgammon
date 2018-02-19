import React from 'react';
import Chip from './Chip';

export default class Square extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: null,
      chips: []
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    const chipsUpdated = this.props.chips.dark !== nextProps.chips.dark ||
      this.props.chips.light !== nextProps.chips.light;
    const highlightChanged = this.props.highlight !== nextProps.highlight;
    const stoppedRolling = this.props.rolling !== nextProps.rolling;
    return chipsUpdated || highlightChanged || stoppedRolling;
  }

  makeChips(count, type) {
    for (let i=0; i<count; i++) {
      const active = (this.props.player === 'dark') && (i === count - 1) && (type === 'chip_dark');
      this.state.chips.push(
        <Chip
          parentIndex = {this.props.index}
          active = {active}
          offset = {(i * 30)}
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
    const spikeType = this.props.index > 11 ?
      this.props.index%2 ? ' dark' : ' light' :
      (this.props.index%2 ? ' light flipvert' : ' dark flipvert');

    const highlight = this.props.highlight ? ' highlightSquare ' : '';
    const className = 'square ' + spikeType + highlight;

    this.state.chips = [];
    this.makeChips(this.props.chips.dark, 'chip_dark');
    this.makeChips(this.props.chips.light, 'chip_light');

    return (
      <div className={className} id={'square_' + this.props.index}>
        {this.state.chips}
      </div>
    );
  }
}
