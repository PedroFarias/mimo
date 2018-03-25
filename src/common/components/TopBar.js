import PropTypes from 'prop-types';
import React from 'react';
import {
  Image,
  PixelRatio,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Colors, Heights } from '../util/Constants';

/**
 * Renders a top bar with a left and right icons, which can be enabled
 * and disabled based on props. One may also specify the icons and the
 * callbacks for each icon.
 *
 * The middle is filled with an image of the logo by default, but it can also
 * be overriden with a view provided by the middleView prop. For instance,
 * this is used to implement the SearchBar.
 */
export default class TopBar extends React.PureComponent {
  render() {
    const leftIcon = (
      <Image
        style={[styles.images.leftIcon, this.props.leftStyle]}
        source={this.props.leftIcon}
      />
    );

    const rightIcon = (
      <Image
        style={[styles.images.rightIcon, this.props.rightStyle]}
        source={this.props.rightIcon}
      />
    );

    const middleView = this.props.middleView ? this.props.middleView :
      <Image
        style={styles.images.logo}
        source={this.props.logo}
      />;

    return (
      <View style={[styles.layout.container, this.props.containerStyle]}>
        <TouchableOpacity
          style={styles.layout.leftIcon}
          disabled={!this.props.showLeft}
          onPress={this.props.onLeft}
        >
          { this.props.showLeft ? leftIcon : null }
        </TouchableOpacity>
        <View style={styles.layout.middle}>
          { middleView }
        </View>
        <TouchableOpacity
          style={styles.layout.rightIcon}
          disabled={!this.props.showRight}
          onPress={this.props.onRight}
        >
          { this.props.showRight ? rightIcon : null }
        </TouchableOpacity>
      </View>
    );
  }
}

TopBar.propTypes = {
  leftIcon: PropTypes.number,
  rightIcon: PropTypes.number,
  showLeft: PropTypes.bool,
  showRight: PropTypes.bool,
  onLeft: PropTypes.func,
  onRight: PropTypes.func,
  middleView: PropTypes.object,
  logo: PropTypes.number,
  containerStyle: PropTypes.number,
  leftStyle: PropTypes.number,
  rightStyle: PropTypes.number,
};

TopBar.defaultProps = {
  leftIcon: require('../assets/icons/arrowBack.png'),
  rightIcon: require('../assets/icons/search.png'),
  logo: require('../assets/images/logo.png'),
  showLeft: true,
  showRight: true,
  onLeft: null,
  onRight: null,
  middleView: null,
};

const styles = {
  layout: StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      height: Heights.TopBar,
      width: '100%',
      zIndex: 10,
      elevation: 3,
      backgroundColor: Colors.White,
      borderWidth: 0,
      shadowOffset: {width: 0, height: 0},
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowRadius: 3,
    },
    leftIcon: {
      height: '25%',
      width: '10%',
      justifyContent: 'center',
      alignItems: 'flex-start',
    },
    rightIcon: {
      height: '25%',
      width: '10%',
      justifyContent: 'center',
      alignItems: 'flex-end',
    },
    middle: {
      width: '60%',
      height: '50%',
      alignItems: 'center',
      justifyContent: 'center',
    },
  }),
  images: StyleSheet.create({
    leftIcon: {
      width: '100%',
      height: '100%',
      resizeMode: 'contain',
    },
    logo: {
      height: '100%',
      width: '100%',
      resizeMode: 'contain',
    },
    rightIcon: {
      width: '100%',
      height: '100%',
      resizeMode: 'contain',
    },
  }),
}
