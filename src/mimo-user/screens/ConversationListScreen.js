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

import TopBar from '../components/TopBar';
import SearchBar from '../components/SearchBar';
import { stateManager } from '../state/StateManager';
import { Colors, Heights } from '../util/Constants';
import { getFormattedDate } from '../util/Helpers';

/**
 * Renders a single conversation item, showing the last message received
 * (if any), the time, and styled appropriately depending whether the message
 * has been read or not.
 */
class ConversationItem extends React.Component {
  // Callback triggered when the conversation item is pressed.
  _onPress = () => this.props.onPress(this.props.conversation);

  render() {
    const conversation = this.props.conversation;
    const messages = conversation.messages;
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] :
      null;

    // Show message as read if I'm marked as someone who read it.
    const read = lastMessage == null ||
      stateManager.getUser().uid in lastMessage.readBy;

    // Content and timestamp of the last message, if any.
    let message = '';
    if (lastMessage) {
      if (lastMessage.content.text != null) {
        message = lastMessage.content.text;
        if (lastMessage.sender == 'system') {
          message = '[Mimo]: ' + message;
        }
      } else {
        message = 'Imagem';
      }
    }

    const timestamp = lastMessage ?
      getFormattedDate(lastMessage.timestamp) : '';

    // Employee and store to be displayed as title.
    const user = stateManager.getUser(conversation.employee);
    let userName = '';
    let storeName = '';
    let userPhoto = null;

    if (user != null) {
      userName = user.firstName + ' ' + user.lastName;
      userPhoto =
        <Image
          style={styles.conversation.photo}
          source={{uri: user.photo}}
        />;
      storeName = stateManager.getStore(user.store).name.toUpperCase();
    }

    // Styles depend on whether the last message was read.
    const containerStyle = read ? styles.conversation.container :
      styles.conversation.unreadContainer;
    const storeStyle = read ? styles.conversation.readStore :
      styles.conversation.unreadStore;
    const employeeStyle = read ? styles.conversation.readEmployee :
      styles.conversation.unreadEmployee;
    const textStyle = read ? styles.conversation.readText :
      styles.conversation.unreadText;
    const metaStyle = read ? styles.conversation.readMeta :
      styles.conversation.unreadMeta;

    return (
      <TouchableOpacity onPress={this._onPress}>
        <View style={containerStyle}>
          <View style={styles.conversation.photoView}>
            {userPhoto}
          </View>
          <View style={styles.conversation.textView}>
            <Text numberOfLines={1} style={storeStyle}>
              {storeName}
            </Text>
            <Text numberOfLines={1} style={employeeStyle}>
              {userName}
            </Text>
            <Text numberOfLines={1} style={textStyle}>
              {message}
            </Text>
          </View>
          <View style={styles.conversation.metaView}>
            <Text style={metaStyle}>
              {timestamp}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }
}

/**
 * Renders the list of conversations that are currently active for this user.
 */
export default class ConversationListScreen extends React.Component {
  static navigationOptions = {
    header: null,
  };

  componentWillMount() {
    this.searchText = '';
  }

  componentDidMount() {
    // Register this component to be re-render on state changes.
    stateManager.registerComponent(this);
  }

  componentWillUnmount() {
    stateManager.deregisterComponent(this);
  }

  /**
   * Callback triggered when an item in the list is pressed. This is passed
   * as a prop to the ConversationItem component. It navigates to the
   * conversation screen with the selected conversation.
   */
  _onPressItem = (conversation) => {
    stateManager.markMessagesRead(conversation.uid);

    const user = stateManager.getUser(conversation.employee);
    const navigation = this.props.navigation;

    navigation.navigate('Conversation', {
      cUid: conversation.uid,
      userName: user.firstName + ' ' + user.lastName,
      userPhoto: user.photo,
      messages: conversation.messages,
      canBlock: stateManager.getCurrentUser().role == 'customer',
    });
  }

  /**
   * Callback triggered when the user presses the search button, showing the
   * search bar. It is passed as a prop to the TopBar component.
   */
  _showSearchBar = () => {
    this.searchBar.show();
  }

  /**
   * Callback triggered when the text on the search bar changes. Causes a
   * re-render on the component. It is passed as a prop to the SearchBar
   * component.
   */
  _onSearchChange = (text) => {
    this.searchText = text;
    this.forceUpdate();
  }

  /**
   * Filters the passed in data by name, by looking whether the store name
   * matches a regexp starting with the text in the search bar.
   */
  _filterByName = (data) => {
    let filteredData = data.filter((conversation) => {
      const user = stateManager.getUser(conversation.employee);
      if (user == null) {
        return true;
      }
      const store = stateManager.getStore(user.store);
      return store.name.match(new RegExp('.*' + this.searchText + '.*', 'gi'));
    });

    return filteredData;
  }

  /**
   * Filters the data based on all filters available on the component.
   */
  _filter = (data) => {
    return this._filterByName(data);
  }

  // Renders an item on the list, by using a ConversationItem component.
  _renderItem = ({item}) => {
    return (
      <ConversationItem
        onPress={this._onPressItem}
        conversation={item}
      />
    );
  }

  // Extracts the key from the items in the data array of the list.
  _keyExtractor = (item) => { return item.uid; }

  render() {
    // Sort conversations by their timestamps. It's not very easy, or maybe
    // even possible/desirable, to do this on the StateManager.
    const conversations = this._filter(stateManager.getConversations());
    const cmpFunc = (a, b) => {
      const aMessages = a.messages;
      const bMessages = b.messages;
      const aTimestamp = a.messages.length > 0 ?
        a.messages[a.messages.length - 1].timestamp : 0;
      const bTimestamp = b.messages.length > 0 ?
        b.messages[b.messages.length - 1].timestamp : 0;

      return aTimestamp < bTimestamp;
    }
    conversations.sort(cmpFunc);

    return (
      <View style={styles.layout.container}>
        <TopBar
          showLeft={false}
          onRight={this._showSearchBar}
         />
        <SearchBar
          ref={(searchBar) => this.searchBar = searchBar}
          onChange={this._onSearchChange}
        />
        <View style={styles.layout.list} >
          {conversations.length > 0 ?
            <FlatList
              data={conversations}
              renderItem={this._renderItem}
              keyExtractor={this._keyExtractor}
            />
            :
            <Text style={styles.layout.placeholderText}>
              Você ainda não tem conversas com vendedores.
            </Text>
          }
        </View>
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
    list: {
      paddingTop: 5,
      paddingBottom: 5,
      flex: 1,
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    placeholderText: {
      fontFamily: 'josefin-sans-bold',
      color: Colors.LightGray,
      fontSize: 18,
      textAlign: 'center',
    },
  }),
  conversation: StyleSheet.create({
    unreadContainer: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: Colors.White,
      marginLeft: 20,
      marginRight: 20,
    },
    container: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: Colors.White,
      marginLeft: 20,
      marginRight: 20,
    },
    photoView: {
      width: 80,
      height: 80,
      alignItems: 'center',
      justifyContent: 'center',
    },
    photo: {
      width: 50,
      height: 50,
      borderRadius: 25,
    },
    metaView: {
      width: 80,
      height: 80,
      justifyContent: 'center',
      alignItems: 'center',
    },
    textView: {
      width: '60%',
      justifyContent: 'center',
    },
    readStore: {
      fontFamily: 'josefin-sans',
      fontSize: 14,
      padding: 3,
      paddingLeft: 13,
      color: Colors.Black,
      includeFontPadding: false,
    },
    readEmployee: {
      fontFamily: 'josefin-sans',
      fontSize: 13,
      color: Colors.Black,
      paddingLeft: 13,
      includeFontPadding: false,
    },
    readText: {
      fontFamily: 'josefin-sans-light',
      fontSize: 12,
      padding: 3,
      paddingLeft: 13,
      color: Colors.Gray,
      includeFontPadding: false,
    },
    readMeta: {
      fontFamily: 'josefin-sans-light',
      fontSize: 12,
      padding: 3,
      paddingLeft: 13,
      color: Colors.Gray,
      includeFontPadding: false,
    },
    unreadStore: {
      fontFamily: 'josefin-sans-bold',
      fontSize: 14,
      padding: 3,
      paddingLeft: 13,
      color: Colors.Mimo,
      includeFontPadding: false,
    },
    unreadEmployee: {
      fontFamily: 'josefin-sans-bold',
      fontSize: 13,
      color: Colors.Mimo,
      paddingLeft: 13,
      includeFontPadding: false,
    },
    unreadText: {
      fontSize: 12,
      fontFamily: 'josefin-sans',
      padding: 3,
      paddingLeft: 13,
      color: Colors.Mimo,
      includeFontPadding: false,
    },
    unreadMeta: {
      fontFamily: 'josefin-sans',
      fontSize: 12,
      padding: 3,
      paddingLeft: 13,
      color: Colors.Mimo,
      includeFontPadding: false,
    },
  }),
}
