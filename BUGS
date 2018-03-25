# Known Bugs

This file lists the known bugs in the code at the time of writing. *Please
maintain this file.* It's an informal thing, but just add bugs you encounter
(and removes the ones you solve) in here.

## Code Sharing

Because Expo and React Native use some stupid dependencies, they do not accept
symlinks in directories, or importing files from outside of the main app
directory. This means that our apps, even though they share basically 99% of
their code, need separate projects for just a few lines of different code.
This is extremely annoying, but it is what it is.

To deal with this, the shared code goes in `src/common/`, and we have symlinks
to those files in `src/mimo-user` and `src/mimo-store`. *Before running,
compiling, or doing anything with Expo/React Native, be sure to run
`scripts/symlink-to-copy.py`*. This script will copy over the symlinks that
are used with the original files. Run `scripts/copy-to-symlink.py` to go back
to the original state.

*Please, maintain these scripts until Expo, React Native and so on finally
support properly handling sharing of code among projects.*

## Android keyboard makes Chat screen disappear

For some reason, the `GiftedChat` instance will go all white in the background
while the keyboard is active. This is weird, but it doesn't prevent anyone from
actually using the app, and it only happens in Android. I'm ignoring this for
the time being.
