import React from 'react';
import _ from 'lodash';

export default class Dice extends React.Component {

  shouldComponentUpdate(nextProps, nextState) {
    return true;
  }

  render() {
    let dice = [];
    if (this.props.game.lastRoll) {
      _.each(this.props.game.lastRoll, function(val) {
        dice.push(<div className={'die' + val} />)
      })
    }

    return(
      <div className='dice'>
        {dice}
      </div>
    )
  }
}

