import { binarySearch } from '../util/Helpers';
import { logger } from '../util/Logger';

export default class UserManager {
  constructor(stateManager, server, options) {
    logger.debug(`UserManager.constructor: [options = %s]`, options);

    this._server = server;
    this._stateManager = stateManager;

    /*
     * this._auth contains the current user's information.
     */
    this._auth = {};

    /*
     * this._users contains information on users (the ones we have conversations
     * with).
     */
    this._users = [];

    // Registers callback on authentication with server.
    this._server.registerOnLoginCallback(this._onLogin);
    this._server.registerOnLogoutCallback(this._onLogout);
    this._server.registerOnUserCallback(this._onUser);
  }

  /**
   * Helper function to perform binary search.
   *
   * @param uUid
   *  The user unique identifier.
   * @param user
   *  The user to look for the cUid.
   * @return
   *  The comparison between the two values (negative, zero, positive).
   */
  _userCmp = (user, uUid) => {
    return user.uid.localeCompare(uUid);
  };

  /**
   * Returns a copy of the state of the currently logged in user.
   *
   * @return
   *  An object containing the user's information (as specified in the class
   *  description).
   */
  getCurrentUser = () => {
    logger.debug(`UserManager.getCurrentUser`);

    return {...this._auth};
  }

  getUser = (uUid) => {
    logger.debug(`UserManager.getUser: [uUid = %s]`, uUid);
    if (uUid == null) {
      return this.getCurrentUser();
    }

    const index = binarySearch(this._users, this._userCmp, uUid);

    // User may not have been loaded yet: this all depends on ordering.
    if (index == null) {
      return null;
    }

    return {...this._users[index]};
  }

  /**
   * Login the user with the server.
   *
   * @param auth
   *  An authentication object to be passed to Server. Refer to the
   *  documentation of Server for more details.
   * @return
   *  Nothing.
   */
  login = async (auth) => {
    logger.debug(`UserManager.login: [auth = %s]`, auth);

    await this._server.login(auth);
  }

  /**
   * Logout the user with the server. This should take care of removing any
   * callbacks and event listener that were associated with this session;
   * the StateManager does not keep track of any of that state.
   *
   * @return
   *  Nothing.
   */
  logout = async () => {
    logger.debug(`UserManager.logout`);

    await this._server.logout();
  }

  /**
   * Callback triggered on the event that a user is added.
   *
   * @param uUid
   *  The user unique identifier associated to this user.
   * @param user
   *  The user object (as specified in the Server).
   * @return
   *  Nothing.
   */
  _onUser = (uUid, user) => {
    logger.debug(`UserManager._onUser: [uUid = %s], [user = %s]`, uUid,
      user);

    const index = binarySearch(this._users, this._userCmp, uUid);
    if (index == null) {
      this._users.push({...user, uid: uUid});
    } else {
      this._users[index] = {...user, uid: uUid};
    }

    // FIXME: Add the user in the correct place in the array, instead of
    // forcefully sorting it. Or, keep this a better data structure, or
    // anything really. This is because users are requested fairly out-of-
    // order, and then it's screwing up the binary search.
    this._users.sort(this._userCmp);

    this._stateManager.updateComponents();
  }

  /**
   * Callback triggered when the server has been authenticated. Triggers an
   * update to registered components: now the user is logged in.
   *
   * @param user
   *  The user object received from the server, containing the current user's
   *  profile.
   * @return
   *  Nothing.
   */
  _onLogin = (user) => {
    logger.debug(`UserManager._onAuth: [user = %s]`, user);

    this._auth = user;
    this._stateManager.updateComponents();
  }

  /**
   * Callback triggered when the server has logged out. Resets internal state.
   *
   * @return
   *  Nothing.
   */
  _onLogout = (user) => {
    logger.debug(`UserManager._onLogout`);

    this._auth = {};
    this._users = [];
    this._stateManager.updateComponents();
  }
}
