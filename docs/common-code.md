# Common code

This document explains how to use common code across apps. This is incredibly
annoying: the Expo/React Native package managers do not allow symlinks, or
refering to something that is outside of the main root of the project. So,
we have to have fun with some annoying scripts.

## `common` folder

For any piece of code that will be reused between `src/mimo-user` and
`src/mimo-store`, please use the `src/common` directory. In the corresponding
places at `src/mimo-user` and `src/mimo-store`, please add a symlink to the
correct location of the file/folder in `src/common`.

## `manage-common.py`

There is a script in `scripts/` that will be essential to developing code
in this world of annoying package managers.

There are three options to the script (specified as a command-line argument):
`to-copy`, `to-symlink` and `sync`.

The first one, `symlink-to-copy`, will take all registered symlinks and
transform them into copies of the original files. This is a script that should
be run before running on Expo, or before building standalone apps. Because
the package managers don't allow symlinks, this is absolutely crucial, otherwise
nothing will work at all.

The second one, `copy-to-symlink`, should be used before commiting to this
Git repository. This is because we definitely don't want two files that are
literally the same thing, ever. The only reason we have that is because to run,
we can't have symlinks. So, whenever *not running*, just make them symlinks.

The third one will simply do `to-symlink` and then `to-copy`, effectively
syncing the code from the `src/common` to the other places.

I know, this is ugly, but it's the nicest solution I could think of...

*If you add more common files, ADD THEM TO THE SCRIPT. The script is very
simple and doesn't do anything fancy to track symlinks. So, if you want 
something tracked, manually add them. Yes, I am incredibly lazy.*

## `firebase` folder

Notice that the `firebase` folder also uses the `Helpers.es7` and `Logger.es7`
utilities from `src/common`. This just uses a symlink. For more details on the
Cloud Functions, please refer to `firebase.md`.
