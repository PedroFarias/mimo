import { StackNavigator } from 'react-navigation';

import StoreListScreen from '../screens/StoreListScreen';
import StoreDetailScreen from '../screens/StoreDetailScreen';
import RequestMimoScreen from '../screens/RequestMimoScreen';

/**
 * StackNavigator that includes the routes for the store flow: a list of stores,
 * the store details, and the mimo request page.
 */
export default StackNavigator(
  {
    StoreList : {
      screen: StoreListScreen,
    },
    StoreDetails : {
      screen: StoreDetailScreen,
    },
    RequestMimo : {
      screen: RequestMimoScreen,
    },
  },
);
