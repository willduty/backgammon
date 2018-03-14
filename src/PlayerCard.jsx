import React from 'react';

export default class PlayerCard extends React.Component {

  render() {

    const className = "player-card" + (this.props.active ? ' active' : '');
    return(
      <div className={className}>
        <div><b className='name'>{this.props.playerName}</b></div>
        <span className='pips'>pips: {this.props.pips}</span>
        <div className={'chip chip_' + this.props.playerType}></div>
      </div>
    )
  }
}
