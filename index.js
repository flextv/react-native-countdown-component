import React from 'react';
import PropTypes from 'prop-types';

import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  AppState
} from 'react-native';
import _ from 'lodash';
import {sprintf} from 'sprintf-js';

const DEFAULT_TIME_TO_SHOW = ['D', 'H', 'M', 'S'];

class CountDown extends React.Component {
  static propTypes = {
    digitStyle: PropTypes.object,
    digitTextStyle: PropTypes.object,
    labelTextStyle: PropTypes.object,
    timeToShow: PropTypes.array,
    size: PropTypes.number,
    until: PropTypes.number,
    onFinish: PropTypes.func,
    onPress: PropTypes.func,
  };

  state = {
    until: Math.max(this.props.until, 0),
    wentBackgroundAt: null,
  };

  componentDidMount() {
    if (this.props.onFinish) {
      this.onFinish = _.once(this.props.onFinish);
    }
    this.timer = setInterval(this.updateTimer, 1000);
    AppState.addEventListener('change', this._handleAppStateChange);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
    this.timer = null;
    AppState.removeEventListener('change', this._handleAppStateChange);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.until !== nextProps.until) {
      this.setState({
        until: Math.max(nextProps.until, 0)
      });
      if (!this.timer) {
        this.timer = setInterval(this.updateTimer, 1000);
      }
    }
  }

  _handleAppStateChange = currentAppState => {
    const {until, wentBackgroundAt} = this.state;
    if (currentAppState === 'active' && wentBackgroundAt) {
      const diff = (Date.now() - wentBackgroundAt) / 1000.0;
      this.setState({until: Math.max(0, until - diff)});
    }
    if (currentAppState === 'background') {
      this.setState({wentBackgroundAt: Date.now()});
    }
  }

  getTimeLeft = () => {
    const {until} = this.state;
    return {
      seconds: until % 60,
      minutes: parseInt(until / 60, 10) % 60,
      hours: parseInt(until / (60 * 60), 10) % 24,
      days: parseInt(until / (60 * 60 * 24), 10),
    };
  };

  updateTimer = () => {
    const {until} = this.state;

    if (until <= 1) {
      clearInterval(this.timer);
      this.timer = null;
      this.setState({until: 0});
      if (this.onFinish) {
        this.onFinish();
      }
    } else {
      this.setState({until: until - 1});
    }
  };

  renderDigit = (d) => {
    const {digitStyle, digitTextStyle} = this.props;
    return (
      <View style={[
        styles.digitCont,
        digitStyle,
      ]}>
        <Text style={[
          styles.digitTxt,
          digitTextStyle,
        ]}>
          {d}
        </Text>
      </View>
    );
  };

  renderDoubleDigits = (label, digits) => {
    const {labelTextStyle} = this.props;

    return (
      <View style={styles.doubleDigitCont}>
        <View style={styles.timeInnerCont}>
          {this.renderDigit(digits)}
        </View>
        <Text style={[
          styles.timeTxt,
          labelTextStyle,     
        ]}>
          {label}
        </Text>
      </View>
    );
  };

  renderCountDown = () => {
    const {timeToShow} = this.props;
    const {until} = this.state;
    const {days, hours, minutes, seconds} = this.getTimeLeft();
    const newTime = sprintf('%02d:%02d:%02d:%02d', days, hours, minutes, seconds).split(':');
    const Component = this.props.onPress ? TouchableOpacity : View;

    return (
      <Component
        style={styles.timeCont}
        onPress={this.props.onPress}
      >
        {_.includes(timeToShow, 'D') ? this.renderDoubleDigits(this.props['labelD'], newTime[0]) : null}
        {_.includes(timeToShow, 'H') ? this.renderDoubleDigits(this.props['labelH'], newTime[1]) : null}
        {_.includes(timeToShow, 'M') ? this.renderDoubleDigits(this.props['labelM'], newTime[2]) : null}
        {_.includes(timeToShow, 'S') ? this.renderDoubleDigits(this.props['labelS'], newTime[3]) : null}
      </Component>
    );
  };

  render() {
    return (
      <View style={this.props.style}>
        {this.renderCountDown()}
      </View>
    );
  }
}

CountDown.defaultProps = {
  timeToShow: DEFAULT_TIME_TO_SHOW,
  labelD: "Days",
  labelH: "Hours",
  labelM: "Minutes",
  labelS: "Seconds",
  until: 0,
};

const styles = StyleSheet.create({
  timeCont: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  timeTxt: {
    fontSize: 10,
    marginVertical: 2,
  },
  timeInnerCont: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitCont: {
    borderRadius: 5,
    marginHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doubleDigitCont: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitTxt: {
    fontSize: 25,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums']
  },
});

module.exports = CountDown;
