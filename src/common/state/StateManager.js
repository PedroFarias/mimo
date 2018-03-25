import FirebaseServer from '../api/FirebaseServer';
import { logger } from '../util/Logger';

import UserManager from './UserManager';
import StoreManager from './StoreManager';
import ConversationManager from './ConversationManager';
import MimoManager from './MimoManager';
import PushManager from './PushManager';

import assert from 'assert';

/**
 * Manages the state and general interactions with a backend object. Provides
 * functionality that any component can request, and triggers a re-render of
 * the application whenever necessary.
 *
 * In other words, does what redux with redux-thunk is supposed to do, but in
 * a much simpler and less annoying way. Plus, it handles connections to the
 * Server, and does all of that nicely and cleanly.
 *
 * Separates functionality into other four managers, because I was going crazy
 * reading the entire file all the time. This guy, in itself, only relays
 * information to those managers.
 */
export class StateManager {
  initialize = (options) => {
    // Initializes the server object that we interact with.
    if (options.server.type === 'firebase') {
      this._server = new FirebaseServer(options.server);
    } else {
      throw new Error('Only serverType supported is "firebase".');
    }

    if (options.userManager !== undefined) {
      this._userManager = new UserManager(this, this._server,
        options.userManager);
    } else {
      logger.warn('StateManager initialized without a UserManager.');
    }

    if (options.storeManager !== undefined) {
      this._storeManager = new StoreManager(this, this._server,
        options.storeManager);
    } else {
      logger.warn('StateManager initialized without a StoreManager.');
    }

    if (options.conversationManager !== undefined) {
      this._conversationManager = new ConversationManager(this, this._server,
        options.conversationManager);
    } else {
      logger.warn('StateManager initialized without a ConversationManager.');
    }

    if (options.mimoManager !== undefined) {
      this._mimoManager = new MimoManager(this, this._server,
        options.mimoManager);
    } else {
      logger.warn('StateManager initialized without a MimoManager.');
    }

    if (options.pushManager !== undefined) {
      this._pushManager = new PushManager(this, this._server,
        options.pushManager);
    } else {
      logger.warn('StateManager initialized without a PushManager.');
    }

    // Initializes server state; does not yet start listening to events,
    // since we may not be authenticated yet. Each Manager takes care of
    // requesting their required events to be listened to.
    this._server.initialize();

    /*
     * this._registeredComponents contains a set of all components that must be
     * re-rendered whenever state changes occur.
     */
    this._registeredComponents = new Set();
  }

  /*
   *************************************************************************
                              COMPONENT MANAGEMENT

   Methods to register and update registered components that want to be
   re-render after state changes.
   *************************************************************************
   */

  /**
   * Registers a component for further re-rendering after state changes.
   *
   * @param component
   *  The component object which will be updated.
   * @return
   *  Nothing.
   */
  registerComponent = (component) => {
    this._registeredComponents.add(component);
  }

  /**
   * Deregister a component from receiving updates.
   *
   * @param component
   *  The component object which will be updated.
   * @return
   *  Nothing.
   */
  deregisterComponent = (component) => {
    if (!this._registeredComponents.has(component)) {
      throw new Error('Component is not registered.');
    }
    this._registeredComponents.delete(component);
  }

  /**
   * Updates all registered components. Should be called after state changes.
   *
   * @return
   *  Nothing.
   */
  updateComponents = () => {
    this._registeredComponents.forEach((component) => {
      component.forceUpdate();
    });
  }

  /*
   *************************************************************************
                           STATE MANAGER GETTERS

   Provides access to the state in this object. Callers should refrain from
   accessing the state directly, and use these getters at all times. The
   getters will yield merely a copy of the state, avoiding any possible
   issues with components modifying state when they shouldn't.

   This is a bit of a performance penalty, and can be removed later on if
   needed. But, it makes development incredibly more sane. (Yes, I did
   modify state unknowingly in a component that had no reason to do it...)
   *************************************************************************
   */

  getCurrentUser = () => {
    if (this._userManager == null) {
      throw new Error('UserManager does not exist.');
    }
    return this._userManager.getCurrentUser();
  }

  getUser = (uUid=null) => {
    if (this._userManager == null) {
      throw new Error('UserManager does not exist.');
    }
    return this._userManager.getUser(uUid);
  }

  getStore = (sUid) => {
    if (this._storeManager == null) {
      throw new Error('StoreManager does not exist.');
    }
    return this._storeManager.getStore(sUid);
  }

  getStores = () => {
    if (this._storeManager == null) {
      throw new Error('StoreManager does not exist.');
    }
    return this._storeManager.getStores();
  }

  getConversation = (cUid) => {
    if (this._conversationManager == null) {
      throw new Error('ConversationManager does not exist.');
    }
    return this._conversationManager.getConversation(cUid);
  }

  getConversations = () => {
    if (this._conversationManager == null) {
      throw new Error('ConversationManager does not exist.');
    }
    return this._conversationManager.getConversations();
  }

  getPendingMimo = (mUid) => {
    if (this._mimoManager == null) {
      throw new Error('MimoManager does not exist.');
    }
    return this._mimoManager.getPendingMimo(mUid);
  }

  getPendingMimos = () => {
    if (this._mimoManager == null) {
      throw new Error('MimoManager does not exist.');
    }
    return this._mimoManager.getPendingMimos();
  }

  getTimestamp = () => {
    if (this._server == null) {
      throw new Error('Server does not exist.');
    }
    return this._server.getTimestamp();
  }

  /*
   *************************************************************************
                          STATE MANAGER ACTIONS

   Exposed interface to the rest of the app. Includes all actions that can
   affect state, and relays these actions to the Server.
   *************************************************************************
   */

  login = async (auth) => {
    if (this._userManager == null) {
      throw new Error('UserManager does not exist.');
    }
    await this._userManager.login(auth);
  }

  logout = async () => {
    if (this._userManager == null) {
      throw new Error('UserManager does not exist.');
    }
    await this._userManager.logout();
  }

  markMessagesRead = async (cUid) => {
    if (this._conversationManager == null) {
      throw new Error('ConversationManager does not exist.');
    }
    await this._conversationManager.markMessagesRead(cUid);
  }

  sendMessage = async (cUid, message) => {
    if (this._conversationManager == null) {
      throw new Error('ConversationManager does not exist.');
    }
    await this._conversationManager.sendMessage(cUid, message);
  }

  blockConversation = async (cUid) => {
    if (this._conversationManager == null) {
      throw new Error('ConversationManager does not exist.');
    }
    await this._conversationManager.blockConversation(cUid);
  }

  sendMimo = async (mimo) => {
    if (this._mimoManager == null) {
      throw new Error('MimoManager does not exist.');
    }
    await this._mimoManager.sendMimo(mimo);
  }

  acceptMimo = async (mUid) => {
    if (this._mimoManager == null) {
      throw new Error('MimoManager does not exist.');
    }
    await this._mimoManager.acceptMimo(mUid);
  }

  rejectMimo = async (mUid) => {
    if (this._mimoManager == null) {
      throw new Error('MimoManager does not exist.');
    }
    await this._mimoManager.rejectMimo(mUid);
  }
}

export const stateManager = new StateManager();
