import React from 'react';

export default class Chip extends React.Component{
  constructor(props) {
    super(props)
  }

  handleClick() {
    alert('TODO: handle chip click')
  }


  render() {
    const chipClass = "chip " +
      this.props.type +
      (this.props.parentIndex > 12 ? ' flip180 ' : '') +
      (this.props.active ? ' selectable ' : '');

    // TODO: hack, figure out a way to not need this
    let top = this.props.offset + (this.props.parentIndex < 12 ? 20 : 0);

    return (
      <div
        className={chipClass}
        style={{top: top}}
         onClick={() => this.handleClick()}
         onMouseEnter={() => this.props.onMouseEnter()}
         onMouseLeave={() => this.props.onMouseLeave()}
        />
    )
  }
}
