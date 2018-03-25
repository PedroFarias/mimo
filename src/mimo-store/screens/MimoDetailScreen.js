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
import { stateManager } from '../state/StateManager';
import { Colors, Heights } from '../util/Constants';

/**
 * Renders a single mimo, showing all of its details. Styles the mimo
 * appropriately, showing as much informatin as is available in the state.
 *
 * FIXME: Improve the categoriesView; it's not great, and if there are many
 * categories, they won't show. Do something similar to CategoryBar.
 */
class Mimo extends React.Component {
  // Extracts the key form the items in the data array of the list.
  _keyExtractor = (item) => item.uid;

  render() {
    const user = this.props.user;
    const userName = user.firstName + ' ' + user.lastName;
    const mimo = this.props.mimo;

    return (
      <ScrollView>
        <View style={styles.layout.mimo}>
          <Image
            style={styles.mimo.photo}
            source={{uri: user.photo}}
          />
          <Text style={styles.mimo.name}>
            {userName.toUpperCase()}
          </Text>
          <Text style={styles.mimo.description}>
            {mimo.message}
          </Text>
        </View>
      </ScrollView>
    );
  }
}

/**
 * Renders the screen containing the mimo details.
 */
export default class MimoDetailScreen extends React.Component {
  static navigationOptions = {
    header: null,
  };

  componentWillMount() {
    // Fetches the mimo state.
    const navigation = this.props.navigation;
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
    navigation.state.params.onPress(navigation.state.params.mUid);
    this._goBack();
  }

  render() {
    const navigation = this.props.navigation;
    const mimo = stateManager.getPendingMimo(navigation.state.params.mUid);
    const user = stateManager.getUser(mimo.customer);

    return (
      <View style={styles.layout.container}>
        <TopBar
          onLeft={this._goBack}
          showRight={false}
        />
        <Mimo mimo={mimo} user={user} />
        <TouchableOpacity
          style={styles.button.container}
          onPress={this._onPress}
        >
          <Text style={styles.button.text}>
            ACEITAR
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
    mimo: {
      flex: 1,
      alignItems: 'center',
    },
  }),
  button: StyleSheet.create({
    container: {
      height: Heights.BottomButton,
      backgroundColor: Colors.Mimo,
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
  mimo: StyleSheet.create({
    name: {
      fontFamily: 'josefin-sans',
      color: Colors.Mimo,
      fontSize: 24,
      includeFontPadding: false,
    },
    photo: {
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
  }),
};
