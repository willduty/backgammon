import React from 'react';
import Chip from './Chip';

export default class Bar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};

    this.CHIP_SPACING = 10;
  }

  makeChips(count, type) {
    let chips = [];
    for (let i=0; i<count; i++) {

      const active = this.props.active;

     // TODO send 24 back for white bar chip
      const spacing = 10;
      chips.push(
        <Chip
          parentIndex = {-1}
          active = {(i === count -1) && active}
          offset = {i * this.CHIP_SPACING}
          type = {type}
          onMouseEnter={this.props.onMouseEnter}
          onMouseLeave={this.props.onMouseLeave}
          onMouseDown={this.props.onMouseDown}
        />
      )
    }
    return chips;
  }

  render () {
    const darkChips = this.makeChips(this.props.bar.dark, 'chip_dark');
    const lightChips = this.makeChips(this.props.bar.light, 'chip_light');

    return (
      <div className='bar' id='bar'>
        <div
          className='bar-holder-light'
          id='bar-holder-light'>
         {lightChips}

        </div>
        <div
          className='bar-holder-dark'
          id='bar-holder-dark'>
          {darkChips}
        </div>
      </div>
    )
  }
}
