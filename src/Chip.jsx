import React from 'react';

export default class Chip extends React.Component{

  render() {
    const selectable = this.props.active
    const chipClass = "chip " +
      this.props.type +
      (this.props.parentIndex < 11 ? ' flip180 ' : '') +
      (selectable ? ' selectable ' : '');

    let props = {
      className: chipClass,
      style: {top: this.props.offset},
    }
    if (selectable) {
      props['onMouseEnter'] = (() => this.props.onMouseEnter(this.props.parentIndex))
      props['onMouseLeave'] = (() => this.props.onMouseLeave(this.props.parentIndex))
      props['onMouseDown'] = ((e) => this.props.onMouseDown(e, this.props.parentIndex))
    }

    return (
      <div
        {...props}
      />
    )
  }
}
