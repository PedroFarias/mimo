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

/**
 * Renders a single store item, showing the logo, name and categories. Also
 * shows a checkbox that can be toggled to select this store (as one of the
 * stores to which the memo will be sent). Styles the item appropriately.
 */
class StoreItem extends React.Component {
  // Callback triggered when the store item is pressed.
  _onPress = () => this.props.onPress(this.props.store.uid);

  // Callback triggered when the checkbox is toggled.
  _onToggle = () => this.props.onToggle(this.props.store.uid);

  render() {
    const store = this.props.store;

    return (
      <TouchableOpacity style={styles.store.container} onPress={this._onPress}>
        <Image style={styles.store.logo} source={{uri: store.logo}} />
        <View style={styles.store.description}>
          <Text style={styles.store.name}>
            {store.name.toUpperCase()}
          </Text>
          <Text style={styles.store.weakText}>
            {store.categories.join(', ')}
          </Text>
          <Text style={styles.store.weakText}>
            {store.address.city}
          </Text>
        </View>
        <CheckBox
          label=''
          disabled={this.props.disabled}
          checkboxStyle={styles.store.checkbox}
          checked={this.props.selected}
          checkedImage={require('../assets/icons/checked.png')}
          uncheckedImage={require('../assets/icons/unchecked.png')}
          onChange={this._onToggle}
        />
      </TouchableOpacity>
    );
  }
}

/**
 * Renders the list of conversations that are currently active for this user,
 * as well as the SearchBar and the CategoryBar.
 *
 * Keeps track of the current category and current search filters, and shows
 * data based on them.
 */
export default class StoreListScreen extends React.Component {
  static navigationOptions = {
    header: null,
  };

  componentWillMount() {
    this.selectedStores = {};
    this.searchText = '';
    this.category = null;
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
   * a prop to the StoreItem component. It navigates to the store details
   * screen with the selected store, and all necessary parameters.
   */
  _onPressItem = (sUid) => {
    const navigation = this.props.navigation;
    navigation.navigate('StoreDetails', {
      sUid: sUid,
      onPress: this._onToggle,
      selected: sUid in this.selectedStores,
    });
  }

  /**
   * Callback triggered when the checkbox is toggled. This is passed as a prop
   * to the StoreItem component. It changes the internal state of this
   * component to keep track of which stores have been selected and which
   * ones have not. Causes a re-render on the component.
   */
  _onToggle = (sUid) => {
    console.log(Object.keys(this.selectedStores));
    // Deal with the mimo salesperson case separately.
    if (sUid == '-') {
      if ('-' in this.selectedStores) {
        delete this.selectedStores['-'];
        this.forceUpdate();
        return;
      }

      for (let store of Object.keys(this.selectedStores)) {
        delete this.selectedStores[store];
      }
      this.selectedStores['-'] = true;
      this.forceUpdate();
      return;
    }

    if ('-' in this.selectedStores) {
      delete this.selectedStores['-'];
      this.selectedStores[sUid] = true;

      this.forceUpdate();
      return;
    }

    // Regular case: flip the selection property.
    if (sUid in this.selectedStores) {
      delete this.selectedStores[sUid];
    } else {
      this.selectedStores[sUid] = true;
    }
    this.forceUpdate();
  }

  _reset = () => {
    this.selectedStores = {};
    this.category = null;
    this.searchText = '';

    this.forceUpdate();
  }

  /**
   * Callback triggered when the continue button is pressed. It navigates to
   * the request mimo screen with the selected stores and all necessary
   * parameters.
   */
  _onContinue = () => {
    const navigation = this.props.navigation;
    navigation.navigate('RequestMimo', {
      selectedStores: this.selectedStores,
      resetStoreList: this._reset,
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
   * Callback triggered when the category chosen changes. Causes a re-render
   * on the component. It is passed as a prop to the CategoryBar component.
   */
  _onCategoryChange = (category) => {
    this.category = category;
    this.forceUpdate();
  }

  /**
   * Filters the passed in data by category, by looking whether any of the
   * store's categories matches the current category.
   */
  _filterByCategory = (data) => {
    if (this.category === null) {
      return data;
    }

    let filteredData = data.filter((store) => {
      return store.categories.some((category) => category == this.category);
    });

    return filteredData;
  }

  /**
   * Filters the passed in data by name, by looking whether the store name
   * matches a regexp starting with the text in the search bar.
   */
  _filterByName = (data) => {
    let filteredData = data.filter((store) => {
      return store.name.match(new RegExp('.*' + this.searchText + '.*', 'gi'));
    });

    return filteredData;
  }

  /**
   * Filters the data based on all filters available on the component.
   */
  _filter = (data) => {
    return this._filterByCategory(this._filterByName(data));
  }

  // Renders an item on the list, by using a StoreItem component.
  _renderItem = ({item}) => {
    return (
      <StoreItem
        onToggle={this._onToggle}
        onPress={this._onPressItem}
        selected={item.uid in this.selectedStores}
        store={item}
      />
    );
  }

  // Extracts the key from the items in the data array of the list.
  _keyExtractor = (item) => { return item.uid; }

  render() {
    const canContinue = Object.keys(this.selectedStores).length > 0;
    const continueStyle = canContinue ? styles.layout.continueButton :
      styles.layout.continueButtonDisabled;

    const stores = this._filter(stateManager.getStores());

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
        <CategoryBar
          onChange={this._onCategoryChange}
        />
        <View style={styles.layout.list}>
          {stores.length > 0 ?
            <FlatList
              data={stores}
              renderItem={this._renderItem}
              keyExtractor={this._keyExtractor}
              extraData={Object.keys(this.selectedStores).length}
            />
            :
            <Text style={styles.layout.placeholderText}>
              Nenhuma loja encontrada.
            </Text>
          }
        </View>
        <TouchableOpacity
          style={continueStyle}
          disabled={!canContinue}
          onPress={this._onContinue}
        >
          <Text style={styles.continueButton.text}>
            CONTINUAR
          </Text>
        </TouchableOpacity>
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
      flex: 1,
      flexGrow: 1,
      padding: 0,
      margin: 0,
      paddingBottom: 5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    placeholderText: {
      fontFamily: 'josefin-sans-bold',
      color: Colors.LightGray,
      fontSize: 18,
      textAlign: 'center',
    },
    continueButton: {
      height: Heights.BottomButton,
      backgroundColor: Colors.Mimo,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9,
      shadowOffset: {width: 0, height: 0},
      shadowColor: Colors.Black,
      shadowOpacity: 0.3,
      shadowRadius: 3,
    },
    continueButtonDisabled: {
      height: Heights.BottomButton,
      backgroundColor: Colors.LightGray,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9,
      shadowOffset: {width: 0, height: 0},
      shadowColor: Colors.Black,
      shadowOpacity: 0.3,
      shadowRadius: 3,
    }
  }),
  continueButton: StyleSheet.create({
    text: {
      color: '#fff',
      fontFamily: 'josefin-sans-bold',
      fontSize: 18,
      includeFontPadding: false,
    },
  }),
  store: StyleSheet.create({
    container: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      backgroundColor: Colors.White,
      marginLeft: 20,
      marginRight: 20,
    },
    logo: {
      width: 100,
      height: 100,
      resizeMode: 'contain',
      padding: 3,
      marginRight: 25,
    },
    description: {
      width: '40%',
      padding: 3,
      marginRight: 50,
    },
    checkbox: {
      width: 20,
      height: 20,
      margin: 0,
      padding: 0,
    },
    name: {
      color: Colors.Mimo,
      fontSize: 20,
      fontFamily: 'josefin-sans',
      paddingBottom: 3,
      includeFontPadding: false,
    },
    weakText: {
      color: '#000',
      fontSize: 13,
      fontFamily: 'josefin-sans-thin',
      marginBottom: 1,
      marginLeft: 1,
      includeFontPadding: false,
    },
  }),
}
