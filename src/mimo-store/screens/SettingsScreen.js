import Expo from 'expo';
import React from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import TopBar from '../components/TopBar';
import { stateManager } from '../state/StateManager';
import { Auth, Colors } from '../util/Constants';
import { logger } from '../util/Logger';

/**
 * Displays a screen where the user can alter his settings. 
 */
export default class LoginScreen extends React.Component {
  static navigationOptions = {
    header: null,
  };

  _logout = async () => {
    await stateManager.logout();
  }

  render() {
    return (
      <View style={styles.layout.container}>
        <TopBar
          showLeft={false}
          showRight={false}
          />
        <View style={styles.layout.content}>
          <TouchableOpacity style={styles.logout.button} onPress={this._logout}>
            <Text style={styles.logout.text}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = {
  layout: StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'space-around',
      backgroundColor: Colors.White,
    },
    logo: {
      width: 200,
      height: 100,
      resizeMode: 'contain',
    },
    content: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  }),
  logout: StyleSheet.create({
    button: {
      height: 70,
      width: 150,
      backgroundColor: Colors.Orange,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      color: Colors.White,
      fontFamily: 'josefin-sans-bold',
      fontSize: 18,
      includeFontPadding: false,
    },
  }),
}
