import React from 'react';
import Chip from './Chip';

export default class Square extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: null,
    }
  }

  render() {
    const type = this.props.index < 12 ?
      this.props.index%2 ? ' dark' : ' light' :
      (this.props.index%2 ? ' light flipvert' : ' dark flipvert');
    const className = "square " + this.props.class + type;

    let chips = [];
    for (let i=0; i<1; i++) {
      chips.push(
        <Chip
        parentIndex = {this.props.index}
        style={{bottom: 40}}
        />
      )
    }
    return (
      <div className={className} onClick={() => this.props.onClick()}>
        {chips}
      </div>
    );
  }
}
