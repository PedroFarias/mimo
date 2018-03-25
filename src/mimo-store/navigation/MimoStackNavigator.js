import { StackNavigator } from 'react-navigation';

import MimoListScreen from '../screens/MimoListScreen';
import MimoDetailScreen from '../screens/MimoDetailScreen';

/**
 * StackNavigator that includes the routes for the mimo flow: a list of mimos,
 * the mimo details, and the mimo request page.
 */
export default StackNavigator(
  {
    MimoList : {
      screen: MimoListScreen,
    },
    MimoDetail : {
      screen: MimoDetailScreen,
    },
  },
);
