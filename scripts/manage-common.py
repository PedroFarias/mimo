import os
import shutil
import sys

script_path = os.path.dirname(os.path.realpath(__file__))

# List of files to convert. If needed, add more!
files = {
    '../src/mimo-user/assets': '../src/common/assets',
    '../src/mimo-user/api': '../src/common/api',
    '../src/mimo-user/components': '../src/common/components',
    '../src/mimo-user/state': '../src/common/state',
    '../src/mimo-user/util': '../src/common/util',
    '../src/mimo-user/screens/ConversationScreen.js': '../src/common/screens/ConversationScreen.js',
    '../src/mimo-user/screens/LoginScreen.js': '../src/common/screens/LoginScreen.js',
    '../src/mimo-user/screens/SettingsScreen.js': '../src/common/screens/SettingsScreen.js',

    '../src/mimo-store/assets': '../src/common/assets',
    '../src/mimo-store/api': '../src/common/api',
    '../src/mimo-store/components': '../src/common/components',
    '../src/mimo-store/state': '../src/common/state',
    '../src/mimo-store/util': '../src/common/util',
    '../src/mimo-store/screens/ConversationScreen.js': '../src/common/screens/ConversationScreen.js',
    '../src/mimo-store/screens/LoginScreen.js': '../src/common/screens/LoginScreen.js',
    '../src/mimo-store/screens/SettingsScreen.js': '../src/common/screens/SettingsScreen.js',

    '../src/firebase/functions/es7/Helpers.es7': '../src/common/util/Helpers.js',
    '../src/firebase/functions/es7/Logger.es7': '../src/common/util/Logger.js',
}

def copy_to_symlink():
    for relative_file in files.keys():
        original = script_path + '/' + files[relative_file]
        dest = script_path + '/' + relative_file
        if os.path.islink(dest):
            print('File {} is a symlink; skipping.'.format(dest))
            continue

        if os.path.exists(dest):
            if os.path.isdir(dest):
                shutil.rmtree(dest)
            else:
                os.remove(dest)

        os.symlink(os.path.relpath(original, dest), dest)

        print('File {} is now a symlink.'.format(dest))

def symlink_to_copy():
    for relative_file in files.keys():
        original = script_path + '/' + files[relative_file]
        dest = script_path + '/' + relative_file
        if not os.path.islink(dest):
            print('File {} is not a symlink; skipping.'.format(dest))
            continue

        os.unlink(dest)
        if os.path.isdir(original):
            shutil.copytree(original, dest)
        else:
            shutil.copy(original, dest)

        print('File {} is no longer a symlink.'.format(dest))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print('Please specify an option: to-symlink, to-copy, sync.')
        exit(1)

    arg = sys.argv[1]
    if arg == 'to-symlink':
        copy_to_symlink()
    elif arg == 'to-copy':
        symlink_to_copy()
    elif arg == 'sync':
        copy_to_symlink()
        symlink_to_copy()
    else:
        print('Invalid option: please use to-symlink, to-copy or sync.')
        exit(1)
