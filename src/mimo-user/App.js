import { Font, AppLoading, Expo } from 'expo';
import React from 'react';
import { Platform, StyleSheet, View, YellowBox } from 'react-native';
import SafeAreaView from 'react-native-safe-area-view';

import Alert from './components/Alert';
import LoginScreen from './screens/LoginScreen';
import RootNavigator from './navigation/RootNavigator';

import { stateManager } from './state/StateManager';
import { Colors } from './util/Constants';

// Ignores the Firebase SDK related warnings about the timer. They are annoying,
// and not my fault.
YellowBox.ignoreWarnings(['Setting a timer']);

/**
 * Main app component. Runs bootstrap code and render the main navigator.
 */
export default class App extends React.Component {
  componentWillMount() {
    // Indicates whether we are done with basic loading from storage:
    // loading fonts, so on.
    this.ready = false;

    stateManager.initialize({
      server: {
        type: 'firebase',
        role: 'customer',
      },
      userManager: {role: 'customer'},
      storeManager: true,
      mimoManager: {role: 'customer'},
      conversationManager: true,
      pushManager: true,
    });
  }

  componentDidMount() {
    stateManager.registerComponent(this);
  }

  componentWillUnmount() {
    stateManager.deregisterComponent(this);
  }

  /**
   * Loads all the fonts necessary to render the app.
   */
  _loadFonts = async () => {
    return Font.loadAsync({
      'josefin-sans': require('./assets/fonts/JosefinSans-Regular.ttf'),
      'josefin-sans-bold': require('./assets/fonts/JosefinSans-Bold.ttf'),
      'josefin-sans-thin': require('./assets/fonts/JosefinSans-Thin.ttf'),
      'josefin-sans-light': require('./assets/fonts/JosefinSans-Light.ttf'),
    });
  }

  /**
   * Promise used by AppLoading to initialize the app, while showing a
   * splash screen.
   */
  _setUp = async () => {
    await this._loadFonts();
  }

  /**
   * Callback triggered after the app has loaded: user is ready to login, or
   * to start using the app, if it is already logged in.
   *
   * FIXME: Might want to save the login information on disk and retrieve it
   * with AsyncStorage, or something of the sort.
   */
  _onFinishLoading = () => {
    this.ready = true;
    this.forceUpdate();
  }

  /**
   * Callback triggered when the login succeeds.
   */
  _onLogin = async (auth) => {
    await stateManager.login(auth);
  }

  /**
   * Callback triggered when the login attempt has failed. As of now, simply
   * show an alert message.
   */
  _onLoginError = () => {
    this.alert.show();
  }

  render() {
    // While the app loads, show a splash screen. FIXME: Verify whether the
    // splash screen actually shows up.
    if (!this.ready) {
      return (
        <AppLoading
          startAsync={this._setUp}
          onFinish={this._onFinishLoading}
          onError={console.warn}
        />
      );
    }

    if (stateManager.getUser().uid == null) {
      return (
        <SafeAreaView
          style={styles.layout.loginContainer}
          forceInset={{ bottom: 'always', top: 'always' }}
        >
          <LoginScreen
            onLoginError={this._onLoginError}
            onLogin={this._onLogin}
          />
          <Alert
            ref={(ref) => this.alert = ref}
            message={`Não foi possível autenticar as credenciais. Por favor, \
              tente novamente.`}
            title='LOGIN FALHOU'
            alertType='error'
          />
        </SafeAreaView>
      );
    }

    // User is logged in: can safely show the RootNavigator (tabs).
    const forceInset = {
      bottom: 'never',
      top: Platform.OS == 'ios' ? 'always' : 'never',
    };
    return (
      <SafeAreaView
        style={styles.layout.container}
        forceInset={forceInset}
      >
        <RootNavigator />
      </SafeAreaView>
    );
  }
}

const styles = {
  layout: StyleSheet.create({
    container: {
      flex: 1,
    },
    loginContainer: {
      flex: 1,
      backgroundColor: Colors.Mimo,
    },
  }),
};
