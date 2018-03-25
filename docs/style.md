# Style notes

This is the general style that has been used in the codebase so far.

* Naming of variables follows standard React-like components. `camelCase` is
used for variable names, whereas `CamelCase` is used for classes and components
in general.
* When a method or member variable is internal to the class and
should not be seen outside of it, name it with an underscore in the beginning.
* Corollary to the above, **never** call a method of an object if that object
is not `this` and the method's name begins with `_`. Let's be sane, since JS is
not.
* Lines should be wrapped at 80 characters per line.
* It is expected that all code be written with ES6 in mind. React Native will
take care of doing all necessary transpilatons, and ES6 is incredibly saner
than basically anything else. So, please don't use promises if you're not using
`async/await`; use fat arrow notation for function definitions (with the
exception of React-defined functions such as `render` and
`componentWillUpdate`); and so on.
* Separate the API and back-end logic from the remainder of the front-end. This
currently has been done at the `api/` and `util/` folders, which contain most
of the logic for API calls and the state manager interactions.
* Within front-end code, separate screens, navigation and general components
that are either reused, or too large that they deserve their own files.
* Avoid using React's `state` and `setState` functions. Instead, call
`forceUpdate` whenever needed. This avoids code that works magically behind
your back (and will bite you in the neck).
* Whenever using `StateManager` (see more below), rely on getters (this is a
corollary to the earlier corollary: you can't access `StateManager`'s state
directly, since it all begins with `_`. See? Things make sense sometimes).
