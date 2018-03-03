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

    props['style'] = {
      top: (this.props.parentIndex > -1) ?
        (this.props.parentIndex < 12 ? 550 - this.props.offset : this.props.offset) :
        this.props.offset
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
