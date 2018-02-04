import React from 'react';

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
    const chipClass = "chip " + (Math.random() > .5 ? "chip_light" : "chip_dark");

    return (
      <div className={className} onClick={() => this.props.onClick()}>
        {this.props.value}
        <div className={chipClass} />
      </div>
    );
  }
}
