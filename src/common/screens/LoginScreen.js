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

import { stateManager } from '../state/StateManager';
import { Auth, Colors } from '../util/Constants';
import { Config } from '../util/Config';
import { logger } from '../util/Logger';

/**
 * Displays a screen where the user can login to the app. Allows Google,
 * Facebook and regular email/password login interfaces.
 *
 * TODO: Implement Facebook and email/password login.
 */
export default class LoginScreen extends React.Component {
  static navigationOptions = {
    header: null,
  };

  /**
   * Callback triggered if login fails.
   */
  _onLoginError = () => this.props.onLoginError();

  /**
   * Callback triggered if login succeeds.
   */
  _onLogin = (auth) => this.props.onLogin(auth);

  /**
   * Callback that triggers a Google login page, and tries to login with
   * the StateManager. If the login is successful, then the state will be
   * updated, and the main app will be re-rendered and not show the login
   * screen anymore.
   *
   * FIXME: Find a way to actually refactor this, and have a message saying
   * that the login failed (either on StateManager or on Google.loginAsync).
   */
  googleSignIn = async () => {
    try {
      const googleAuth = await Expo.Google.logInAsync(Config.Google);

      const auth = {
        type: Auth.Types.Google,
        google: googleAuth,
      };
      this._onLogin(auth);
    } catch (error) {
      logger.error(`Could not login with Google. Error: %s`, error.toString());
      this._onLoginError();
    }
  }

  render() {
    // FIXME: This is currently unused, but I'm keeping it here because it's
    // already styled.
    const signUp = (
      <View style={styles.layout.copyright}>
        <Text style={styles.copyright.text}>Not registered?</Text>
        <Text style={styles.copyright.signUp}>Sign up!</Text>
      </View>
    );

    const emailPassword = (
      <View style={styles.layout.login}>
        <TextInput
          style={styles.login.input}
          placeholder='email'
          autoCapitalize='none'
          underlineColorAndroid='transparent'
        />
        <TextInput
          style={styles.login.input}
          placeholder='password'
          autoCapitalize='none'
          secureTextEntry={true}
          underlineColorAndroid='transparent'
        />
        <View style={styles.login.button}>
          <Text style={styles.login.buttonText}>login</Text>
        </View>
      </View>
    );

    const facebook = (
      <Image
        style={styles.social.facebookSignIn}
        source={require('../assets/images/facebook_signin.png')}
      />
    );

    return (
      <View style={styles.layout.container}>
        <Image
          style={styles.layout.logo}
          source={require('../assets/images/logo_white.png')}
        />
        <Text style={styles.slogan.text}>
          Seu ponto de contato com suas marcas favoritas.
        </Text>
        <View style={styles.layout.social}>
          <TouchableOpacity
            onPress={this.googleSignIn}>
            <Image
              style={styles.social.googleSignIn}
              source={require('../assets/images/google_signin.png')}
            />
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
      backgroundColor: Colors.Mimo,
      alignItems: 'center',
      justifyContent: 'space-around',
    },
    logo: {
      width: 200,
      height: 100,
      resizeMode: 'contain',
    },
    login: {
      width: '100%',
      alignItems: 'center',
    },
    social: {
      alignItems: 'center',
    },
    copyright: {
      height: '10%',
    },
  }),
  copyright: StyleSheet.create({
    text: {
      fontSize: 14,
      fontFamily: 'josefin-sans',
      color: Colors.White,
      textAlign: 'center',
      padding: 5,
    },
    signUp: {
      fontSize: 14,
      fontFamily: 'josefin-sans-bold',
      color: Colors.DarkBlue,
      textAlign: 'center',
    },
  }),
  login: StyleSheet.create({
    input: {
      width: '70%',
      borderRadius: 3,
      backgroundColor: Colors.White,
      fontSize: 14,
      fontFamily: 'josefin-sans-light',
      color: Colors.Black,
      textAlign: 'center',
      padding: 9,
      margin: 4,
    },
    button: {
      width: '70%',
      borderRadius: 3,
      backgroundColor: Colors.DarkBlue,
      margin: 5,
      marginTop: 12,
    },
    buttonText: {
      fontSize: 14,
      fontFamily: 'josefin-sans-bold',
      color: Colors.White,
      textAlign: 'center',
      padding: 9,
    },
  }),
  social: StyleSheet.create({
    googleSignIn: {
      width: 200,
      height: 50,
      resizeMode: 'contain',
      borderRadius: 10,
      margin: 5,
    },
    facebookSignIn: {
      width: 196,
      height: 40,
      resizeMode: 'contain',
      borderRadius: 10,
      margin: 5,
    },
  }),
  slogan: StyleSheet.create({
    text: {
      fontFamily: 'josefin-sans-bold',
      fontSize: 22,
      textAlign: 'center',
      color: Colors.White,
      width: '70%',
    },
  }),
}
