import React from 'react';
import {
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Alert from '../components/Alert';
import TopBar from '../components/TopBar';
import Chat from '../components/Chat.js';
import { stateManager } from '../state/StateManager';
import { Colors, Heights } from '../util/Constants';
import { format } from '../util/Helpers';

/**
 * Renders a conversation, showing all messages using the Chat component.
 */
export default class ConversationScreen extends React.Component {
  static navigationOptions = {
    header: null,
  };

  componentDidMount() {
    // Register this component to be re-render on state changes.
    stateManager.registerComponent(this);
  }

  componentWillUnmount() {
    stateManager.deregisterComponent(this);
  }

  componentDidUpdate() {
    // Just rendered again: mark any left-over messages as read.
    const navigation = this.props.navigation;
    const cUid = navigation.state.params.cUid;
    stateManager.markMessagesRead(cUid);
  }

  /**
   * Callback that forces the current StackNavigator to pop back to the
   * previous screen.
   */
  _goBack = () => {
    const navigation = this.props.navigation;
    navigation.goBack();
  }

  /**
   * Callback that prompts the user if he really wants to block the
   * conversation.
   */
  _confirmBlock = () => {
    this.blockAlert.show();
  }

  _block = async () => {
    const navigation = this.props.navigation;
    const cUid = navigation.state.params.cUid;

    await stateManager.blockConversation(cUid);
  }


  render() {
    const params = this.props.navigation.state.params;

    const cUid = params.cUid;
    const userName = params.userName;
    const userPhoto = params.userPhoto;
    const canBlock = params.canBlock;

    const conversation = stateManager.getConversation(cUid);
    const messages = conversation.messages;

    const middleView = (
      <View style={styles.layout.user}>
        <Image
          style={styles.user.photo}
          source={{uri: userPhoto}}
        />
        <Text style={styles.user.name}>
          {userName}
        </Text>
      </View>
    );

    return (
      <View style={styles.layout.container}>
        <TopBar
          showRight={canBlock}
          onRight={canBlock ? this._confirmBlock: () => {}}
          onLeft={this._goBack}
          leftIcon={require('../assets/icons/arrowBackWhite.png')}
          rightIcon={require('../assets/icons/blockWhite.png')}
          middleView={middleView}
          containerStyle={styles.topBar.container}
        />
        <Chat
          cUid={cUid}
          messages={messages}
        />
        <Alert
          ref={(ref) => this.blockAlert = ref}
          message='Você quer mesmo concluir este mimo?'
          title='CONCLUIR MIMO'
          onOk={this._block}
          onCancel={() => {}}
          alertType='okCancel'
        />
      </View>
    );
  }
}

const styles = {
  layout: StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.White,
    },
    user: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      width: '100%',
    },
  }),
  user: StyleSheet.create({
    photo: {
      width: 30,
      height: 30,
      borderRadius: 15,
      marginRight: 10,
    },
    name: {
      fontFamily: 'josefin-sans-bold',
      fontSize: 16,
      color: Colors.White,
      includeFontPadding: false,
    },
  }),
  topBar: StyleSheet.create({
    container: {
      backgroundColor: Colors.Mimo,
    },
  }),
}
