import React from 'react';
import {
  Image,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import Alert from '../components/Alert';
import TopBar from '../components/TopBar';
import { stateManager } from '../state/StateManager';
import { Colors, Heights } from '../util/Constants';

/**
 * Renders the screen to request a mimo, including a multiline text input.
 */
export default class RequestMimoScreen extends React.Component {
  static navigationOptions = {
    header: null,
  };

  componentWillMount() {
    // Text on the input box.
    this.mimoRequestText = '';
  }

  /**
   * Callback that forces the current StackNavigator to pop back to the
   * previous screen.
   */
  _goBack = () => {
    const navigation = this.props.navigation;
    navigation.goBack();
  }

  _onAlertPress = () => {
    const navigation = this.props.navigation;
    const resetStoreList = navigation.state.params.resetStoreList;

    resetStoreList();
    this._goBack();
  }

  /**
   * Callback triggered when the button is pressed. Updates the state via
   * stateManager and shows a friendly alert to indicate that the user's
   * request was sent.
   */
  _onPress = async () => {
    const navigation = this.props.navigation;
    const selectedStores = navigation.state.params.selectedStores;

    const mimo = {
      stores: selectedStores,
      message: this.mimoRequestText,
    };

    // FIXME: What if this fails? Show some message that it failed!
    stateManager.sendMimo(mimo);
    this.alert.show();
  }

  /**
   * Callback triggered when the text input changes. Causes a re-render on this
   * component.
   */
  _onChangeText = (text) => {
    this.mimoRequestText = text;
    this.forceUpdate();
  }

  render() {
    const canSubmit = this.mimoRequestText.trim().length > 0;
    const submitStyle = canSubmit ? styles.layout.submit :
      styles.layout.submitDisabled;

    const placeholder=`Descreva aqui o mimo que você procura. Ex.: vestido \
      longo para festas, de preferência vermelho...`

    return (
      <TouchableWithoutFeedback
        style={styles.layout.container}
        onPress={Keyboard.dismiss}
      >
        <View style={styles.layout.container}>
          <TopBar
            onLeft={this._goBack}
            showRight={false}
          />
          <View style={styles.layout.body}>
            <Image
              style={styles.description.gift}
              source={require('../assets/icons/mimos.png')}
            />
            <Text numberOfLines={2} style={styles.description.text}>
              O que você está procurando?
            </Text>
            <View style={styles.layout.request}>
              <TextInput
                multiline={true}
                style={styles.request.input}
                placeholder={placeholder}
                placeholderTextColor={Colors.Gray}
                onChangeText={this._onChangeText}
                autoCorrect={false}
                autoCapitalize='none'
                underlineColorAndroid='transparent'
              />
            </View>
          </View>
          <TouchableOpacity
            style={submitStyle}
            disabled={!canSubmit}
            onPress={this._onPress}
          >
            <Text style={styles.submit.text}>
              ENVIAR MIMO
            </Text>
          </TouchableOpacity>
          <Alert
            ref={(ref) => this.alert = ref}
            title='MIMO ENVIADO'
            message='Seu mimo foi enviado para nossos vendedores!'
            alertType='ok'
            onOk={this._onAlertPress}
          />
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

const styles = {
  layout: StyleSheet.create({
    container: {
      flex: 1,
    },
    body: {
      flex: 1,
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors.White,
    },
    request: {
      width: '100%',
    },
    submit: {
      height: Heights.BottomButton,
      backgroundColor: Colors.Mimo,
      alignItems: 'center',
      justifyContent: 'center',
      shadowOffset: {width: 0, height: 0},
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowRadius: 3,
    },
    submitDisabled: {
      height: Heights.BottomButton,
      backgroundColor: Colors.LightGray,
      alignItems: 'center',
      justifyContent: 'center',
      shadowOffset: {width: 0, height: 0},
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowRadius: 3,
    }
  }),
  submit: StyleSheet.create({
    text: {
      color: '#fff',
      fontFamily: 'josefin-sans-bold',
      fontSize: 18,
      includeFontPadding: false,
    },
  }),
  description: StyleSheet.create({
    gift: {
      width: 20,
      height: 20,
      resizeMode: 'contain',
    },
    text: {
      width: '40%',
      color: Colors.Mimo,
      fontFamily: 'josefin-sans-bold',
      fontSize: 18,
      textAlign: 'center',
      marginTop: 10,
      includeFontPadding: false,
    },
  }),
  request: StyleSheet.create({
    input: {
      height: 300,
      width: '90%',
      backgroundColor: Colors.White,
      borderColor: Colors.VeryLightGray,
      borderWidth: 2,
      fontFamily: 'josefin-sans-light',
      color: Colors.Black,
      textAlign: 'left',
      textAlignVertical: 'top',
      padding: 10,
      paddingTop: 10,
      paddingBottom: 10,
      margin: 20,
      includeFontPadding: false,
    }
  }),
}
