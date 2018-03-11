import React from 'react';

export default class Holder extends React.Component {

  constructor(props) {
    super(props) 
  }

  render() {
    let className = ['chips'];
		if (this.props.highlighted) {
      className.push('highlighted');
    }
    className = className.join(' ');

    // side holder chips
    let chips = [];
    for (var i = 0; i < this.props.count; i++) {
      chips.push(<div className='off-chip' key={i}></div>)
    }

    return (
      <div className='holder'>
        <div ></div>
        <div
          className={className}
          id={this.props.player + '-offboard'}
        >
          <div className='chips-bottom-align'>
            {chips}
          </div>
        </div>
      </div>
    );
  }
}
