import PropTypes from 'prop-types';
import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Colors } from '../util/Constants';

export default class Alert extends React.Component {
  componentWillMount() {
    this.visible = false;
  }

  show = () => {
    this.visible = true;
    this.forceUpdate();
  }

  _hide = () => {
    this.visible = false;
    this.forceUpdate();
  }

  _onOk = () => {
    this.props.onOk();
    this._hide();
  }

  _onCancel = () => {
    this.props.onCancel();
    this._hide();
  }

  render() {
    const type = this.props.alertType;

    const title = this.props.title ?
      <Text style={styles.title.text}>
        {this.props.title}
      </Text> :
      null;

    const okStyle = type == 'error' ? styles.layout.buttonError :
      styles.layout.buttonOk;

    const okButton = (
      <TouchableOpacity
        style={okStyle}
        onPress={this._onOk}
      >
        <Text style={styles.button.text}>
          OK
        </Text>
      </TouchableOpacity>
    );
    const cancelButton = (
      <TouchableOpacity
        style={styles.layout.buttonCancel}
        onPress={this._onCancel}
      >
        <Text style={styles.button.text}>
          Cancelar
        </Text>
      </TouchableOpacity>
    );

    return (
      <Modal
        animationType='slide'
        transparent={true}
        visible={this.visible}
        onRequestClose={ () => {} }
      >
        <View style={styles.layout.container}>
          <View style={styles.layout.box}>
            <View style={styles.layout.message}>
              {title}
              <Text style={styles.message.text}>
                {this.props.message}
              </Text>
            </View>
            <View style={styles.layout.buttons}>
              {okButton}
              {type == 'okCancel' ? cancelButton : null}
            </View>
          </View>
        </View>
      </Modal>
    );
  }
}

Alert.propTypes = {
  message: PropTypes.string.isRequired,
  buttonType: PropTypes.string,
  buttonText: PropTypes.string,
  onOk: PropTypes.func,
  onCancel: PropTypes.func,
  title: PropTypes.string,
};

Alert.defaultProps = {
  buttonType: 'ok',
  buttonText: 'OK',
  title: null,
  onOk: () => {},
  onCancel: () => {},
}

const styles = {
  layout: StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors.Overlay,
    },
    box: {
      width: 200,
      backgroundColor: Colors.White,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    message: {
      margin: 20,
    },
    buttons: {
      width: '100%',
      height: 40,
      flexDirection: 'row',
      borderBottomLeftRadius: 10,
      borderBottomRightRadius: 10,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonOk: {
      flex: 1,
      height: '100%',
      backgroundColor: Colors.Mimo,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonError: {
      flex: 1,
      height: '100%',
      backgroundColor: Colors.Orange,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonCancel: {
      flex: 1,
      height: '100%',
      backgroundColor: Colors.Orange,
      alignItems: 'center',
      justifyContent: 'center',
    },
  }),
  button: StyleSheet.create({
    text: {
      fontFamily: 'josefin-sans',
      fontSize: 16,
      color: Colors.White,
    },
  }),
  message: StyleSheet.create({
    text: {
      fontFamily: 'josefin-sans-thin',
      fontSize: 14,
      color: Colors.Black,
    },
  }),
  title: StyleSheet.create({
    text: {
      fontFamily: 'josefin-sans-bold',
      fontSize: 18,
      color: Colors.Black,
      marginBottom: 10,
      textAlign: 'center',
    },
  }),
};
