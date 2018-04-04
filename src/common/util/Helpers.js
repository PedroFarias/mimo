import assert from 'assert';

/*
 *************************************************************************
                            GENERAL HELPERS
 *************************************************************************
 */

/**
 * Returns a printf-style formatted string, by replacing %s with the passed-in
 * parameters. Not very safe, but this is JS, so this should work.
 *
 * We expect the first parameter to be a string with n occurrences of %s, and
 * there to be n more parameters specifying what these should substitute. If
 * there are more %s than expected, those will be left as %s in the literal
 * string. If there are less %s than expected, then the remaining arguments will
 * not be substituted.
 *
 * @param ...args
 *  Set of arguments to be formatted. Expect them to be string-like.
 * @return
 *  The formatted string.
 */
const format = (...args) => {
  const stringify = (str) => {
    if (typeof str === 'string') {
      return str;
    }
    return JSON.stringify(str, null, '\t');
  };

  return args.reduce((acc, c) => acc.replace(/%s/, stringify(c)))
    .replace(/\s+/g, ' ');
};

/**
 * Returns a formatted version of the given timestamp as a string. Shows the
 * time, if the date is from today; shows yesterday, if it is from yesterday;
 * shows the date otherwise.
 *
 * @param timestamp
 *  A number specifying the timestamp (UNIX time).
 * @return
 *  A string containing the properly formatted date.
 */
const getFormattedDate = (timestamp) => {
  const padWithZeroes = (string, n) => {
    while (string.length != n) {
      string = '0' + string;
    }
    return string;
  };

  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();

  const today = new Date();
  const yesterday = new Date(today.getTime() - 86400000);

  if (day == today.getDate()) {
    const paddedHours = padWithZeroes(hours.toString(), 2);
    const paddedMinutes = padWithZeroes(minutes.toString(), 2);

    return paddedHours + ':' + paddedMinutes;
  } else if (day == yesterday.getDate()) {
    return 'Yesterday';
  }

  const paddedDay = padWithZeroes(day.toString(), 2);
  const paddedMonth = padWithZeroes(month.toString(), 2);
  return paddedDay + '/' + paddedMonth + '/' + year;
};

/**
 * Performs a simple binary search on the list, looking for the specified value
 * using the comparison function.
 *
 * @param list
 *  The list whose elements will be compared to value.
 * @param cmpFunc
 *  The comparison function. Should take two arguments: an element of the list,
 *  and a value. Returns the comparison of the two values (negative, zero or
 *  positive, the usual).
 * @param value
 *  The value searched for.
 * @return
 *  If any element matches, return the index. Otherwise, returns null.
 */
const binarySearch = (list, cmpFunc, value) => {
  let start = 0;
  let end = list.length - 1;

  while (start <= end) {
    let middle = Math.floor((start + end) / 2);
    let cmp = cmpFunc(list[middle], value);

    if (cmp == 0) {
      return middle;
    } else if (cmp < 0) {
      start = middle + 1;
    } else {
      end = middle - 1;
    }
  }

  // FIXME: Last resort. This should not be ever called, but in case something
  // goes wrong with the ordering (due to most likely a bug in server.getUid),
  // then this will at least try it again.
  for (let [index, elt] of list.entries()) {
    console.log(index);
    console.log(elt);
    if (cmpFunc(elt, value) == 0) {
      return index;
    }
  }

  return null;
};

/*
 *************************************************************************
                         FIREBASE PATH HELPERS

 When using Firebase, we need to build paths to children of the root
 database. This is relatively annoying, so we have a few helper functions
 to build any paths we may need. Isolate annoyances.
 *************************************************************************
 */

const PATH = {
  ACCEPTED_MIMOS: 'acceptedMimos',
  CONVERSATIONS: 'conversations',
  EMPLOYEES: 'employees',
  IMAGES: 'images',
  MESSAGES: 'messages',
  MIMOS: 'mimos',
  PENDING_MIMOS: 'pendingMimos',
  PUBLIC: 'public',
  PUSH_NOTIFICATION_TOKEN: 'pushNotificationToken',
  PRIVATE: 'private',
  READ_BY: 'readBy',
  STORES: 'stores',
  USERS: 'users',
};

/**
 * User-related paths.
 */
const getUserPublicPath = (uUid) => format('%s/%s/%s', PATH.USERS,
  PATH.PUBLIC, uUid)
const getUserPrivatePath = (uUid) => format('%s/%s/%s', PATH.USERS,
  PATH.PRIVATE, uUid);
const getAllUserConversationsPath = (uUid) => format('%s/%s/%s/%s', PATH.USERS,
  PATH.PRIVATE, uUid, PATH.CONVERSATIONS)
const getUserConversationPath = (uUid, cUid) => format('%s/%s/%s/%s/%s',
  PATH.USERS, PATH.PRIVATE, uUid, PATH.CONVERSATIONS, cUid)
const getAllUserPendingMimosPath = (uUid) => format('%s/%s/%s/%s', PATH.USERS,
  PATH.PRIVATE, uUid, PATH.PENDING_MIMOS);
const getUserPendingMimoPath = (uUid, mUid) => format('%s/%s/%s/%s/%s',
  PATH.USERS, PATH.PRIVATE, uUid, PATH.PENDING_MIMOS, mUid);
const getUserPushNotificationTokenPath = (uUid, mUid) => format('%s/%s/%s/%s',
  PATH.USERS, PATH.PRIVATE, uUid, PATH.PUSH_NOTIFICATION_TOKEN);

const getAllUserAcceptedMimosPath = (uUid) => format('%s/%s/%s/%s', PATH.USERS,
  PATH.PRIVATE, uUid, PATH.ACCEPTED_MIMOS);

/**
 * Store-related paths.
 */
const getAllStoresPublicPath = () => format('%s/%s', PATH.STORES, PATH.PUBLIC)
const getAllStoresPrivatePath = () => format('%s/%s', PATH.STORES, PATH.PRIVATE)

// One could argue this should be part of public/, but I am forcefully not
// making it so to make a point.
const getStoreEmployeesPath = (sUid) => format('%s/%s/%s/%s', PATH.STORES,
  PATH.PRIVATE, sUid, PATH.EMPLOYEES);

/**
 * Conversation-related paths.
 */
const getAllConversationsPath = () => format('%s', PATH.CONVERSATIONS);
const getConversationPath = (cUid) => format('%s/%s', PATH.CONVERSATIONS, cUid);

const getAllConversationMessagesPath = (cUid) => format('%s/%s/%s',
  PATH.CONVERSATIONS, cUid, PATH.MESSAGES);
const getConversationMessagePath = (cUid, mUid) => format('%s/%s/%s/%s',
  PATH.CONVERSATIONS, cUid, PATH.MESSAGES, mUid);
const getConversationMessageReadByPath = (cUid, mUid, uUid) =>
  format('%s/%s/%s/%s/%s', PATH.CONVERSATIONS, cUid, PATH.MESSAGES, mUid,
  PATH.READ_BY);
const getConversationMessageReadByUserPath = (cUid, mUid, uUid) =>
  format('%s/%s/%s/%s/%s/%s', PATH.CONVERSATIONS, cUid, PATH.MESSAGES, mUid,
  PATH.READ_BY, uUid);

/**
 * Mimo-related paths.
 */
const getMimoPath = (mUid) => format('%s/%s', PATH.MIMOS, mUid);
const getMimosPath = () => PATH.MIMOS;

/**
 * Image-related paths.
 */
const getImagePath = (cUid, mUid) => format('%s/%s/%s/%s', PATH.CONVERSATIONS,
  cUid, PATH.IMAGES, mUid);

/*
 *************************************************************************
                                 ASSERTS

 Verify that expectations are met by asserting certain things. Provides
 functionality to check integrity of several objects.
 *************************************************************************
 */

const assertStore = (store) => {
  assert(store.address != null, 'Store should have an address');
  assert(store.categories != null, 'Store should have categories');
  assert(store.description != null, 'Store should have a description');
  assert(store.logo != null, 'Store should have a logo');
  assert(store.name != null, 'Store should have a name');
};

const assertMessage = (message) => {
  assert(message.sender != null, 'Message should have a sender');
  assert(message.content != null, 'Message should have a content');
  assert(message.timestamp != null, 'Message should have timestamp');
};

const assertEmployee = (employee) => {
  assert(employee.firstName != null, 'Employee should have a firstName');
  assert(employee.lastName != null, 'Employee should have a lastName');
  assert(employee.photo != null, 'Employee should have a photo');
  assert(employee.store != null, 'Employee should have a store');
};

const assertUser = (user) => {
  assert(user.firstName != null, 'User should have a firstName');
  assert(user.lastName != null, 'User should have a lastName');
  assert(user.photo != null, 'User should have a photo');
};

const assertMimo = (mimo) => {
  assert(mimo.message != null, 'Mimo should have a message');
  assert(mimo.customer != null, 'Mimo should have a customer');
  assert(mimo.status != null, 'Mimo should have a status');
  assert(mimo.stores != null, 'Mimo should have stores');
  assert(mimo.timestamp != null, 'Mimo should have timestamp');
};

/*
 *************************************************************************
                                  EXPORTS

 Exports helper functions to other modules.
 *************************************************************************
 */

export {
  binarySearch,
  format,
  getFormattedDate
};
export {
  getUserPublicPath,
  getUserPrivatePath,
  getUserConversationPath,
  getAllUserConversationsPath,
  getUserPendingMimoPath,
  getUserPushNotificationTokenPath,
  getAllUserPendingMimosPath,
  getAllUserAcceptedMimosPath,
};
export {
  getAllStoresPublicPath,
  getAllStoresPrivatePath,
  getStoreEmployeesPath,
};
export {
  getAllConversationsPath,
  getConversationPath,
  getAllConversationMessagesPath,
  getConversationMessagePath,
  getConversationMessageReadByPath,
  getConversationMessageReadByUserPath,
};
export {
  getImagePath,
};
export {
  getMimoPath,
  getMimosPath,
};
export {
  assertEmployee,
  assertMessage,
  assertMimo,
  assertStore,
  assertUser,
};
