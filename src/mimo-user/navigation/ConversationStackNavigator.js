import { StackNavigator } from 'react-navigation';

import ConversationListScreen from '../screens/ConversationListScreen';
import ConversationScreen from '../screens/ConversationScreen';

/**
 * StackNavigator that includes the routes for the conversation flow: a list of
 * conversations and the conversation screen.
 */
export default StackNavigator(
  {
    ConversationList : {
      screen: ConversationListScreen,
    },
    Conversation : {
      screen: ConversationScreen,
    },
  },
);
