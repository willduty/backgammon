import React from 'react';
import _ from 'lodash';

export default class Dice extends React.Component {

  shouldComponentUpdate(nextProps, nextState) {
    return true;
  }

  render() {
    let dice = [];
    if (this.props.game.lastInitialRoll) {
      const lastInitialRoll = this.props.game.lastInitialRoll,
        lastRoll = this.props.game.lastRoll;

      let used = lastInitialRoll.slice();
      _.each(lastRoll, function(item) {
        used.splice(used.indexOf(item), 1)
      });

      _.each(lastInitialRoll, function(val) {
        const darken = _.includes(used, val);
        if (darken) {
          used.splice(used.indexOf(val), 1);
        }
        dice.push(<div className={'die' + val + ' ' + (darken ? ' darken ' : '')} />)
      })
    }

    return(
      <div className='dice'>
        {dice}
      </div>
    )
  }
}

