import React from 'react';

export default class Chip extends React.Component{

  render() {
    const selectable = this.props.active
    const chipClass = "chip " +
      this.props.type +
      (selectable ? ' selectable ' : '');

    let props = {
      className: chipClass,
    }

    const isBarChip = this.props.parentIndex === -1 || this.props.parentIndex === 24
    let offset = this.props.offset;
    if (this.props.parentIndex === -1 ) {
      offset += 350;
    } else if (this.props.parentIndex < 12) {
      offset = 550 - this.props.offset;
    } else if (this.props.parentIndex < 24) {

    } else if (this.props.parentIndex === 24) {
      offset += 200;
    }

    props['style'] = {
      top: offset,
      left: isBarChip && 298,
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
