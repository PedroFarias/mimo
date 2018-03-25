import PropTypes from 'prop-types';
import React from 'react';
import {
  Animated,
  Image,
  Keyboard,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import TopBar from './TopBar';
import { Colors, Heights } from '../util/Constants';

// TOP is a constant corresponding to the height of the top bar, including its
// shadow (in this case, 3).
const TOP = Heights.TopBar + 5;

/**
 * Renders a search bar, based on the TopBar component implementation.
 */
export default class SearchBar extends React.Component {
  componentWillMount() {
    // Text that is typed in the input text field.
    this.searchText = '';

    // Value used for the animation (going down from the top).
    this.top = new Animated.Value(-TOP);
  }

  /**
   * Callback triggered when the text on the input field changes. Relays the
   * callback to the passed-in prop.
   */
  _onChange = (text) => {
    this.searchText = text;

    this.props.onChange(this.searchText);
    this.forceUpdate();
  }

  /**
   * Callback triggered when the clear button (right icon on search bar) is
   * pressed. Changes the searchText and calls the _onChange callback.
   */
  _clear = () => {
    this.searchText = '';
    this._onChange(this.searchText);
  }

  /**
   * Hides the search bar by animating it up until it goes off the screen.
   */
  _hide = () => {
    Animated.timing(this.top, {
      toValue: -TOP,
      duration: 500,
    }).start();

    Keyboard.dismiss();
  }

  /**
   * Shows the search bar, by animating it down to the very top of the screen.
   */
  show = () => {
    Animated.timing(this.top, {
      toValue: 0,
      duration: 500,
    }).start();

    this.input.focus();
  }

  /**
   * Callback triggered when the back button (left icon on search bar) is
   * pressed. Clears the search input field, and hides the search bar.
   */
  _onClose = () => {
    this._clear();
    this._hide();
  }

  render() {
    const empty = this.searchText.trim().length > 0;

    const middleView = (
      <TextInput
        ref={(input) => this.input = input}
        style={styles.searchBar.input}
        placeholder='Search...'
        underlineColorAndroid='transparent'
        value={this.searchText}
        autoComplete={false}
        autoCapitalize='none'
        onChangeText={this._onChange}
      />
    );

    return (
      <Animated.View style={[styles.layout.container, {top: this.top}]}>
        <TopBar
          leftIcon={require('../assets/icons/arrowBack.png')}
          rightIcon={require('../assets/icons/clear.png')}
          onLeft={this._onClose}
          onRight={this._clear}
          middleView={middleView}
        />
      </Animated.View>
    );
  }
}

const styles = {
  searchBar: StyleSheet.create({
    input: {
      backgroundColor: Colors.White,
      borderWidth: 1,
      borderColor: Colors.VeryLightGray,
      color: Colors.Black,
      fontFamily: 'josefin-sans-light',
      fontSize: 14,
      padding: 5,
      width: '100%',
    },
  }),
  layout: StyleSheet.create({
    container: {
      position: 'absolute',
      zIndex: 10,
      elevation: 3,
      width: '100%',
    },
  }),
}
