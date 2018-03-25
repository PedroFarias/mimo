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

## `symlink-to-copy`, `copy-to-symlink`

There are two scripts in `scripts/` that will be essential to developing code
in this world of annoying package managers.

The first one, `symlink-to-copy`, will take all registered symlinks and
transform them into copies of the original files. This is a script that should
be run before running on Expo, or before building standalone apps. Because
the package managers don't allow symlinks, this is absolutely crucial, otherwise
nothing will work at all.

The second one, `copy-to-symlink`, should be used before commiting to this
Git repository. This is because we definitely don't want two files that are
literally the same thing, ever. The only reason we have that is because to run,
we can't have symlinks. So, whenever *not running*, just make them symlinks.

I know, this is ugly, but it's the nicest solution I could think of...

## `firebase` folder

Notice that the `firebase` folder also uses the `Helpers.es7` and `Logger.es7`
utilities from `src/common`. This just uses a symlink. For more details on the
Cloud Functions, please refer to `firebase.md`.
