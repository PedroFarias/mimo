import { binarySearch } from '../util/Helpers';
import { logger } from '../util/Logger';

export default class StoreManager {
  constructor(stateManager, server, options) {
    logger.debug(`StoreManager.constructor: [options = %s]`, options);

    this._server = server;
    this._stateManager = stateManager;

    /*
     * this._stores contains the state of the store list screen and store
     * details screen. For now, we keep all of the stores information here;
     * it is possible that in the future, we'd like to fetch that information
     * only when needed. This structure also keeps pagination information.
     */
    this._stores = new Map();

    // Registers the two callbacks: stores added, and stores changed.
    this._server.registerOnLoginCallback(this._onLogin);
    this._server.registerOnLogoutCallback(this._onLogout);
    this._server.registerOnStoreCallback(this._onStore);
    this._server.registerOnStoreChangedCallback(this._onStoreChanged);
  }

  /**
   * Helper function to perform binary search.
   *
   * @param sUid
   *  The store unique identifier.
   * @param store
   *  The store to look for the cUid.
   * @return
   *  The comparison between the two values (negative, zero, positive).
   */
  _storeCmp = (store, sUid) => {
    return store.uid.localeCompare(sUid);
  };

  /**
   * Returns a copy of the store object stored in the state. The store must
   * exist; the only way this function should be called is if that is
   * guaranteed.
   *
   * @param sUid
   *  The store unique identifier for which to retrieve.
   * @return
   *  The store object (as specified in the Server).
   */
  getStore = (sUid) => {
    logger.debug(`StoreManager.getStore: [sUid = %s]`, sUid);

    if (!this._stores.has(sUid)) {
      return null;
    }

    return {...this._stores.get(sUid)};
  }

  /**
   * Returns a copy of all stores in the state.
   *
   * @return
   *  An array containing all store objects (as specified in the class
   *  description).
   */
  getStores = () => {
    logger.debug(`StoreManager.getStores`);

    logger.debug(`%s`, [...this._stores.values()]);
    return Array.from(this._stores.values());
  }

  /**
   * Callback triggered on the event that a store is added.
   *
   * @param sUid
   *  The store unique identifier associated to this store.
   * @param store
   *  The store object (as specified in the Server).
   * @return
   *  Nothing.
   */
  _onStore = (sUid, store) => {
    logger.debug(`StoreManager._onStore: [sUid = %s], [store = %s]`, sUid,
      store);

    this._stores.set(sUid, {...store, uid: sUid});

    this._stateManager.updateComponents();
  }

  /**
   * Callback triggered on the event that a store's information has changed.
   *
   * @param sUid
   *  The store unique identifier associated to this store.
   * @param store
   *  The store object (as specified in the Server).
   * @return
   *  Nothing.
   */
  _onStoreChanged = (sUid, store) => {
    logger.debug(`StoreManager._onStoreChanged: [sUid = %s], [store = %s]`,
      sUid, store);

    this._stores.set(sUid, {...store, uid: sUid});

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
  _onLogin = (_) => {
    logger.debug(`StoreManager._onLogin`);

    this._server.listenStores();
  }

  /**
   * Callback triggered when the server has logged out. Resets internal state.
   *
   * @return
   *  Nothing.
   */
  _onLogout = (user) => {
    logger.debug(`StoreManager._onLogout`);

    this._stores = new Map();
    this._stateManager.updateComponents();
  }
}
