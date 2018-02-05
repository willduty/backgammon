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

  makeChips(count, type) {
    for (let i=0; i<count; i++) {
      const active = (this.props.player == 'dark') && (i == count - 1 ? true : false);
      this.state.chips.push(
        <Chip
          parentIndex = {this.props.index}
          active = {active}
          offset = {(i * 30)}
          type = {type}
        />
      )
    }
  }

  render() {
    // build alternating board spikes
    const spikeType = this.props.index < 12 ?
      this.props.index%2 ? ' dark' : ' light' :
      (this.props.index%2 ? ' light flipvert' : ' dark flipvert');
    const className = 'square ' + this.props.class + spikeType;
    this.makeChips(this.props.chips.dark, 'chip_dark')
    this.makeChips(this.props.chips.light, 'chip_light')
    return (
      <div className={className}>
        {this.state.chips}
      </div>
    );
  }
}
