import { binarySearch } from '../util/Helpers';
import { logger } from '../util/Logger';

export default class MimoManager {
  constructor(stateManager, server, options) {
    logger.debug(`MimoManager.constructor: [options = %s]`, options);

    this._server = server;
    this._stateManager = stateManager;

    /*
     * this._mimos contains relevant mimos for the current user. If the user is
     * a customer, this is not used for anything. If the user is an employee,
     * this consists of all pending mimos.
     */
    this._mimos = [];

    if (options.role == 'customer') {
      this._server.registerOnLoginCallback(this._onLogin);
      this._server.registerOnLogoutCallback(this._onLogout);
      this._server.registerOnMimoCallback(this._onMimoCustomer);
      this._server.registerOnMimoAcceptedCallback(this._onMimoAcceptedCustomer);
    } else if (options.role == 'employee') {
      this._server.registerOnLoginCallback(this._onLogin);
      this._server.registerOnLogoutCallback(this._onLogout);
      this._server.registerOnMimoCallback(this._onMimoEmployee);
      this._server.registerOnMimoAcceptedCallback(this._onMimoAcceptedEmployee);
    } else {
      throw new Error('Invalid user role.');
    }
  }

  _mimoCmp = (mimo, mUid) => {
    return mimo.uid.localeCompare(mUid);
  };

  /**
   * Returns a copy of the mimo object stored in the state. The mimo must exist;
   * the only way this function should be called is if that is guaranteed.
   *
   * @param mUid
   *  The mimo unique identifier for which to retrieve.
   * @return
   *  The mimo object (as described in the Server).
   */
  getPendingMimo = (mUid) => {
    logger.debug(`MimoManager.getPendingMimo: [mUid = %s]`, mUid);

    const index = binarySearch(this._mimos, this._mimoCmp, mUid);
    if (index == null) {
      return null;
    }

    return {...this._mimos[index]};
  }

  /**
   * Returns a copy of all pending mimos in the state.
   *
   * @return
   *  An array containing all mimo objects (as specified in Server).
   */
  getPendingMimos = () => {
    logger.debug(`MimoManager.getPendingMimos`);

    return [...this._mimos];
  }

  /**
   * Creates a mimo in the server, and sends a request to every selected store
   * corresponding to that mimo.
   *
   * @param _mimo
   *  The mimo request object (as specified in the Server).
   * @return
   *  Nothing.
   */
  sendMimo = async (_mimo) => {
    logger.debug(`sendMimo: [_mimo = %s]`, _mimo);

    const user = this._stateManager.getUser();
    if (user.role != 'customer') {
      return;
    }

    // Construct the mimo expected by the Server instance.
    const mimo = {
      customer: user.uid,
      stores: _mimo.stores,
      message: _mimo.message,
      timestamp: this._server.getTimestamp(),
      status: {
        pending: true,
      },
    };

    await this._server.sendMimo(mimo);
  }

  /**
   * Requests that the given mimo be rejected by the current employee.
   *
   * @param mUid
   *  The mimo unique identifier given.
   * @return
   *  Nothing.
   */
  rejectMimo = async (mUid) => {
    logger.debug(`MimoManager.rejectMimo: [mUid = %s]`, mUid);

    const index = binarySearch(this._mimos, this._mimoCmp, mUid);
    if (index == null) {
      return;
    }

    this._mimos.splice(index, 1);

    await this._server.removeUserPendingMimoRef(mUid);
    this._stateManager.updateComponents();
  }

  /**
   * Requests that the given mimo be accepted by the current employee. If the
   * request succeeds, deletes the mimo from the pending list.
   *
   * @param mUid
   *  The mimo unique identifier given.
   * @return
   *  Nothing.
   */
  acceptMimo = async (mUid) => {
    logger.debug(`MimoManager.acceptMimo: [mUid = %s]`, mUid);

    const mimo = this.getPendingMimo(mUid);
    const user = this._stateManager.getUser();
    if (user.role != 'employee') {
      return;
    }

    await this._server.acceptMimo(mUid, mimo);
  }

  /**
   * Callback triggered when a mimo is added for a customer. As of now, this
   * is not used for anything, really.
   *
   * @param mUid
   *  The mimo unique identifier added.
   * @param mimo
   *  The mimo object, as described in Server.
   * @return
   *  Nothing.
   */
  _onMimoCustomer = async (mUid, mimo) => {
    logger.debug(`MimoManager._onMimoCustomer: [mUid = %s], [mimo = %s]`, mUid,
      mimo);

    const user = this._stateManager.getUser();
    if (user.role != 'customer') {
      return;
    }

    this._mimos.push({...mimo, uid: mUid});

    // It may be redundant to add the mimo and then call onAcceptedCustomer,
    // but this avoids having to change API calls to the server, so be it.
    if (!mimo.status.pending) {
      await this._onMimoAcceptedCustomer(mUid, mimo);
      return;
    }

    this._stateManager.updateComponents();
  }

  /**
   * Callback triggered when a mimo is added for an employee. The mimo is added
   * to the list of mimos if it is pending; if it is not pending, it is removed
   * from the list.
   */
  _onMimoEmployee = async (mUid, mimo) => {
    logger.debug(`MimoManager._onMimoEmployee: [mUid = %s], [mimo = %s]`, mUid,
      mimo);

    const user = this._stateManager.getUser();
    if (user.role != 'employee') {
      return;
    }

    // Mimo is not pending: should be removed from this list.
    if (!mimo.status.pending) {
      await this._server.removeUserPendingMimoRef(mUid);
      return;
    }

    this._mimos.push({...mimo, uid: mUid});
    this._stateManager.updateComponents();
  }

  /**
   * Callback triggered when a mimo that the employee is watching is accepted.
   * Whether we were the employee who accepted or not, this mimo must be
   * removed from the pending list of mimos.
   *
   * @param mUid
   *  The mimo unique identifier for the mimo accepted.
   * @param mimo
   *  The mimo object, as described in Server.
   * @return
   *  Nothing.
   */
  _onMimoAcceptedEmployee = async (mUid, mimo) => {
    logger.debug(`MimoManager._onMimoAcceptedEmployee: [mUid = %s], \
      [mimo = %s]`, mUid, mimo);

    const user = this._stateManager.getUser();
    if (user.role != 'employee') {
      return;
    }

    const index = binarySearch(this._mimos, this._mimoCmp, mUid);
    if (index == null) {
      return;
    }

    this._mimos.splice(index, 1);

    await this._server.removeUserPendingMimoRef(mUid);
    this._stateManager.updateComponents();
  }

  /**
   * Callback triggered when a mimo has been accepted, when the user still
   * thought it was pending. The method registers the mimo conversation (already
   * created by the employee who accepted the mimo), and removes the mimo from
   * the list of pending mimos for this user.
   *
   * By adding the conversation before deleting the pending request, we
   * guarantee no race conditions, since the worst that can happen is that
   * the conversation will be created and not the pending request for the user;
   * this will be settled the next time the user logs in, anyway, and is not
   * harmful nor inconsistent.
   *
   * @param mUid
   *  The mimo unique identifier that has been accepted.
   * @param mimo
   *  The mimo object, as described in Server.
   * @return
   *  Nothing.
   */
  _onMimoAcceptedCustomer = async (mUid, mimo) => {
    logger.debug(`MimoManager._onMimoAcceptedCustomer: [mUid = %s], \
      [mimo = %s]`, mUid, mimo);

    const user = this._stateManager.getUser();
    if (user.role != 'customer') {
      return;
    }

    const cUid = mimo.status.accepted.conversation;
    const uUid = mimo.status.accepted.employee;

    // Add the conversation to the user's active conversations.
    await this._server.addConversationRef(cUid, uUid);

    // Remove the pending mimo from the user's active conversations.
    await this._server.removeUserPendingMimoRef(mUid);
  }

  /**
   * Callback triggered when the server has been Loginenticated.
   *
   * @param user
   *  The user object received from the server, containing the current user's
   *  profile.
   * @return
   *  Nothing.
   */
  _onLogin = (user) => {
    logger.debug(`MimoManager._onLogin: [user = %s]`, user);

    this._server.listenMimos(user.uid);
  }

  /**
   * Callback triggered when the server has logged out. Resets internal state.
   *
   * @return
   *  Nothing.
   */
  _onLogout = () => {
    logger.debug(`MimoManager._onLogout`);

    this._mimos = [];
    this._stateManager.updateComponents();
  }
}
