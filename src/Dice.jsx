import React from 'react';
import _ from 'lodash';

export default class Dice extends React.Component {

  shouldComponentUpdate(nextProps, nextState) {
    return true;
  }

  render() {
    let dice = [];
    const lastInitialRoll = this.props.game.lastInitialRoll;
    const lastRoll = this.props.game.lastRoll;

    let className = 'dice'
    if (this.props.showDecision) {
      _.each(this.props.showDecision, function(val, i) {
        dice.push(<div
          key={i}
          className={'die' + val} />)
      });
      className = 'deciding-dice'
    } else if (lastInitialRoll) {
      let used = lastInitialRoll.slice();
      _.each(lastRoll, function(item) {
        used.splice(used.indexOf(item), 1)
      });

      _.each(lastInitialRoll, function(val, i) {
        const darken = _.includes(used, val);
        if (darken) {
          used.splice(used.indexOf(val), 1);
        }

        dice.push(<div
          key={i}
          className={'die' + val + ' ' + (darken ? ' darken ' : '')} />)
      })
    }

    return(
      <div
        className={className}>
        {dice}
      </div>
    )
  }
}

