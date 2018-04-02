import { binarySearch } from '../util/Helpers';
import { logger } from '../util/Logger';

export default class ConversationManager {
  constructor(stateManager, server, options) {
    logger.debug(`ConversationManager.constructor: [options = %s]`, options);

    this._server = server;
    this._stateManager = stateManager;

    /*
     * this._conversations contains the state of the conversations this user
     * is involved in. This includes the conversation unique identifier, the
     * recipient identifier, and messages.
     */
    this._conversations = [];

    /*
     * this._pendingMessages keeps track of messages that were sent, but not
     * yet confirmed by the server. Once they do arrive, we remove the
     * message from this set.
     */
    this._pendingMessages = {};

    /*
     * this._unreadMessages keeps track of the messages that are unread, so
     * that when we can mark them as read later. Otheriwse, we'd need to read
     * the entire database and update it all...
     */
    this._unreadMessages = {};

    // Registers callbacks: conversations added, messages added, and messages
    // changed.
    this._server.registerOnLoginCallback(this._onLogin);
    this._server.registerOnLogoutCallback(this._onLogout);
    this._server.registerOnConversationCallback(this._onConversation);
    this._server.registerOnConversationRemovedCallback(
      this._onConversationRemoved);
    this._server.registerOnMessageCallback(this._onMessage);
    this._server.registerOnMessageChangedCallback(this._onMessageChanged);
  }

  /**
   * Helper function to perform binary search.
   *
   * @param cUid
   *  The conversation unique identifier.
   * @param conversation
   *  The conversation to look for the cUid.
   * @return
   *  The comparison between the two values (negative, zero, positive).
   */
  _conversationCmp = (conversation, cUid) => {
    return conversation.uid.localeCompare(cUid);
  }

  /**
   * Helper function to perform binary search.
   *
   * @param cUid
   *  The message unique identifier.
   * @param message
   *  The message to look for the mUid.
   * @return
   *  The comparison between the two values (negative, zero, positive).
   */
  _messageCmp = (message, mUid) => {
    return message.uid.localeCompare(mUid);
  }

  /**
   * Returns a copy of the conversation object stored in the state. The
   * conversation must exist; the only way this function should be called is
   * if that is guaranteed.
   *
   * @param cUid
   *  The conversation unique identifier for which to retrieve.
   * @return
   *  The conversation object (as described in the Server).
   */
  getConversation = (cUid) => {
    logger.debug(`ConversationManager.getConversation: [cUid = %s]`, cUid);
    logger.debug(`%s`, this._conversations);

    const index = binarySearch(this._conversations, this._conversationCmp,
      cUid);
    if (index == null) {
      return null;
    }

    return {...this._conversations[index]};
  }

  /**
   * Returns a copy of all conversations in the state.
   *
   * @return
   *  An array containing all conversation objects (as specified in the class
   *  description).
   */
  getConversations = () => {
    logger.debug(`ConversationManager.getConversations`);

    return [...this._conversations];
  }

  /**
   * Blocks a conversation. Removes references of this conversation in both
   * the customer and the employee. The conversation object should be kept,
   * but not much of a reason for it.
   *
   * @param cUid
   *  The conversation unique identifier corresponding to this conversation.
   */
  blockConversation = async (cUid) => {
    logger.debug(`ConversationManager.blockConversation: [cUid = %s]`, cUid);

    const conversation = this.getConversation(cUid);
    await this._server.blockConversation(cUid, conversation);

    this._stateManager.updateComponents();
  }

  /**
   * Sends a message to a given conversation. Does so in two steps: first, it
   * gets a unique message identifier from the Server, puts in a preview
   * of the sent message on the state, updates the registered components (to
   * allow users to see the preview), and finally send the message to the server
   * at the location specified by the unique identifier.
   *
   * @param cUid
   *  The conversation unique identifier where this message will be sent.
   * @param message
   *  The message object (as specified in the Server).
   * @return
   *  Nothing.
   */
  sendMessage = async (cUid, message) => {
    logger.debug(`ConversationManager.sendMessage: [cUid = %s], [message = %s]`,
      cUid, message);

    const mUid = this._server.getUid();

    // Adds a fake timestamp, since we don't have the accurate one yet.
    message.timestamp = Date.now();

    this._pendingMessages[mUid] = message;

    const conversation = this.getConversation(cUid);

    // Conversation does not exist anymore; do nothing.
    if (conversation == null) {
      return;
    }

    conversation.messages.push({...message, uid: mUid});

    this._stateManager.updateComponents();

    // Add the real message timestamp for Firebase.
    message.timestamp = this._server.getTimestamp();

    await this._server.sendMessage(cUid, mUid, message);
  }

  /**
   * Marks all unread messages in a given conversation as read. This is useful
   * when, for instance, we want to change the status of a message to read,
   * after opening the conversation.
   *
   * @param cUid
   *  The conversation unique identifier where this message will be sent.
   * @return
   *  Nothing.
   */
  markMessagesRead = (cUid) => {
    logger.debug(`ConversationManager.markMessagesRead: [cUid = %s]`, cUid);

    const user = this._stateManager.getUser();

    if (!(cUid in this._unreadMessages)) {
      return;
    }

    this._unreadMessages[cUid].forEach((mUid) => {
      this._server.markMessageRead(cUid, mUid, user.uid);
    });
  }

  /**
   * Adds a conversation to the internal state and triggers a re-render on the
   * registered components.
   *
   * @param cUid
   *  The conversation unique identifier.
   * @param conversation
   *  The conversation object (as specified in the Server).
   * @return
   *  Nothing.
   */
  _onConversation = (cUid, conversation) => {
    logger.debug(`ConversationManager._onConversation: [cUid = %s] \
      [conversation = %s]`, cUid, conversation);

    this._conversations.push({...conversation, messages: [], uid: cUid});
    this._stateManager.updateComponents();
  }

  /**
   * Removes a conversation from the managed state.
   *
   * @param cUid
   *  The conversation unique identifier.
   * @return
   *  Nothing.
   */
  _onConversationRemoved = (cUid) => {
    logger.debug(`ConversationManager._onConversationRemoved: [cUid = %s]`,
      cUid);

    const index = binarySearch(this._conversations, this._conversationCmp,
      cUid);
    if (index == null) {
      logger.debug(`Received a conversation child_remove for "%s", but \
        conversation was not in internal state. Ignoring.`, cUid);
    }

    this._conversations.splice(index, 1);
    this._stateManager.updateComponents();
  }

  /**
   * Adds a message to the internal state and triggers a re-render on the
   * registered components. If the received message is one of the messages
   * currently previewed, then avoid showing it twice (the Server will
   * issue a callback for any added messages).
   *
   * @param cUid
   *  The conversation unique identifier where this message will be stored.
   * @param mUid
   *  The message unique idenitifier associated to this message.
   * @param message
   *  The message object (as specified in the Server).
   * @return
   *  Nothing.
   */
  _onMessage = async (cUid, mUid, message) => {
    logger.debug(`ConversationManager._onMessage: [cUid = %s], [mUid = %s], \
      [message = %s]`, cUid, mUid, message);

    const user = this._stateManager.getUser();

    // Received a notification for a message I have already read: remove it
    // from the pending list, if it's there, and do nothing. If it's not a
    // pending message, we just show it.
    if (user.uid in message.readBy) {
      if (mUid in this._pendingMessages) {
        delete this._pendingMessages[mUid];
        return;
      }
    }

    const conversation = this.getConversation(cUid);
    conversation.messages.push({...message, uid: mUid});

    // Add message to list of unread messages.
    if (!(cUid in this._unreadMessages)) {
      this._unreadMessages[cUid] = new Set();
    }
    this._unreadMessages[cUid].add(mUid);

    this._stateManager.updateComponents();
  }

  /**
   * Modifies a message in the internal state and triggers a re-render on the
   * registered components. For instance, this could be triggered by a change
   * in the message's read property. This will, however, take in any other
   * changes that may occur (change in timestamp, etc).
   *
   * @param cUid
   *  The conversation unique identifier where this message will be stored.
   * @param mUid
   *  The message unique idenitifier associated to this message.
   * @param message
   *  The message object (as specified in the Server).
   * @return
   *  Nothing.
   */
  _onMessageChanged = async (cUid, mUid, message) => {
    logger.debug(`ConversationManager._onMessageChanged: [cUid = %s], \
      [mUid = %s], [message = %s]`, cUid, mUid, message);

    // Mark the message as unread, if it looks like we haven't read it.
    const user = this._stateManager.getUser();

    if (!(user.uid in message.readBy)) {
      if (!(cUid in this._unreadMessages)) {
        this._unreadMessages[cUid] = new Set();
      }
      this._unreadMessages[cUid].add(mUid);
    }

    // Would like to use getConversation, but that's going to return a copy,
    // so here it goes. Copy & Paste at its prime.
    const cIndex = binarySearch(this._conversations, this._conversationCmp,
      cUid);

    // We don't have the conversation anymore, either it has been blocked,
    // or something else. Ignore.
    if (cIndex == null) {
      return;
    }
    const conversation = this._conversations[cIndex];

    const mIndex = binarySearch(conversation.messages, this._messageCmp, mUid);
    // We don't have the conversation anymore, either it has been blocked,
    // or something else. Ignore.
    if (mIndex == null) {
      return;
    }

    conversation.messages[mIndex] = {...message, uid: mUid};

    this._stateManager.updateComponents();
  }

  /**
   * Callback triggered when the server has been authenticated.
   *
   * @param user
   *  The user object received from the server, containing the current user's
   *  profile.
   * @return
   *  Nothing.
   */
  _onLogin = (user) => {
    logger.debug(`ConversationManager._onLogin: [user = %s]`, user);

    this._server.listenConversations(user.uid);
  }

  /**
   * Callback triggered when the server has logged out. Resets internal state.
   *
   * @return
   *  Nothing.
   */
  _onLogout = () => {
    logger.debug(`ConversationManager._onLogout`);

    this._conversations = [];
    this._pendingMessages = {};
    this._unreadMessages = {};

    this._stateManager.updateComponents();
  }
}
