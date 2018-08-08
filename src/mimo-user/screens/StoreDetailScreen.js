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
import {WebBrowser} from 'expo';
import TopBar from '../components/TopBar';
import { stateManager } from '../state/StateManager';
import { Colors, Heights } from '../util/Constants';

/**
 * Renders a single store, showing all of its details. Styles the store
 * appropriately, showing as much informatin as is available in the state.
 *
 * FIXME: Improve the categoriesView; it's not great, and if there are many
 * categories, they won't show. Do something similar to CategoryBar.
 */
class Store extends React.Component {


  // Renders an item on the list, by using a CategoryItem component.
  _renderItem = ({item}) => {
    return (
      <Text style={styles.category.text}>
        {item.name}
      </Text>
    );
  }

  // Extracts the key form the items in the data array of the list.
  _keyExtractor = (item) => item.uid;

  render() {
    console.log('store props',this.props)
    const categories = this.props.store.categories.map((category, index) => {
      return {
        uid: index,
        name: category,
      }
    });

    const streetText = this.props.store.address.street ?
      <Text style={styles.location.text}>
        {this.props.store.address.street}
      </Text> :
      null;

    const neighborhoodText = this.props.store.address.neighborhood ?
      <Text style={styles.location.text}>
        {this.props.store.address.neighborhood}
      </Text> :
      null;

    const cityText = this.props.store.address.city ?
      <Text style={styles.location.text}>{this.props.store.address.city}</Text> :
      null;

    const locationIcon = (cityText || neighborhoodText || streetText) ?
      <Image
        style={styles.location.icon}
        source={require('../assets/icons/location.png')}
      /> :
      null;

    if(this.props.store.weblink){
      console.log('in weblink')
        webLink = this.props.store.weblink.includes('http://') || 
        this.props.store.weblink.includes('https://') ? this.props.store.weblink :
        'http://' + this.props.store.weblink
    }

    return (
      <ScrollView>
        <View style={styles.layout.store}>
          <Image
            style={styles.store.logo}
            source={{uri: this.props.store.logo}}
          />
          <Text style={styles.store.name}>
            {this.props.store.name.toUpperCase()}
          </Text>
          <Text style={styles.store.description}>
            {this.props.store.description}
          </Text>
          
          {
            this.props.store.weblink && 
            <TouchableOpacity onPress={()=>WebBrowser.openBrowserAsync(webLink)} >
            <Text style={styles.store.weblink} >
            { webLink.split('//')[1]}
            </Text>
            </TouchableOpacity>
          } 
          <View style={styles.layout.category}>
            <FlatList
              horizontal
              data={categories}
              renderItem={this._renderItem}
              keyExtractor={this._keyExtractor}
              contentContainerStyle={styles.layout.list}
            />
          </View>
          <View style={styles.layout.location}>
            {locationIcon}
            {streetText}
            {neighborhoodText}
            {cityText}
          </View>
        </View>
      </ScrollView>
    );
  }
}

/**
 * Renders the screen containing the store details.
 */
export default class StoreDetailScreen extends React.Component {
  static navigationOptions = {
    header: null,
  };

  componentWillMount() {
    // Fetches the store state.
    const navigation = this.props.navigation;
    this.store = stateManager.getStore(navigation.state.params.sUid);
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
   * Callback triggered when the user presses the button on the bottom. Calls
   * the passed-in onPress param callback, and goes back to the previous
   * screen.
   */
  _onPress = () => {
    const navigation = this.props.navigation;
    navigation.state.params.onPress(this.store.uid);
    this._goBack();
  }

  render() {
    const navigation = this.props.navigation;
    const selected = navigation.state.params.selected;
    const boxStyle = selected ? styles.button.removeContainer :
      styles.button.addContainer;
    const boxText = selected ? 'REMOVER' : 'ADICIONAR';

    return (
      <View style={styles.layout.container}>
        <TopBar
          onLeft={this._goBack}
          showRight={false}
        />
        <Store store={this.store}/>
        
        <TouchableOpacity
          style={boxStyle}
          onPress={this._onPress}
        >
          <Text style={styles.button.text}>
            {boxText}
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
    store: {
      flex: 1,
      alignItems: 'center',
    },
    category: {
      width: '60%',
      height: 20,
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      marginBottom: 10,
    },
    location: {
      flex: 1,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    list: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  }),
  button: StyleSheet.create({
    addContainer: {
      height: Heights.BottomButton,
      backgroundColor: Colors.Mimo,
      alignItems: 'center',
      justifyContent: 'center',
      shadowOffset: {width: 0, height: 0},
      shadowColor: Colors.Black,
      shadowOpacity: 0.3,
      shadowRadius: 3,
    },
    removeContainer: {
      height: Heights.BottomButton,
      backgroundColor: Colors.Orange,
      alignItems: 'center',
      justifyContent: 'center',
      shadowOffset: {width: 0, height: 0},
      shadowColor: Colors.Black,
      shadowOpacity: 0.3,
      shadowRadius: 3,
    },
    text: {
      color: Colors.White,
      fontFamily: 'josefin-sans-bold',
      fontSize: 18,
      includeFontPadding: false,
    },
  }),
  store: StyleSheet.create({
    name: {
      fontFamily: 'josefin-sans',
      color: Colors.Mimo,
      fontSize: 24,
      includeFontPadding: false,
    },
    logo: {
      width: '50%',
      height: 150,
      resizeMode: 'contain',
      marginTop: 20,
      marginBottom: 30,
    },
    description: {
      fontFamily: 'josefin-sans-thin',
      fontSize: 18,
      color: Colors.Black,
      textAlign: 'center',
      padding: 30,
      includeFontPadding: false,
    },
    weblink:{
      fontFamily: 'josefin-sans-thin',
      fontSize: 16,
      color: Colors.Black,
      textAlign: 'center',
      padding: 10,
      paddingBottom:40 ,
      includeFontPadding: false,

    },
  }),
  category: StyleSheet.create({
    text: {
      color: Colors.Mimo,
      fontFamily: 'josefin-sans-bold',
      fontSize: 14,
      marginLeft: 15,
      marginRight: 15,
      includeFontPadding: false,
    },
  }),
  location: StyleSheet.create({
    icon: {
      height: 30,
      resizeMode: 'contain',
      marginTop: 10,
      marginBottom: 10,
    },
    text: {
      width: '100%',
      fontFamily: 'josefin-sans-thin',
      fontSize: 16,
      color: Colors.Black,
      textAlign: 'center',
      includeFontPadding: false,
    },
  }),
};
