import * as firebase from 'firebase';

import Server from './Server';
import { logger } from '../util/Logger';
import { Auth } from '../util/Constants';
import { Config } from '../util/Config';

import {
  assertEmployee,
  assertMessage,
  assertMimo,
  assertStore,
  assertUser,
  format,
  getUserPublicPath,
  getUserPrivatePath,
  getUserConversationPath,
  getAllUserConversationsPath,
  getUserPendingMimoPath,
  getAllUserPendingMimosPath,
  getAllUserAcceptedMimosPath,
  getAllStoresPublicPath,
  getAllStoresPrivatePath,
  getStoreEmployeesPath,
  getAllConversationsPath,
  getConversationPath,
  getAllConversationMessagesPath,
  getConversationMessagePath,
  getConversationMessageReadByPath,
  getConversationMessageReadByUserPath,
  getImagePath,
  getMimoPath,
} from '../util/Helpers';

import assert from 'assert';

/**
 * Implementation of a Server interface, based on the Firebase backend.
 * The interface was designed with Firebase in mind, so this is a very
 * natural implementation on top of it.
 *
 * Refer to Server for documentation on the interface calls that this
 * class implements.
 */
export default class FirebaseServer extends Server {
  constructor(options) {
    super();

    // The role we expect the logged in user to be.
    this._role = options.role;

    this._db = null;
    this._fs = null;

    // Sets containing callbacks registered for specific events.
    this._onLoginCallbacks = new Set();
    this._onLogoutCallbacks = new Set();
    this._onUserCallbacks = new Set();
    this._onStoreCallbacks = new Set();
    this._onStoreChangedCallbacks = new Set();
    this._onConversationCallbacks = new Set();
    this._onConversationRemovedCallbacks = new Set();
    this._onMessageCallbacks = new Set();
    this._onMessageChangedCallbacks = new Set();
    this._onMimoAcceptedCallbacks = new Set();
    this._onMimoCallbacks = new Set();

    this._lastUid = '';
  }

  initialize = () => {
    firebase.initializeApp(Config.Firebase);
    firebase.auth().onAuthStateChanged(async (user) => {
      try {
        await this._onAuthChanged(user);
        if (this._user == null) {
          return;
        }

        const stores = this._db.child('stores/public');
        stores.set({
          '0': {
            name: 'Vendedor Mimo',
            categories: ['Masculino', 'Feminino'],
            address: { city: 'São Paulo', street: '', neighborhood: '' },
            logo: 'https://firebasestorage.googleapis.com/v0/b/mimo-7b006.appspot.com/o/icon.png?alt=media&token=1af0c6c1-6b68-413c-8e8b-4a71f819b06f',
            description: 'Vendedor Mimo.',
          },
          '1': {
            name: 'Austral Culture',
            categories: ['Masculino', 'Feminino'],
            address: { city: 'São Paulo', street: '', neighborhood: '' },
            logo: 'https://raw.githubusercontent.com/PedroFarias/mimo/master/brand_logos/austral_culture.jpg',
            description: 'Somos Austral. Marca de Surfwear brasileira especializada em moda sustentável. Somos pela vida e pela natureza, venha nos conhecer!',
          },
          '2': {
            name: 'Zapälla',
            categories: ['Masculino'],
            address: { city: 'São Paulo', street: 'Av. Pres. Juscelino Kubitschek, 2041', neighborhood: 'Vila Nova Conceição' },
            logo: 'https://raw.githubusercontent.com/PedroFarias/mimo/master/brand_logos/zap%C3%A4lla.jpg',
            description: 'Zapälla é a personificação do homem familiar, sofisticado e contemporâneo que busca experienciar o mundo e o melhor da vida com estilo e tradição.',
          },
          '3': {
            name: 'FIT',
            categories: ['Feminino'],
            address: { city: 'São Paulo', street: 'Av. Brg. Faria Lima, 2232', neighborhood: 'Jardim Paulistano' },
            logo: 'https://raw.githubusercontent.com/PedroFarias/mimo/master/brand_logos/fit.jpg',
            description: 'Inaugurada em 1986, a FIT produz peças exclusivas, originais e de alta qualidade entre roupas, calçados e acessórios.',
          },
          '4': {
            name: 'ATeen',
            categories: ['Masculino'],
            address: { city: 'São Paulo', street: 'Av. Brg. Faria Lima, 2232', neighborhood: 'Jardim Paulistano' },
            logo: 'https://raw.githubusercontent.com/PedroFarias/mimo/master/brand_logos/ateen.jpg',
            description: 'A Ateen Começou em 1994, no Rio de Janeiro, e atualmente possui 21 lojas próprias entre Rio, São Paulo, Brasília, Campinas, Belo Horizonte, Curitiba E Ribeirão Preto. Além da Loja Online e diversos pontos de venda multimarcas pelo Brasil, a marca está em constante expansão e tornou-se referência no mercado de moda feminina. Para a diretora criativa, Maria Rita Magalhães Pinto, a ATEEN é uma marca atemporal, sofisticada e despojada. “ao longo desses 23 anos no mercado, meu intuito sempre foi criar peças versáteis, para as diferentes mulheres com o mesmo desejo: sentir-se bem e com estilo em qualquer ocasião".',
          },
        });
      } catch (error) {
        logger.debug(`Something went wrong: logging out. Error: %s`,
          error.toString());
        this.logout();
      }
    });

    logger.debug(`Initialized server.`);
  }

  /*
   *************************************************************************
                         SERVER CALLBACK INTERFACE

   Functions to register callbacks for particular Server events.
   *************************************************************************
   */

  registerOnLoginCallback = (callback) => {
    this._onLoginCallbacks.add(callback);
  }

  registerOnLogoutCallback = (callback) => {
    this._onLogoutCallbacks.add(callback);
  }

  registerOnMimoAcceptedCallback = (callback) => {
    this._onMimoAcceptedCallbacks.add(callback);
  }

  registerOnMimoCallback = (callback) => {
    this._onMimoCallbacks.add(callback);
  }

  registerOnConversationCallback = (callback) => {
    this._onConversationCallbacks.add(callback);
  }

  registerOnConversationRemovedCallback = (callback) => {
    this._onConversationRemovedCallbacks.add(callback);
  }

  registerOnMessageCallback = (callback) => {
    this._onMessageCallbacks.add(callback);
  }

  registerOnMessageChangedCallback = (callback) => {
    this._onMessageChangedCallbacks.add(callback);
  }

  registerOnUserCallback = (callback) => {
    this._onUserCallbacks.add(callback);
  }

  registerOnStoreCallback = (callback) => {
    this._onStoreCallbacks.add(callback);
  }

  registerOnStoreChangedCallback = (callback) => {
    this._onStoreChangedCallbacks.add(callback);
  }

  /*
   *************************************************************************
                       SUBSCRIBE TO FIREBASE EVENTS

   The methods in this section provide an API to subscribe to particular
   events on the Firebase storage, and all the callbacks triggered internally
   to handle them.
   *************************************************************************
   */

  listenStores = () => {
    /*
     * Add a listener to the child_added event on any stores. This is used to
     * load the existing stores into the database, as well as add new ones
     * if they come live during the app's execution time.
     */
    const sPath = getAllStoresPublicPath();
    try {
      this._db.child(sPath).on('child_added', this._onStoreChildAdded,
        (error) => {
          logger.error(`child_added failed on path "%s". Error: %s`, sPath,
            error.toString());
        });

      this._db.child(sPath).on('child_changed', this._onStoreChildChanged,
        (error) => {
          logger.error(`child_changed failed on path "%s". Error: %s`, sPath,
            error.toString());
        });
    } catch (error) {
      logger.error(`Could not register child_added callback on path: "%s". \
        Error: %s`, sPath, error.toString());

      throw new Error('listenStores failed.');
    }
  }

  listenConversations = (uUid) => {
    /*
     * Add a listener to the child_added event on the user's conversations.
     * This triggers callbacks to indicate a conversation exists, and also
     * subscribes to the messages in that conversation.
     */
    const cPath = getAllUserConversationsPath(uUid);
    try {
      this._db.child(cPath).on('child_added',
        this._onUserConversationsChildAdded,
        (error) => {
          logger.error(`child_added failed on path "%s". Error: %s`, cPath,
            error.toString());
        });

      this._db.child(cPath).on('child_removed',
        this._onUserConversationsChildRemoved,
        (error) => {
          logger.error(`child_removed failed on path "%s". Error: %s`, cPath,
            error.toString());
        });
    } catch (error) {
      logger.error(`Could not register child_added callback on path: "%s". \
        Error: %s`, cPath, error.toString());

      throw new Error('listenConversations failed.');
    }
  }

  listenMimos = (uUid) => {
    /*
     * Add a listener to the child_added event on the user's pending mimos.
     * This triggers callbacks to indicate a pending mimo exists, and also
     * subscribes to the changes in those mimos.
     */
    const mPath = getAllUserPendingMimosPath(uUid);

    try {
      this._db.child(mPath).on('child_added',
        this._onUserPendingMimosChildAdded,
        (error) => {
          logger.error(`child_added failed on path "%s". Error: %s`, mPath,
            error.toString());
        });
    } catch (error) {
      logger.error(`Could not register child_added callback on path: "%s". \
        Error: %s`, mPath, error.toString());

      throw new Error('listenMimos failed.');
    }
  }

  /**
   * Callback triggered when an auth state changes.
   *
   * @param auth
   *  A Firebase-defined object for the current logged-in user.
   * @return
   *  Nothing.
   */
  _onAuthChanged = async (_user) => {
    if (_user) {
      this._db = firebase.database().ref();
      this._fs = firebase.storage().ref();
      this._user = _user;

      // Get the user object from the database.
      const user = await this._getOrCreateUser();

      // Now we can say we're logged in.
      logger.debug(`User "%s" is logged in.`, user.email);

      for (let callback of this._onLoginCallbacks) {
        callback(user);
      }
    } else {
      logger.debug(`No users are signed in.`);

      for (let callback of this._onLogoutCallbacks) {
        callback();
      }
    }
  }

  /**
   * Callback triggered by the child_added event on all users. Simply relays
   * the callback to the registered callbacks for this particular event,
   * unwrapping the Firebase-specific stuff.
   *
   * @param snapshot
   *  The given snapshot from Firebase.
   * @return
   *  Nothing.
   */
  _onUserValue = (snapshot) => {
    const user = snapshot.val();
    const uUid = snapshot.key;

    assertUser(user);

    for (let callback of this._onUserCallbacks) {
      callback(uUid, user);
    }
  }

  /**
   * Callback triggered by the child_added event on all stores. Simply relays
   * the callback to the registered callbacks for this particular event,
   * unwrapping the Firebase-specific stuff.
   *
   * @param snapshot
   *  The given snapshot from Firebase.
   * @return
   *  Nothing.
   */
  _onStoreChildAdded = (snapshot) => {
    const store = snapshot.val();
    const sUid = snapshot.key;

    assertStore(store);

    for (let callback of this._onStoreCallbacks) {
      callback(sUid, store);
    }
  }

  /**
   * Callback triggered by the child_changed event on all stores. Simply relays
   * the callback to the registered callbacks for this particular event,
   * unwrapping the Firebase-specific stuff.
   *
   * @param snapshot
   *  The given snapshot from Firebase.
   * @return
   *  Nothing.
   */
  _onStoreChildChanged = (snapshot) => {
    const store = snapshot.val();
    const sUid = snapshot.key;

    assertStore(store);

    this._onStoreChangedCallbacks.forEach((callback) => {
      callback(sUid, store);
    });
  }

  /**
   * Callback triggered by the child_added event on all user conversations.
   * Simply relays the callback to the registered callbacks for this particular
   * event, unwrapping the Firebase-specific stuff.
   *
   * Only after the conversations have been handled by all callbacks, we
   * subscribe to the conversation's messages. This is to avoid issues where
   * the messages callbacks arrive before the conversation is properly
   * setup, and then unexpected behavior arises.
   *
   * @param snapshot
   *  The given snapshot from Firebase.
   * @return
   *  Nothing.
   */
  _onUserConversationsChildAdded = async (snapshot) => {
    const cUid = snapshot.key;
    const conversation = await this._getConversationWithoutMessages(cUid);

    for (let callback of this._onConversationCallbacks) {
      callback(cUid, conversation);
    }

    // Listen to changes in the user's value (that is, a user can change
    // its name, profile picture and so on, and those will be seen).
    if (this._role == 'employee') {
      this._listenUserCallbacks(conversation.customer);
    } else {
      this._listenUserCallbacks(conversation.employee);
    }

    // Listen to all messages separately, after ensuring that the conversation
    // object is in place.
    this._listenMessageCallbacks(cUid);
  }

  /**
   * Callback triggered by the child_removed event on all user conversations.
   * Simply relays the callback to the registered callbacks for this particular
   * event, unwrapping the Firebase-specific stuff.
   *
   * FIXME: Ideally, one would stop listening to the old messages here. But
   * these will simply not exist, and the connection is not going to be used,
   * so there is not much of a point and it's more code to write, so nah.
   *
   * @param snapshot
   *  The given snapshot from Firebase.
   * @return
   *  Nothing.
   */
  _onUserConversationsChildRemoved = async (snapshot) => {
    const cUid = snapshot.key;

    for (let callback of this._onConversationRemovedCallbacks) {
      callback(cUid);
    }
  }

  /**
   * Callback triggered by the child_added event on all received messages.
   * Simply relays the callback to the registered callbacks for this particular
   * event, unwrapping the Firebase-specific stuff.
   *
   * @param snapshot
   *  The given snapshot from Firebase.
   * @return
   *  Nothing.
   */
  _onMessagesChildAdded = (snapshot) => {
    const message = snapshot.val();
    const mUid = snapshot.key;

    assertMessage(message);

    // From the message snapshot, go up by two levels, which yields the
    // conversation reference. Then, take the key: that's the cUid.
    const cSnapshot = snapshot.ref.parent.parent;
    const cUid = cSnapshot.key;

    for (let callback of this._onMessageCallbacks) {
      callback(cUid, mUid, message);
    }
  }

  /**
   * Callback triggered by the child_changed event on all received messages.
   * Simply relays the callback to the registered callbacks for this particular
   * event, unwrapping the Firebase-specific stuff.
   *
   * @param snapshot
   *  The given snapshot from Firebase.
   * @return
   *  Nothing.
   */
  _onMessagesChildChanged = (snapshot) => {
    const message = snapshot.val();
    const mUid = snapshot.key;

    assertMessage(message);

    // From the message snapshot, go up by two levels, which yields the
    // conversation reference. Then, take the key: that's the cUid.
    const cSnapshot = snapshot.ref.parent.parent;
    const cUid = cSnapshot.key;

    for (let callback of this._onMessageChangedCallbacks) {
      callback(cUid, mUid, message);
    }
  }

  /**
   * Callback triggered when a new pending mimo is added to the list of a
   * user's pending mimos.
   *
   * @param snapshot
   *  The given snapshot from Firebase.
   * @return
   *  Nothing.
   */
  _onUserPendingMimosChildAdded = async (snapshot) => {
    const mUid = snapshot.key;
    const mimo = await this._getMimo(mUid);

    if (this._role == 'employee') {
      this._listenUserCallbacks(mimo.customer);
    }

    for (let callback of this._onMimoCallbacks) {
      callback(mUid, mimo);
    }

    // Listen to change of status, so we realize when the mimo is accepted.
    this._listenMimoCallbacks(mUid);
  }

  /**
   * Callback triggered when a mimo that we are listening to is changed. If
   * the mimo is actually accepted, then we call the necessary callbacks.
   *
   * @param snapshot
   *  The given snapshot from Firebase.
   * @return
   *  Nothing.
   */
  _onMimoChildChanged = async (snapshot) => {
    if (snapshot.key != 'status') {
      return;
    }

    const mRef = snapshot.ref.parent;
    const mSnapshot = await mRef.once('value');
    const mimo = mSnapshot.val();
    const mUid = mSnapshot.key;

    assertMimo(mimo);

    // Mimo is pending, still: nothing to do, but wait...
    if (mimo.status.pending) {
      return;
    }

    for (let callback of this._onMimoAcceptedCallbacks) {
      callback(mUid, mimo);
    }
  }

  /*
   *************************************************************************
                            SERVER ACTION INTERFACE
   *************************************************************************
   */

  login = async (auth) => {
    try {
      // Authenticate based on the type of the auth object.
      switch (auth.type) {
        case Auth.Types.Google:
          await firebase.auth().setPersistence(
            firebase.auth.Auth.Persistence.LOCAL);
          const credential = firebase.auth.GoogleAuthProvider.credential(
            auth.google.idToken);

          await firebase.auth().signInWithCredential(credential);
          break;
        default:
          logger.error(`Authentication type "%s" not yet supported.`,
            auth.type);
          break;
      }
    } catch (error) {
      throw new Error('login failed.');
    }
  }

  logout = async () => {
    try {
      await firebase.auth().signOut();
    } catch (error) {
      logger.error(`Could not logout user "%s". Error: %s`, this.auth.uid,
        error.toString());
      throw new Error('logout failed.');
    }

    // Reset internal state.
    this._db = null;
    this._fs = null;
    this._lastUid = null;
    this._user = null;
  }

  sendMessage = async (cUid, mUid, message) => {
    assertMessage(message);

    const mPath = getConversationMessagePath(cUid, mUid);

    try {
      // If we have an image, upload it and set the URL of the uploaded image.
      if (message.content.image != null) {
        const downloadUrl = await this._uploadImage(cUid, mUid,
          message.content.image);
        message.content.image = downloadUrl;
      }

      await this._db.child(mPath).set(message);
    } catch (error) {
      logger.error(`Could not send message "%s" on conversation "%s". Error: \
        %s.`, mUid, cUid, error.toString());
      throw new Error('sendMessage failed.');
    }
  }

  sendMimo = async (mimo) => {
    assertMimo(mimo);

    // Create the mimo in the global mimo list.
    let mUid = null;
    try {
      mUid = await this._addMimo(mimo);
    } catch (error) {
      logger.error(`Could not add mimo. Error: %s`, error.toString());
      throw new Error('sendMimo failed.');
    }

    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    const body = JSON.stringify({
      sUids: mimo.stores,
      mUid: mUid,
    });

    try {
      await this._sendCloudFunctionRequest('api/sendMimo', 'POST', headers,
        body);

      // Add this mimo to the user's pending mimos.
      await this.addPendingMimoRef(mUid);
    } catch (error) {
      logger.error(`Could not send mimo "%s". Error: %s`, mUid,
        error.toString());
      throw new Error('sendMimo failed.');
    }
  }

  blockConversation = async (cUid, conversation) => {
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    const body = JSON.stringify({
      cUid: cUid,
      customerUid: conversation.customer,
      employeeUid: conversation.employee,
    });

    // Sends a system message to indicate the mimo has been concluded; this
    // is just in case the salesperson still has the app open, or something.
    const content = {
      title: 'Mimo concluído!',
      text: 'Novas mensagens não serão mais enviadas.',
    };
    const message = {
      content: content,
      sender: 'system',
      timestamp: this.getTimestamp(),
      readBy: { system: true },
    };
    await this.sendMessage(cUid, this.getUid(), message);

    try {
      await this._sendCloudFunctionRequest('api/blockConversation', 'POST',
        headers, body);
    } catch (error) {
      logger.error(`Failed to block conversation "%s". Error: %s`, cUid,
        error.toString());
      throw new Error('blockConversation failed.');
    }
  }

  addConversationRef = async (conversationUid, userUid) => {
    const currentUserUid = this._user.uid;
    const cPath = getUserConversationPath(currentUserUid, conversationUid);

    try {
      await this._db.child(cPath).set(userUid);
    } catch (error) {
      logger.error(`Could not add user conversation on path "%s". Error: %s`,
        cPath, error.toString());
      throw new Error('addConversationRef failed.');
    }
  }

  addPendingMimoRef = async (mUid) => {
    const uUid = this._user.uid;

    const mPath = getUserPendingMimoPath(uUid, mUid);

    try {
      await this._db.child(mPath).set(true);
    } catch (error) {
      logger.error(`Could not add user pending mimo on path "%s". Error: %s`,
        mPath, error.toString());
      throw new Error('addPendingMimoRef failed.');
    }
  }

  removeUserPendingMimoRef = async (mUid) => {
    const uUid = this._user.uid;

    // Remove the pending mimo, which came in form of the snapshot.
    const mPath = getUserPendingMimoPath(uUid, mUid);

    try {
      this._db.child(mPath).remove();
    } catch (error) {
      logger.error(`Could not remove user pending mimo on path "%s". Error: %s`,
        mPath, error.toString());
      throw new Error('removePendingMimoRef failed.');
    }
  }

  acceptMimo = async (mUid, mimo) => {
    const uUid = this._user.uid;

    let cPath = getAllUserConversationsPath(uUid);
    let mimoConversationUid = null;

    try {
      // Look for a conversation with the mimo's customer. If there is none,
      // make one. If there is one, that's the one to use.

      // FIXME: Is there a better way to write this, other than this gross
      // try-catch block?
      let cSnapshot = null;
      try {
        cSnapshot = await this._db.child(cPath).orderByValue()
          .equalTo(mimo.customer).once('value');
      } catch (error) {}


      // Conversation did not exist: add a conversation, and a reference to
      // it in the current user.
      if (cSnapshot == null || cSnapshot.val() == null) {
        mimoConversationUid = await this._addConversation(mimo.customer,
          uUid);

        // Include this conversation uid in the user's conversations, with the
        // sending customer.
        this.addConversationRef(mimoConversationUid, mimo.customer);
      } else {
        // FIXME: Is there a better way to get this value?
        mimoConversationUid = Object.keys(cSnapshot.val())[0];
      }

      // Change mimo status atomically with a transaction.
      const mPath = getMimoPath(mUid);
      const tResponse = this._db.child(mPath).transaction((mimo) => {
        // Do not change status if mimo is not pending anymore!
        if (!mimo.status.pending) {
          return null;
        }

        const updatedMimo = {
          ...mimo,
          status: {
            pending: false,
            accepted: {
              conversation: mimoConversationUid,
              employee: uUid,
            },
          },
        };
        return updatedMimo;
      },
      (error, committed, snapshot) => {
        if (error) {
          logger.error(`Transaction on path "%s" failed. Error: %s`, uPath,
            error.toString());
        } else if (committed) {
          logger.log(`Successfully accepted mimo.`);
        }
      }, false);

      // Send system message alerting this mimo in the conversation, so that
      // it shows up to users.
      const content = {
        title: 'Novo mimo!',
        text: mimo.message,
      };
      const message = {
        content: content,
        sender: 'system',
        timestamp: this.getTimestamp(),
        readBy: { system: true },
      };

      this.sendMessage(mimoConversationUid, this.getUid(), message);
    } catch (error) {
      logger.error(`Could not accept mimo. Error: %s`, error.toString());
      throw new Error('acceptMimo failed.');
    }
  }

  markMessageRead = async (cUid, mUid, uUid) => {
    const mPath = getConversationMessageReadByUserPath(cUid, mUid, uUid);

    try {
      await this._db.child(mPath).set(true);
    } catch (error) {
      logger.error(`Could not mark message "%s" as read by "%s" on \
        conversation "%s". Error: %s.`, mUid, uUid, cUid, error.toString());
      throw new Error('markMessageRead failed.');
    }
  }

  savePushNotification = async (token) => {
    const uPath = getUserPrivatePath(this._user.uid);

    try {
      await this._db.child(uPath).update({
        pushNotificationToken: token,
      });
    } catch (error) {
      logger.error(`Could not save push notification info. Error: %s`,
        error.toString());
      throw new Error('savePushNotification failed.');
    }
  }

  getTimestamp = () => {
    return firebase.database.ServerValue.TIMESTAMP;
  }

  getUid = () => {
    let r = Math.random();
    let date = new Date();
    let uid = date.getTime().toString(36) + r.toString(36).substring(2);

    while (uid.localeCompare(this._lastUid) <= 0) {
      logger.log(`Generated uid "%s" is smaller than previous "%s".`, uid,
        this._lastUid);

      r = Math.random();
      date = new Date();
      uid = date.getTime().toString(36) + r.toString(36).substring(2);
    }

    this._lastUid = uid;
    return uid;
  }

  /*
   *************************************************************************
                            SERVER INTERNAL METHODS

   Useful methods for implementing the actions and callbacks and all that
   fun stuff.
   *************************************************************************
   */

  /**
   * From the Firebase user (in this._user), try to fetch the user's information
   * within the database. If the user does not yet exist, create it. The role
   * of the user is set to whatever role this Server instance expects, from
   * the options on initialization.
   *
   * @return
   *  A user object, as described in Server.
   */
  _getOrCreateUser = async () => {
    // Builds the profile from Firebase's user object.
    const names = this._user.displayName.split(' ');
    const firstName = names.length > 0 ? names[0] : '';
    const lastName = names.length > 1 ? names[names.length - 1] : '';
    const profile = {
      firstName: firstName,
      lastName: lastName,
      email: this._user.email,
      photo: this._user.photoURL,
      role: this._role,
    };

    const uUid = this._user.uid;
    const uPath = getUserPublicPath(uUid);

    // Atomically check if a user exists, and creates one if not.
    const tResponse = await this._db.child(uPath).transaction((user) => {
        if (user === null) {
          return profile;
        }
      }, (error, committed, snapshot) => {
        if (error) {
          logger.error(`Transaction on path "%s" failed. Error: %s`, uPath,
            error.toString());
        } else if (committed) {
          logger.log(`User "%s" successfully created.`, uUid);
        } else {
          logger.log(`User "%s" found.`, uUid);
        }
      }, false);

    // Return the user profile, but make sure to include the uUid.
    const uSnapshot = tResponse.snapshot;
    if (uSnapshot == null || uSnapshot.val() == null) {
      throw new Error('login failed.');
    }

    const user = {...uSnapshot.val(), uid: uUid};
    assertUser(user);

    // Role mismatch: do not login!
    if (user.role != this._role) {
      logger.error(`Login roles did not match; cannot login.`);
      throw new Error('login failed.');
    }

    return user;
  }

  /**
   * Creates a mimo under the global mimo list.
   *
   * @param mimo
   *  The mimo object, as described in Server.
   */
  _addMimo = async (mimo) => {
    const mUid = this.getUid();
    const mPath = getMimoPath(mUid);

    await this._db.child(mPath).set(mimo);
    return mUid;
  }

  /**
   * Creates a new conversation between customer and employee. Does not add
   * references.
   *
   * @param customerUid
   *  The customer unique identifier.
   * @param employeeUid
   *  The employee unique identifier.
   * @return
   *  The conversation unique identifier created.
   */
  _addConversation = async (customerUid, employeeUid) => {
    const cUid = this.getUid();

    // Create a new conversation.
    const cPath = getConversationPath(cUid);
    await this._db.child(cPath).set({
      customer: customerUid,
      employee: employeeUid,
      messages: [],
    });

    return cUid;
  }

  /**
   * Gets a conversation from a unique identifier, without any of its messages.
   *
   * @param cUid
   *  The conversation unique identifier.
   * @return
   *  A conversation object, without the messages.
   */
  _getConversationWithoutMessages = async (cUid) => {
    const cPath = getConversationPath(cUid);
    const customerUidPath = cPath + '/customer';
    const employeeUidPath = cPath + '/employee';

    const customerUid = await this._db.child(customerUidPath).once('value');
    const employeeUid = await this._db.child(employeeUidPath).once('value');

    return {
      customer: customerUid.val(),
      employee: employeeUid.val(),
      messages: [],
    };
  }

  /**
   * Gets a mimo from a unique identifier.
   *
   * @param mUid
   *  The mimo unique identifier
   * @return
   *  A mimo object.
   */
  _getMimo = async (mUid) => {
    const mPath = getMimoPath(mUid);
    const mimo = await this._db.child(mPath).once('value');

    return mimo.val();
  }

  /**
   * Uploads an image from a given file path.
   *
   * @param cUid
   *  The conversation unique identifier in which this image belongs.
   * @param mUid
   *  The message unique identifier containing this image.
   * @param image
   *  The image URI in the device.
   * @throws
   *  Throws error if the upload fails.
   * @return
   *  A usable URL for the uploaded image.
   */
  _uploadImage = async (cUid, mUid, image) => {
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'multipart/form-data',
    };
    const body = new FormData();
    body.append('image', {
      uri: image,
      name: mUid,
      type: 'image/jpeg'
    });
    body.append('cUid', cUid);
    body.append('mUid', mUid);

    await this._sendCloudFunctionRequest('api/uploadImage', 'POST', headers,
      body);

    const iPath = getImagePath(cUid, mUid);
    const downloadUrl = await this._fs.child(iPath).getDownloadURL();
    return downloadUrl;
  }

  /**
   * Sends a cloud function request specified to a path, using a given method,
   * with custom headers (already fetching the Firebase token) and with
   * a given body.
   *
   * @param path
   *  The relative path where the function is found.
   * @param method
   *  The method for the request (usually, POST).
   * @param headers
   *  An object representing the headers (Accept, Content-Type).
   * @param body
   *  The body of the message (already formatted to Content-Type).
   * @return
   *  Nothing.
   */
  _sendCloudFunctionRequest = async (path, method, headers, body) => {
    // Fetch a firebase token.
    const firebaseToken = await this._user.getIdToken();
    const res = await fetch(
      'https://us-central1-mimo-69109.cloudfunctions.net/' + path, {
        method: method,
        body: body,
        headers: {
          ...headers,
          Authorization: 'Bearer ' + firebaseToken,
      }
    });

    // Request succeeded, but server responded not OK.
    if (res.status != 200) {
      logger.error(`Request received at Cloud Functions, but "%s" status.`,
        res.status);
      throw new Error('_sendCloudFunctionRequest failed.');
    }
  }

  /**
   * Listens to all child_added/child_changed events on the conversation's
   * messages.
   *
   * @param cUid
   *  The conversation unique identifier for which to listen.
   * @return
   *  Nothing.
   */
  _listenMessageCallbacks = (cUid) => {
    const mPath = getAllConversationMessagesPath(cUid);

    try {
      this._db.child(mPath).on('child_added', this._onMessagesChildAdded,
        (error) => {
          logger.error(`child_added failed on path "%s". Error: %s`, mPath,
            error.toString());
        });
      this._db.child(mPath).on('child_changed', this._onMessagesChildChanged,
        (error) => {
          logger.error(`child_changed failed on path "%s". Error: %s`, mPath,
            error.toString());
        });
    } catch (error) {
      logger.error(`Could not register child_added callback on path: "%s". \
        Error: %s`, mPath, error.toString());
    }
  }

  /**
   * Listens to all value events on a user's public path. Notice that this
   * is ONLY the public path.
   *
   * @param uUid
   *  The user unique identifier for which to listen.
   * @return
   *  Nothing.
   */
  _listenUserCallbacks = (uUid) => {
    logger.debug(`Listening to user callbacks: %s`, uUid);
    const uPath = getUserPublicPath(uUid);

    try {
      this._db.child(uPath).on('value', this._onUserValue,
        (error) => {
          logger.error(`value callback failed on path "%s". Error: %s`, uPath,
            error.toString());
        });
    } catch (error) {
      logger.error(`Could not register value callback on path: "%s". \
        Error: %s`, uPath, error.toString());
    }
  }

  /**
   * Listens to callbacks related to a specific mimo.
   *
   * @param mUid
   *  The mimo unique identifier for which to listen.
   * @return
   *  Nothing.
   */
  _listenMimoCallbacks = (mUid) => {
    const mPath = getMimoPath(mUid);

    try {
      this._db.child(mPath).on('child_changed', this._onMimoChildChanged,
        (error) => {
          logger.error(`child_changed failed on path "%s". Error: %s`, mPath,
            error.toString());
        });
    } catch (error) {
      logger.error(`Could not register callback on path: "%s". \
        Error: %s`, mPath, error.toString());
    }
  }
}
