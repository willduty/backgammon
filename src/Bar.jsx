import React from 'react';
import Chip from './Chip';

export default class Bar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  makeBoxes(count, type) {
    let chips = [];
    const parentIndex = type === 'chip_dark' ? -1 : 24;

    for (let i=0; i<count; i++) {
      const active = this.props.active;
      chips.push(
        <Chip
          key={i}
          parentIndex = {parentIndex}
          active = {(i === count -1) && active && type === 'chip_dark'}
          type = {type}
          onMouseEnter={this.props.onMouseEnter}
          onMouseLeave={this.props.onMouseLeave}
          onMouseDown={this.props.onMouseDown}
        />
      )
    }

    const divs = [];
    for (var i=0; i<15; i++) {
      const box =
        <div
          id={'box_' + parentIndex + '_' + i}
          className='box'
          key={i}>
          {chips[i]}
        </div>
      divs.push(box);
    }
    return divs;
  }

  render () {
    const darkChips = this.makeBoxes(this.props.bar.dark, 'chip_dark');
    const lightChips = this.makeBoxes(this.props.bar.light, 'chip_light');

    return (
      <div className='bar' id='bar'>
        <div/>
        <div
          className='bar-holder-light'
          id='bar-holder-light'>
         <div>{lightChips}</div>
        </div>
        <div
          className='bar-holder-dark'
          id='bar-holder-dark'>
          <div>{darkChips}</div>
        </div>
      </div>
    )
  }
}
