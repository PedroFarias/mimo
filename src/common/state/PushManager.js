import { Permissions, Notifications } from 'expo';

import { binarySearch } from '../util/Helpers';
import { logger } from '../util/Logger';

import assert from 'assert';

export default class PushManager {
  constructor(stateManager, server, options) {
    logger.debug(`PushManager.constructor: [options = %s]`, options);

    this._server = server;
    this._stateManager = stateManager;

    // Registers callback on authentication with server.
    this._server.registerOnLoginCallback(this._onLogin);
    this._server.registerOnLogoutCallback(this._onLogout);
  }

  /**
   * Registers for push notifications with expo. This code is mostly taken from
   * https://docs.expo.io/versions/latest/guides/push-notifications.html
   * since it does exactly what we were looking for.
   */
  _registerForPushNotificationsAsync = async () => {
    console.log("REGISTERING");
    const { status: existingStatus } = await Permissions.getAsync(
      Permissions.NOTIFICATIONS
    );
    let finalStatus = existingStatus;

    logger.debug(`Existing status: %s`, existingStatus);

    // Only ask if permissions have not already been determined, because
    // iOS won't necessarily prompt the user a second time.
    if (existingStatus !== 'granted') {
      // Android remote notification permissions are granted during the app
      // install, so this will only ask on iOS
      const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
      finalStatus = status;
    }

    // Stop here if the user did not grant permissions
    if (finalStatus !== 'granted') {
      return;
    }
    console.log("GRANTED");

    // Get the token that uniquely identifies this device
    let token = await Notifications.getExpoPushTokenAsync();

    console.log("TOKEEEEEEN");
    console.log(token);

    // Request that server saves it.
    await this._server.savePushNotification(token);
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
  _onLogin = async (user) => {
    logger.debug(`PushManager._onLogin: [user = %s]`, user);

    await this._registerForPushNotificationsAsync();
  }

  /**
   * Callback triggered when the server has logged out. Resets internal state.
   *
   * @return
   *  Nothing.
   */
  _onLogout = (user) => {
    logger.debug(`PushManager._onLogout`);
  }
}
