# Mimo App

Official repository for all development on the Mimo App, both the customer
and salesperson facing versions.

Built on top of Expo and React Native, allowing portability to both iOS and
Android immediately.

## Requirements

There are not much of specific requirements here, other than any requirements
needed to run Expo. Ideally, Expo recommends avoiding `npm 5`, so make sure
you're running either `yarn` or `npm@4` for installing. To install, simply run
`npm install` in the appropriate directories. For more,

https://docs.expo.io/versions/latest/introduction/installation.html

## How to Run

To run, there are basically two options: within the Expo app, and as standalone
apps. This is specific to Expo. Check out the following links for more:

* Simple initiation into Expo:
https://docs.expo.io/versions/latest/guides/up-and-running.html
* Generating standalone apps:
https://docs.expo.io/versions/latest/guides/building-standalone-apps.html

*Be sure to convert all symlinks to copies of files before doing any of this.
This is crucial. Look at `docs/common.md` to understand what that is, and 
how to do it, and why it matters.*

## Directory Structure

The directory structure is as follows:

```
.
├── BUGS.md
├── README.md
├── TODO.md
├── docs
├── out
├── scripts
│   └── manage-common.py
└── src
    ├── common
    │   ├── api
    │   ├── assets
    │   │   ├── fonts
    │   │   ├── icons
    │   │   └── images
    │   ├── components
    │   ├── screens
    │   ├── state
    │   └── util
    ├── firebase
    │   └── functions
    │       └── es7
    ├── mimo-store
    │   ├── App.js
    │   ├── api -> /Users/victordomene/mimo/scripts/../src/common/api
    │   ├── assets -> /Users/victordomene/mimo/scripts/../src/common/assets
    │   ├── components -> /Users/victordomene/mimo/scripts/../src/common/components
    │   ├── navigation
    │   ├── screens
    │   ├── state -> /Users/victordomene/mimo/scripts/../src/common/state
    │   └── util -> /Users/victordomene/mimo/scripts/../src/common/util
    └── mimo-user
        ├── App.js
        ├── api -> /Users/victordomene/mimo/scripts/../src/common/api
        ├── assets -> /Users/victordomene/mimo/scripts/../src/common/assets
        ├── components -> /Users/victordomene/mimo/scripts/../src/common/components
        ├── navigation
        ├── screens
        ├── state -> /Users/victordomene/mimo/scripts/../src/common/state
        └── util -> /Users/victordomene/mimo/scripts/../src/common/util
```

The separation of folders and all of this is explained in `docs/`.
