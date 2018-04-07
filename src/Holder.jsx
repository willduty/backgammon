import React from 'react';

export default class Holder extends React.Component {

  constructor(props) {
    super(props) 
  }

  render() {
    let className = ['chips'];
    if (this.props.isDropTarget) {
      className.push('drop-target');
    } else if (this.props.highlighted) {
      className.push('highlighted');
    }
    className = className.join(' ');

    // side holder chips
    let chips = [];
    for (var i = 0; i < this.props.count; i++) {
      chips.push(<div className='off-chip' key={i}></div>)
    }

    const divs = []
    for (var i = 0; i < 15; i++) {
      const box =
        <div
          id={'box_off_' + this.props.player + '_' + i}
          className={'box box-off'}
          key={i}>
          {chips[i]}
        </div>
      this.props.index > 11 ? divs.push(box) : divs.unshift(box)
    }

    return (
      <div className='holder'>
        <div ></div>
        <div
          className={className}
          id={this.props.player + '-offboard'}
        >
          <div className='chips-bottom-align'>
            {divs}
          </div>
        </div>
      </div>
    );
  }
}
