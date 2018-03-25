import { StackNavigator } from 'react-navigation';

import SettingsScreen from '../screens/SettingsScreen';

/**
 * StackNavigator that includes the routes for the Settings flow, which as of
 * now is simply just a single screen.
 */
export default StackNavigator(
  {
    Settings : {
      screen: SettingsScreen,
    },
  },
);
