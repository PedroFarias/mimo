/**
 * Interface exposed to the rest of the application to interact with the backend
 * server, whatever it is that implementation of the server.
 *
 * Currently, we expect the only point of connection to this entity to be the
 * StateManager class.
 *
 * The structure of objects must be as follows:
 *
 * <user object>:
 *  {
 *    uid: string,
 *    public: {
 *      firstName: string,
 *      lastName: string,
 *      photo: string,
 *      role: {
 *        type: string,
 *        store: string optional,
 *      },
 *    },
 *    private: {
 *      conversations: {
 *        cUid: true,
 *        ...
 *      },
 *    },
 *  }
 *
 * <public user object>:
 *  {
 *    uid: string,
 *    firstName: string,
 *    lastName: string,
 *    photo: string,
 *    role: {
 *      type: string,
 *      store: string optional,
 *    },
 *  }
 *
 * <message object>:
 *  {
 *    sender: string,
 *    timestamp: string,
 *    read: bool,
 *    content: {
 *      text: string,
 *      image: string,
 *    },
 *  }
 *
 * <conversation object>:
 *  {
 *    user: <public user object>,
 *    messages: {
 *      <message object>,
 *      ...
 *    }
 *  }
 *
 * <store object>:
 *  {
 *    name: string,
 *    logo: string,
 *    description: string,
 *    address: {
 *      city: string optional,
 *      neighborhood: string optional,
 *      street: string optional,
 *      zip: string optional,
 *    },
 *  }
 */
export default class Server {
  /**
   * Returns a newly constructed Server instance, with the passed in options
   * as parameters. This may define, for instance, whether to expect a
   * customer or an employee to be talking to this server, allowing some
   * shallow protection.
   *
   * @param options
   *  Object containing parameters to use for configuring initialization.
   */
  constructor(options) {}

  /**
   * Performs initialization of the internal state of the server, that could
   * not be done in the constructor. Once this is called, callbacks may be
   * triggered immediately; register all your callbacks before invoking this.
   *
   * @return
   *  Nothing.
   */
  initialize = () => {}

  /**
   * Registers the given callback to be executed whenever a new user is
   * logged in.
   *
   * @param callback
   *  The callback to be triggered. The callback will be called with one
   *  arguments: the user profile corresponding to the current user.
   * @return
   *  Nothing.
   */
  registerOnLoginCallback = (callback) => {}

  /**
   * Registers the given callback to be executed whenever a user logs out.
   *
   * @param callback
   *  The callback to be triggered. The callback will be called with no
   *  parameters.
   * @return
   *  Nothing.
   */
  registerOnLogoutCallback = (callback) => {}

  /**
   * Registers the given callback to be executed whenever a new conversation
   * event (to which this Server instance is subscribed) is triggered.
   *
   * @param callback
   *  The callback to be triggered. The callback will be called with two
   *  arguments: (cUid, conversation), the conversation unique identifier and
   *  the conversation object.
   *
   * @return
   *  Nothing.
   */
  registerOnConversationCallback = (callback) => {}

  /**
   * Registers the given callback to be executed whenever a conversation
   * removal event (to which this Server instance is subscribed) is triggered.
   *
   * @param callback
   *  The callback to be triggered. The callback will be called with one
   *  argument: (cUid), the conversation unique identifier
   *
   * @return
   *  Nothing.
   */
  registerOnConversationRemovedCallback = (callback) => {}

  /**
   * Registers the given callback to be executed whenever a mimo added
   * event (to which this Server instance is subscribed) is triggered.
   *
   * @param callback
   *  The callback to be triggered. The callback will be called with two
   *  arguments: (mUid, mimo), the mimo unique identifier and the mimo object.
   *
   * @return
   *  Nothing.
   */
  registerOnMimoCallback = (callback) => {}

  /**
   * Registers the given callback to be executed whenever a mimo (to which this
   * Server instance is subscribed) is accepted.
   *
   * @param callback
   *  The callback to be triggered. The callback will be called with two
   *  arguments: (mUid, mimo), the mimo unique identifier and the mimo object.
   *
   * @return
   *  Nothing.
   */
  registerOnMimoAcceptedCallback = (callback) => {}

  /**
   * Registers the given callback to be executed whenever a new message
   * event (to which this Server instance is subscribed) is triggered.
   *
   * @param callback
   *  The callback to be triggered. The callback will be called with three
   *  arguments: (cUid, mUid, message), the conversation unique identifier, the
   *  message unique identifier, and the message object.
   *
   * @return
   *  Nothing.
   */
  registerOnMessageCallback = (callback) => {}

  /**
   * Registers the given callback to be executed whenever a message changed
   * event (to which this Server instance is subscribed) is triggered.
   *
   * @param callback
   *  The callback to be triggered. The callback will be called with three
   *  arguments: (cUid, mUid, message), the conversation unique identifier, the
   *  message unique identifier, and the message object.
   *
   * @return
   *  Nothing.
   */
  registerOnMessageChangedCallback = (callback) => {}

  /**
   * Registers the given callback to be executed whenever a new store
   * event (to which this FirebaseServer instance is subscribed) is
   * triggered.
   *
   * @param callback
   *  The callback to be triggered. The callback will be called with two
   *  arguments: (sUid, store), the store unique identifier and the store
   *  object.
   *
   * @return
   *  Nothing.
   */
  registerOnStoreCallback = (callback) => {}

  /**
   * Registers the given callback to be executed whenever a store changed
   * event (to which this FirebaseServer instance is subscribed) is
   * triggered.
   *
   * @param callback
   *  The callback to be triggered. The callback will be called with two
   *  arguments: (sUid, store), the store unique identifier and the store
   *  object.
   *
   * @return
   *  Nothing.
   */
  registerOnStoreChangedCallback = (callback) => {}

  /**
   * Registers the given callback to be executed whenever a user (to which this
   * Server instance is subscribed) is modified or added.
   *
   * @param callback
   *  The callback to be triggered. The callback will be called with two
   *  arguments: (uUid, user), the user unique identifier and the user object.
   *
   * @return
   *  Nothing.
   */
  registerOnUserCallback = (callback) => {}

  /**
   * Subscribes to server events related to stores. Should only be called
   * after login.
   *
   * @return Nothing.
   */
  listenStores = () => {}

  /**
   * Subscribes to server events related to conversations. Should only be called
   * after login.
   *
   * @return Nothing.
   */
  listenConversations = (uUid) => {}

  /**
   * Subscribes to server events related to mimos. Should only be called
   * after login.
   *
   * @return Nothing.
   */
  listenMimos = (uUid) => {}

  /**
   * Login the user with the server, and return the user object that is
   * stored there. Handles login with Google, Facebook and simple email/password
   * schemes.
   *
   * @param auth
   *  An object containing the authentication information from the service
   *  authentication provider.
   * @return
   *  The user object containing the user information stored on the server.
   *  The structure returned will follow:
   */
  login = async (auth) => {}

  /**
   * Logout the user with the server, unsubscribe to any events, and do any
   * necessary clean-up.
   *
   * @return
   *  Nothing.
   */
  logout = async () => {}

  /**
   * Send a message to the server, given a conversation and a message unique
   * identifier, and of course the message object.
   *
   * @param cUid
   *  The conversation unique identifier where the message will reside.
   * @param mUid
   *  The message unique identifier where the message will reside. This must
   *  have been acquire via getMessageUid.
   * @param message
   *  The message object containing the message body.
   *
   * @return
   *  Nothing.
   */
  sendMessage = async (cUid, mUid, message) => {}

  /**
   * Marks a message as read by the user in the server.
   *
   * @param cUid
   *  The conversation unique identifier where this message resides.
   * @param mUid
   *  The message unique identifier within the conversation.
   * @param uUid
   *  The user unique identifier (who has read the message).
   * @return
   *  Nothing.
   */
  markMessageRead = async (cUid, mUid, uUid) => {}

  /**
   * Send a mimo request to all specified stores.
   *
   * @param sUids
   *  A list of all the stores that must receive the mimo.
   * @param mimo
   *  The mimo object containing the request.
   * @return
   *  Nothing.
   */
  sendMimo = async (sUids, mimo) => {}

  /**
   * Adds a conversation reference to the current user.
   *
   * @param cUid
   *  The conversation unique identifier.
   * @param uUid
   *  The user identifier with whom this conversation takes place. This is
   *  only an implementation detail that may be changed.
   * @return
   *  Nothing.
   */
  addConversationRef = async (conversationUid, userUid) => {}

  /**
   * Adds a pending mimo reference to the current logged in user.
   *
   * @param mUid
   *  The mimo unique identifier.
   * @return
   *  Nothing.
   */
  addPendingMimoRef = async (mUid) => {}

  /**
   * Removes a pending mimo reference from the current user.
   *
   * @param mUid
   *  The mimo unique identifier.
   */
  removeUserPendingMimoRef = async (mUid) => {}

  /**
   * Get a timestamp from the server.
   *
   * @return
   *  An object corresponding to a server timestamp.
   */
  getTimestamp = () => {}

  /**
   * Get a new unique identifier from the server.
   *
   * @return
   *  A string corresponding to the unique identifier.
   */
  getUid = () => {}
}
