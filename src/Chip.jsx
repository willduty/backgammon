import React from 'react';

export default class Chip extends React.Component{
  constructor(props) {
    super(props)
  }

  handleClick() {
    alert('TODO: handle chip click')
  }

  render() {
    const selectable = this.props.active
    const chipClass = "chip " +
      this.props.type +
      (this.props.parentIndex < 11 ? ' flip180 ' : '') +
      (selectable ? ' selectable ' : '');

    // TODO: hack, figure out a way to not need this
    let top = this.props.offset + (this.props.parentIndex > 11 ? 20 : 0);

    let props = {
      className: chipClass,
      style: {top: top},
      onClick: (() => this.handleClick()),
    }
    if (selectable) {
      props['onMouseEnter'] = (() => this.props.onMouseEnter(this.props.parentIndex))
      props['onMouseLeave'] = (() => this.props.onMouseLeave(this.props.parentIndex))
    }

    return (
      <div
        {...props}
      />
    )
  }
}
