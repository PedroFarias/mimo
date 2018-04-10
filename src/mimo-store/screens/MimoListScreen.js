import React from 'react';
import {
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from 'react-native';
import CheckBox from 'react-native-checkbox';

import CategoryBar from '../components/CategoryBar';
import TopBar from '../components/TopBar';
import SearchBar from '../components/SearchBar';
import { stateManager } from '../state/StateManager';
import { Colors, Heights } from '../util/Constants';
import { getFormattedDate } from '../util/Helpers';

/**
 * Renders a single mimo item, showing the user photo, name, and the message
 * on the mimo. Allows users to accept and reject the mimo.
 */
class MimoItem extends React.Component {
  // Callback triggered when the mimo item is pressed.
  _onPress = () => this.props.onPress(this.props.mimo.uid);
  _onAccept = () => this.props.onAccept(this.props.mimo.uid);
  _onReject = () => this.props.onReject(this.props.mimo.uid);

  render() {
    const mimo = this.props.mimo;
    const customer = stateManager.getUser(mimo.customer);

    let customerName = '';
    let customerPhoto = null;

    if (customer != null) {
      customerName = customer.firstName + ' ' + customer.lastName;
      customerPhoto =
        <Image
          style={styles.mimo.photo}
          source={{uri: customer.photo}}
        />;
    }

    const timestamp = getFormattedDate(mimo.timestamp);
    const message = mimo.message;

    return (
      <TouchableOpacity style={styles.mimo.container} onPress={this._onPress}>
        <View style={styles.mimo.photoView}>
          {customerPhoto}
        </View>
        <View style={styles.mimo.textView}>
          <Text numberOfLines={1} style={styles.mimo.name}>
            {customerName}
          </Text>
          <Text numberOfLines={2} style={styles.mimo.weakText}>
            {message}
          </Text>
        </View>
        <View style={styles.mimo.metaView}>
          <TouchableOpacity
            style={styles.mimo.accept}
            onPress={this._onAccept}
          >
            <Text style={styles.mimo.acceptText}>Aceitar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mimo.reject}
            onPress={this._onReject}
          >
            <Text style={styles.mimo.rejectText}>Rejeitar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }
}

/**
 * Renders the list of mimos that are currently pending for this user,
 * as well as the SearchBar.
 */
export default class MimoListScreen extends React.Component {
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
   * Callback triggered when an item in the list is pressed. This is passed as
   * a prop to the mimoItem component. It navigates to the mimo details
   * screen with the selected mimo, and all necessary parameters.
   */
  _onPressItem = (mUid) => {
    const navigation = this.props.navigation;
    navigation.navigate('MimoDetail', {
      onPress: this._onAccept,
      mUid: mUid,
    });
  }

  /**
   * Callback triggered when a mimo is accepted.
   */
  _onAccept = (mUid) => {
    stateManager.acceptMimo(mUid);
  }

  /**
   * Callback triggered when a mimo is rejected.
   */
  _onReject = (mUid) => {
    stateManager.rejectMimo(mUid);
  }

  _reset = () => {
    this.searchText = '';
    this.forceUpdate();
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
   * Filters the passed in data by name, by looking whether the mimo name
   * matches a regexp starting with the text in the search bar.
   */
  _filterByName = (data) => {
    let filteredData = data.filter((mimo) => {
      const customerName = mimo.customer.firstName + ' ' +
        mimo.customer.lastName;

      return customerName.match(new RegExp('.*' + this.searchText + '.*',
        'gi'));
    });

    return filteredData;
  }

  /**
   * Filters the data based on all filters available on the component.
   */
  _filter = (data) => {
    return this._filterByName(data);
  }

  // Renders an item on the list, by using a mimoItem component.
  _renderItem = ({item}) => {
    return (
      <MimoItem
        onPress={this._onPressItem}
        onAccept={this._onAccept}
        onReject={this._onReject}
        mimo={item}
      />
    );
  }

  // Extracts the key from the items in the data array of the list.
  _keyExtractor = (item) => { return item.uid; }

  render() {
    const mimos = this._filter(stateManager.getPendingMimos());

    const cmpFunc = (a, b) => {
      return a.timestamp < b.timestamp;
    };
    mimos.sort(cmpFunc);

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
        <View style={styles.layout.list}>
          {mimos.length > 0 ?
            <FlatList
              data={mimos}
              renderItem={this._renderItem}
              keyExtractor={this._keyExtractor}
            />
            :
            <Text style={styles.layout.placeholderText}>
              Você ainda não tem nenhum mimo.
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
  mimo: StyleSheet.create({
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
    photo: {
      width: 50,
      height: 50,
      borderRadius: 25,
    },
    name: {
      fontFamily: 'josefin-sans',
      fontSize: 13,
      paddingLeft: 13,
      color: Colors.Black,
      includeFontPadding: false,
    },
    weakText: {
      fontFamily: 'josefin-sans-light',
      fontSize: 12,
      padding: 3,
      paddingLeft: 13,
      color: Colors.Gray,
      includeFontPadding: false,
    },
    accept: {
      backgroundColor: Colors.Mimo,
      justifyContent: 'center',
      alignItems: 'center',
      width: 70,
      height: 30,
      borderRadius: 5,
      padding: 3,
      marginBottom: 3,
    },
    reject: {
      backgroundColor: Colors.Orange,
      justifyContent: 'center',
      alignItems: 'center',
      width: 70,
      height: 30,
      borderRadius: 5,
      padding: 3,
      marginTop: 3,
    },
    acceptText: {
      color: Colors.White,
      fontFamily: 'josefin-sans-bold',
      fontSize: 14,
    },
    rejectText: {
      color: Colors.White,
      fontFamily: 'josefin-sans-bold',
      fontSize: 14,
    },
  }),
}
