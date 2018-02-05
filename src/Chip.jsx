import React from 'react';

export default class Chip extends React.Component{
  constructor(props) {
    super(props)
  }

  render() {
    const chipClass = "chip " +
      (Math.random() > .5 ? 'chip_light ' : 'chip_dark ' +
      (this.props.parentIndex < 12 ? ' flip180' : '')) ;

    return (
      <div className={chipClass} />
    )
  }

}