import { ImagePicker } from 'expo';
import PropTypes from 'prop-types';
import React from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ViewPropTypes,
  View,
} from 'react-native';

import {
  Bubble,
  Day,
  GiftedChat,
} from 'react-native-gifted-chat';

import TopBar from '../components/TopBar';
import { stateManager } from '../state/StateManager';
import { Colors, Heights } from '../util/Constants';
import Actions from './Actions';

/**
 * The send button component. The code here is very similar to what is already
 * present in GiftedChat's Send, but we allow an icon to show up if the text
 * is empty (the second child to the Send object).
 */
class Send extends React.Component {
  _onSend = () => {
    this.props.onSend({text: this.props.text.trim()}, true);
  }

  render() {
    const childIfText = this.props.children ? this.props.children[0] : null;
    const childIfEmpty = this.props.children ? this.props.children[1] : null;
    const canSend = this.props.text.trim().length > 0;

    const child = canSend ? childIfText : childIfEmpty;
    const label = canSend ?
      <Text style={[styles.send.text, this.props.textStyle]}>
        {this.props.label}
      </Text> : null;

    return (
      <TouchableOpacity
        style={[styles.send.container, this.props.containerStyle]}
        onPress={this._onSend}
        disabled={!canSend}
      >
        { child !== null ? child : label }
      </TouchableOpacity>
    );
  }
}

/**
 * Display a system message in the conversation.
 */
class SystemMessage extends React.Component {
  render() {
    const message = this.props.currentMessage;
    const title = message.title;
    const text = message.text;

    const titleView = title ?
      <Text style={[styles.system.title, this.props.titleStyle]}>
        {title}
      </Text>
      : null;

    return (
      <View style={[styles.system.container, this.props.containerStyle]}>
        <View style={[styles.system.wrapper, this.props.wrapperStyle]}>
          {titleView}
          <Text style={[styles.system.text, this.props.textStyle]}>{text}</Text>
        </View>
      </View>
    );
  }
}

/**
 * Custom actions show up when the user presses "+"; it allows access to the
 * camera and to the photo library.
 */
class CustomActions extends React.Component {
  /**
   * Callback triggered when an image is chosen from the library.
   */
  _onLibrary = (image) => this.props.onLibrary(image);

  /**
   * Callback triggered when an image is taken by the camera.
   */
  _onCamera = (image) => this.props.onCamera(image);

  onActionsPress = () => {
    const options = ['Camera', 'Choose From Library', 'Cancel'];
    const cancelButtonIndex = options.length - 1;

    this.context.actionSheet().showActionSheetWithOptions({
      options,
      cancelButtonIndex,
    },
    (buttonIndex) => {
      switch (buttonIndex) {
        case 0:
          this._showCamera();
          break;
        case 1:
          this._showLibrary();
          break;
        default:
          break;
      }
    });
  }

  /**
   * Callback triggered when user requests the library.
   */
  _showLibrary = async () => {
    let image = await ImagePicker.launchImageLibraryAsync({
      allowsEditting: false,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      base64: true,
    });
    if (image != null && image.uri != null) {
      this._onLibrary(image.uri);
    }
  }

  /**
   * Callback triggered when user requests the camera.
   */
  _showCamera = async () => {
    let image = await ImagePicker.launchCameraAsync({
      allowsEditting: false,
      quality: 0.5,
      base64: true,
    });
    if (image != null && image.uri != null) {
      this._onCamera(image.uri);
    }
  }

  render() {
    if (Platform.OS === 'ios') {
      /*
       * By default icon is a circle with a "+" inside; if an icon is specified,
       * show it instead.
       */
      const icon = this.props.icon ? this.props.icon :
        <View style={[styles.wrapper, this.props.wrapperStyle]}>
          <Text style={[styles.iconText, this.props.iconTextStyle]}>
            +
          </Text>
        </View>;

      return (
        <TouchableOpacity
          style={[styles.container, this.props.containerStyle]}
          onPress={this.onActionsPress}
        >
          {icon}
        </TouchableOpacity>
      );
    }

    const options = {
      'Camera': () => { this._showCamera() },
      'Choose from Library': () => { this._showLibrary() },
      'Cancel': () => {},
    };

    return (
      <Actions {...this.props}
        options={options}
      />
    );
  }
}

export default class Chat extends React.Component {
  /**
   * TODO: FIXME: This is a hack.
   */
  onSend = (messages) => {
    content = {text: messages[0].text};
    let readBy = {};
    readBy[stateManager.getUser().uid] = true;

    const message = {
      content: content,
      sender: stateManager.getUser().uid,
      readBy: readBy,
    }

    stateManager.sendMessage(this.props.cUid, message);
  }

  /**
   * Callback triggered when an image is chosen from the library.
   */
  _onLibrary = async (uri) => {
    content = {image: uri};
    let readBy = {};
    readBy[stateManager.getUser().uid] = true;

    const message = {
      content: content,
      sender: stateManager.getUser().uid,
      readBy: readBy,
      timestamp: stateManager.getTimestamp(),
    }

    stateManager.sendMessage(this.props.cUid, message);
  }

  /**
   * Callback triggered when an image is chosen from the camera.
   */
  _onCamera = async (uri) => {
    content = {image: uri};
    let readBy = {};
    readBy[stateManager.getUser().uid] = true;

    const message = {
      content: content,
      sender: stateManager.getUser().uid,
      readBy: readBy,
      timestamp: stateManager.getTimestamp(),
    }

    stateManager.sendMessage(this.props.cUid, message);
  }

  /**
   * Renders the custom actions: if we are on iOS, we use the CustomActions
   * component above; otherwise, we just use Android's Actions.
   */
  renderCustomActions = (props) => {
    return (
      <CustomActions
        {...props}
        onCamera={this._onCamera}
        onLibrary={this._onLibrary}
      />
    );
  }

  /**
   * Renders message bubbles.
   */
  renderBubble = (props) => {
    return <Bubble {...props} wrapperStyle={styles.bubble} />;
  }

  /**
   * Renders the day the message was received, if appropriate.
   */
  renderDay = (props) => {
    return <Day {...props} textStyle={styles.day.text} />;
  }

  /**
   * Renders the send button, with the desired images.
   */
  renderSend = (props) => {
    return (
      <Send {...props}>
        <Image
          source={require('../assets/icons/send.png')}
          style={styles.send.icon}
        />
        <Image
          source={require('../assets/icons/sendGray.png')}
          style={styles.send.icon}
        />
      </Send>
    );
  }

  /**
   * Renders a system message, usually a notification that a new mimo has been
   * added to the conversation.
   */
  renderSystemMessage = (props) => {
    return (
      <SystemMessage {...props}/>
    );
  }

  render() {
    let offset = Platform.OS == 'ios' ? Heights.iOSTabBar :
      Heights.androidTabBar;

    // This comparison function leaves invalid timestamps as the very last
    // messages; this is expected in case we can't connect to the server,
    // for instance.
    const cmpFunc = (a, b) => {
      return isNaN(b.timestamp) ? 1 : a.timestamp > b.timestamp;
    };

    // Converts the messages from the state manager to whatever the GiftedChat
    // module expects. Annoying, but I really don't want to tie the StateManager
    // to GiftedChat by any means.
    const giftMessages = this.props.messages.map((message) => {
      const createdAt = message.timestamp;

      const formattedMessage = {
        _id: message.uid,
        createdAt: createdAt,
        text: message.content.text,
        image: message.content.image,
        title: message.content.title,
      };

      // Add either system or user information.
      if (message.sender == 'system') {
        formattedMessage.system = true;
      } else {
        formattedMessage.user = {
          _id: message.sender,
        };
      }

      return formattedMessage;
    }).sort(cmpFunc).reverse();

    return (
      <GiftedChat
        messages={giftMessages}
        onSend={this.onSend}
        onReceive={this.onReceive}

        user={{_id: stateManager.getUser().uid}}

        renderBubble={this.renderBubble}
        renderSystemMessage={this.renderSystemMessage}
        renderDay={this.renderDay}
        renderActions={this.renderCustomActions}
        renderSend={this.renderSend}
        renderAvatar={null}

        imageStyle={{resizeMode: 'cover'}}
        lightboxProps={{springConfig: { speed: 80, overshootClamping: true }}}

        forceGetKeyboardHeight={true}
        bottomOffset={0}
        autoCapitalize='none'
        autoComplete={false}
      />
    );
  }
}

const styles = {
  bubble: StyleSheet.create({
    left: {
      backgroundColor: Colors.VeryLightGray,
      padding: 2,
    },
    right: {
      backgroundColor: Colors.Mimo,
      padding: 2,
    },
  }),
  day: StyleSheet.create({
    text: {
      color: Colors.Black,
    }
  }),
  footerContainer: {
    marginTop: 5,
    marginLeft: 10,
    marginRight: 10,
    marginBottom: 10,
  },
  footerText: {
    fontSize: 14,
    color: '#aaa',
  },
  container: {
    width: 26,
    height: 26,
    marginLeft: 10,
    marginBottom: 10,
  },
  wrapper: {
    borderRadius: 13,
    borderColor: '#b2b2b2',
    borderWidth: 2,
    flex: 1,
  },
  iconText: {
    color: '#b2b2b2',
    fontWeight: 'bold',
    fontSize: 16,
    backgroundColor: 'transparent',
    textAlign: 'center',
  },
  send: StyleSheet.create({
    container: {
      height: 44,
      justifyContent: 'flex-end',
    },
    text: {
      color: '#0084ff',
      fontWeight: '600',
      fontSize: 17,
      backgroundColor: 'transparent',
      marginBottom: 12,
      marginLeft: 10,
      marginRight: 10,
    },
    icon: {
      width: 26,
      height: 26,
      resizeMode: 'center',
      marginRight: 10,
      marginBottom: 10,
    },
  }),
  modal: StyleSheet.create({
    container: {
      flex: 1,
      marginTop: Heights.StatusBar,
    },
    topBar: {
      shadowRadius: 0,
      shadowColor: Colors.White,
    },
    done: {
      width: 40,
      height: 20,
    },
    middleViewContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontFamily: 'josefin-sans-bold',
      fontSize: 18,
      color: Colors.Mimo,
    },
  }),
  system: StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      marginTop: 5,
      marginBottom: 10,
    },
    wrapper: {
      padding: 10,
      backgroundColor: Colors.DarkBlue,
      borderRadius: 5,
    },
    title: {
      color: Colors.White,
      fontSize: 12,
      marginBottom: 3,
      fontWeight: '900',
      textAlign: 'center',
    },
    text: {
      color: Colors.White,
      fontSize: 12,
      textAlign: 'center',
    },
  }),
}

CustomActions.contextTypes = {
  actionSheet: PropTypes.func,
};

CustomActions.defaultProps = {
  onSend: () => {},
  options: {},
  icon: null,
  containerStyle: {},
  wrapperStyle: {},
  iconTextStyle: {},
};

CustomActions.propTypes = {
  onSend: PropTypes.func,
  options: PropTypes.object,
  icon: PropTypes.func,
  containerStyle: ViewPropTypes.style,
  wrapperStyle: ViewPropTypes.style,
  iconTextStyle: Text.propTypes.style,
};
