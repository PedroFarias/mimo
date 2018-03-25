import React from 'react';
import { TabNavigator, TabNavigatorItem, TabBarBottom } from 'react-navigation';
import {
  Image,
  Keyboard,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View
} from 'react-native';

import StoreStackNavigator from './StoreStackNavigator';
import ConversationStackNavigator from './ConversationStackNavigator';
import SettingsStackNavigator from './SettingsStackNavigator';
import { Colors, Heights } from '../util/Constants';

/**
 * Wrapper around TabBarBottom, used to make sure that it disappears when the
 * keyboard is up, on Android. This is a sort of hack, but it works as
 * expected (as of March, 2018).
 */
class TabBar extends React.Component {
  componentWillMount() {
    // Indicates whether the keyboard is up or down, information used to decide
    // whether to render the TabBarBottom child.
    this.keyboardUp = false;
  }

  keyboardWillShow = (e) => {
    this.keyboardUp = true;
    this.forceUpdate();
  }

  keyboardWillHide = (e) => {
    this.keyboardUp = false;
    this.forceUpdate();
  }

  componentWillMount() {
    if (Platform.OS == 'android') {
      this.keyboardWillShowSub = Keyboard.addListener('keyboardDidShow',
        this.keyboardWillShow)
      this.keyboardWillHideSub = Keyboard.addListener('keyboardDidHide',
        this.keyboardWillHide)
    }
  }

  componentWillUnmount() {
    if (Platform.OS == 'android') {
      this.keyboardWillShowSub.remove()
      this.keyboardWillHideSub.remove()
    }
  }

  render() {
    return this.keyboardUp ? null : <TabBarBottom {...this.props} />;
  }
}

/**
 * Builds a TabNavigator object with the necessary routes and tab bar icons,
 * styling and positioning.
 */
const RootTabNavigator = TabNavigator(
  {
    Store : {
      screen: StoreStackNavigator,
    },
    Conversation: {
      screen: ConversationStackNavigator,
    },
    Settings: {
      screen: SettingsStackNavigator,
    },
  },
  {
    navigationOptions: ({navigation}) => ({
      tabBarIcon: ({focused}) => {
        const routeName = navigation.state.routeName;
        switch(routeName) {
          case 'Store':
            return (
              <Image
                style={styles.tabBar.icon}
                source={focused ? require('../assets/icons/mimos.png') :
                  require('../assets/icons/mimosUnselected.png')}
              />
            );
          case 'Conversation':
            return (
              <Image
                style={styles.tabBar.icon}
                source={focused ? require('../assets/icons/conversations.png') :
                  require('../assets/icons/conversationsUnselected.png')}
              />
            );
          case 'Settings':
            return (
              <Image
                style={styles.tabBar.icon}
                source={focused ? require('../assets/icons/settings.png') :
                  require('../assets/icons/settingsUnselected.png')}
              />
            );
        }
      },
    }),
    tabBarComponent: TabBar,
    tabBarPosition: 'bottom',
    tabBarOptions: {
      showLabel: false,
      style: {
        backgroundColor: Colors.White,
        borderTopColor: Colors.LightGray,
        shadowOpacity: 0.0,
      },
    },
    animationEnabled: false,
    swipeEnabled: false,
  }
);

/**
 * Renders the TabNavigator defined above, containing the StackNavigators
 * for stores and for conversations.
 */
export default class RootNavigator extends React.Component {
  render() {
    return <RootTabNavigator />;
  }
}

const styles = {
  tabBar: StyleSheet.create({
    container: {
      backgroundColor: Colors.White,
      borderTopColor: Colors.Transparent,
      shadowOpacity: 0,
    },
    icon: {
      width: Heights.TabBarIcon,
      height: Heights.TabBarIcon,
      resizeMode: 'contain',
    },
  }),
}
