# State and Server management

This file briefly describes the interfaces between the React Native code, the
state management units, and the server instances.

## `Server` interface

The `Server` interface is supposed to allow any backend that implements
the functionality (i.e., provides the expected guarantees in the function
descriptions in Javadoc-style) to be used by the `StateManager`.

However, notice that most of the interfaces are based almost blatantly on the
API provided by Firebase, or in general a NoSQL database with support for event
scheduling. It does not necessarily work well with a static SQL server
database. This is not to say that the interface *cannot* be satisfied using a
SQL server; just that it is less intuitive to do so.

Please, refrain from making modification to `FirebaseServer` without
changing the appropriate expectations in `Server`. Should the app move
towards a different back-end, `Server` could be a life-saver.

## `StateManager` interface

While it may seem like a good idea to use a library like `Redux` or even its
middlewares such as `redux-thunk` to achieve a lot of functionality related to
managing state of the application, **it is really not.**

With this in mind, the current implementation relies on `StateManager` to relay
state changes onto components. Similarly to Redux, one can register for updates
whenever global state changes, by using `registerComponent` and
`deregisterComponent`. The `StateManager` also contains Redux's actions, but
instead of the incredibly verbose interface that Redux provides, actions are
nothing more than methods on `StateManager`. So, just call those whenever you
need to, say, send a message to another user, by using `sendMessage` on the
`StateManager`, and it will deal with interfacing with the back-end, and it
should be the entity that handles callbacks and all that fun stuff that ends up
mutating state.

Oh, and because there was a lot of stuff going on in this file, I separated
it into `StateManager`, `LoginManager`, `StoreManager`, `ConversationManager`
and `MimoManager`. Their purpose should be obvious.

TL;DR: Add code that must talk to the back-end to change state, and anything
that changes state to `StateManager`. Only ever read state from `StateManager`.
