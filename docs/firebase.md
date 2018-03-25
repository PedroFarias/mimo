# Firebase Design Choices

## Top-level Structures

The top-level structures of the Firebase database are very intuitive:

* `users` (both customers and employees);
* `conversations` (contains mostly
messages);
* `mimos` (contains the mimo requests, and their statuses);
* `stores` (well, the stores' information).

The most recent database structure looks as follows. You can also see a JSON
dump of an example valid database, after playing around a bit with the apps,
under `database.json`.

For more details, see the other sections below; they go deeper into some of the
nitty-gritty specifications.

## `stores/public/storeUid` vs. `stores/storeUid/public`

Given that we want public and private stuff, there are two ways we can
structure the database. Either we have a public listing with all of the stores,
or each store has a public field. While the second approach may seem more
intuitive (at least to me it was), it becomes incredibly difficult to list all
of the stores' names!

If you want to do that, you have to look at all keys in `stores/`, and one-by-
one, request `stores/storeUid/public`, because if you request
`stores/storeUid`, you'd get the private fields as well. This is not good. So,
first approach it is. I followed this scheme for `users` and `employees` as
well (even though there wasn't much of a reason for it, just consistency).

## Conversations

Because of NoSQL and the way Firebase queries work, we can't really do a
`SELECT WHERE conversation.id == user.id`. Instead, the user keeps track of the
conversations it participates in, via `users/private/userUid/conversations`.
The keys in this dictionary indicate conversations the user is active in. The
analogous exists in the employees, of course.

Whenever a user wants to list its conversations, it first fetches the list of
conversation identifier, and then simply queries the
`conversations/conversationUid` node in Firebase, for all of the conversation
identifiers. This way, the user only fetches information that is strictly
necessary. If we wanted to check all of the conversations and select which ones
belong to the user on the client-side, this would require downloading all of
the conversations ever had in the app, which is obviously not a good idea at
all.

So, simply put: a user listens for conversation identifier in its own node; if
there are any, then he listens for changes in that conversation's messages, and
shows those changes as they come (just like real-time databases are supposed to
work, isn't that nice?). When a user wants to send a message, he simply adds a
message to `conversations/conversationUid/messages`. The employee is analogous.

## Firebase Cloud Functions

Some of the functionality needed to be performed by a server, due to privileges
(for instance, a user cannot see a store's employees directly). This can be
easily solved using Firebase Cloud Functions, a system that allows typical
HTTP requests to be handled in a Firebase-deployed server, and runs code that
we specify. These servers can also respond to custom events (for instance,
when a new employee is added to a store, it can add all the pending mimos
from that store to the employee).

These functions are implemented in `src/firebase`. Currently, there are a few
pieces of functionality handled by Cloud Functions: uploading images, sending
mimos to stores, relaying a store's pending mimos to new employees, blocking
conversations whenever the user wants to, and sending push notifications on new
messages. New functionality will most likely be needed there; it's an incredibly
useful feature of Firebase.

The following articles might prove useful:

* https://firebase.google.com/docs/functions/
* https://medium.com/codingthesmartway-com-blog/introduction-to-firebase-cloud-functions-c220613f0ef

### Deploying

Notice that the functions in `src/firebase/functions` are all written in ES2017,
because I can't subject myself to write JS without `async/await` without hating
the entire world in the process. Therefore, you need to run `babel` on it before
deploying. Right now, the `npm run prepare` command is automatically run
whenever you try to deploy, so you don't have to worry too much other than run

`firebase deploy --only functions`

on your terminal. However, all your ES2017 code should be located in

`src/firebase/functions/es7`

and *please don't commit the compiled .js files to the repository.*

## Mimo Request

* A user submits a mimo request. This does the following:
    * It creates a mimo under `mimos/mimoUid`, containing the message, the
    `customerUid`, `timestamp`, the `stores` that this mimo is targetted at,
    and of course, the `status` (pending, initially).
    * The mimoUid is added to `users/private/userUid/pendingMimos`. Notice that
    this can be private, which is nice.
    * The server fetches all of each targetted store's employees, by looking at
    `stores/employees/storeUid/`. It adds the mimoUid under
    `employees/pendingMimos/employeeUid/`, so that the employee will see the
    request. Notice that this cannot be private: the user is writing it!
* An employee opens his app, and there is a new pending mimo for him. Then, the
store app checks whether the mimo is truly pending. If it has already been
accepted, it is removed from the pending list for that employee, and the
employee never even sees the request. Otherwise, if the request is truly
pending, then an employee can reject or accept the mimo request. If he rejects,
this simply removes the `mimoUid` from the `pendingMimos` for that particular
employee. We currently don't handle mimos that are never handled; we could just
time them out. If the request is accepted, then:
    * The employee creates a conversation object under `conversations/`,
    between the customer that submitted the mimo and himself, if it does not
    yet exist.  If it exists, then it's just recycled. Notice this is a
    harmless operation, in terms of race conditions: worst case scenario, a
    conversation is created, but neither the employee nor user actually use it.
    * The employee then atomically changes the mimo's status to `accepted`,
    inserting the newly added conversationUid and storeUid to it, and changes
    the pending status to `false`. These two must be done atomically in a
    transaction, or two employees could both change it at the same time, and
    the user may get two notifications for a new mimo accepted, which can be
    problematic. **Notice that this must be done after the conversation
    exists:** the user will receive a notification of this change to status
    (see below), and he will immediately add that conversation to its own
    conversations. If it doesn't exist, then the client app will not be happy.
    It won't crash, of course, but it will also not show the conversation (at
    least not until he reloads the app, after the employee creates the
    conversation....). Anyway, keep this ordering and things go smoothly.
    * If he succeeds in that transaction, then he adds the conversation to his
    own list of conversations, under
    `employees/private/employeeUid/conversations`. **It is also important that
    this happens after the pending status is successfully changed**, otherwise
    the employee could start chatting the user (and the user wouldn't even see
    the messages, because he will never add it to his own conversations). But,
    when (and if) a conversation between them takes place, you don't expect
    random messages to be there because you chose poorly on your request
    orders...  * The user receives an event that the pending status has changed
    in one of his mimos. He then:
    * Adds the `conversationUid` to his own conversations, analogously to the
    last step taken by the employee. This will trigger the user to fetch
    conversation details, so as explained before, it's important that the
    conversation be guaranteed to exist at this point.
    * Removes the pending mimo from the user's active conversations. This
    ordering is also important: if the user removes the pending mimo before the
    conversation is added, and internet connection fails, then the conversation
    may never take place and the mimo is gone.
* The mimo has been accepted, both user and employee will have access to the
conversation, and everything is great!
