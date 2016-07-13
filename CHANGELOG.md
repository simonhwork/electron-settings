Changelog
=========
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

***

2.0.0 - UNRELEASED
------------------
* Adds `has()` method to check if a key exists.
* Adds `defaults()` method to apply defaults to settings.
* Adds `canQuitSafely()` method to check if it is safe to quit the application.
* Adds `prettify` option to specify whether or not the outputted JSON should be formatted.
* Adds `spaces` option to specify the number of spaces to use when prettifying the outputted JSON.
* Adds `ext` option to specify a custom file extension.
* Adds `default` option to specify setting defaults if the config file does not exist.
* Updates saving to disk so that it is now asynchronous.
* Replaces local key path helpers library Atom's official key-path-helpers package.
* Removes Lodash as a dependency.

⚠️ **Breaking Changes**
* Changes `configFileDir` option to `dir`
* Changes `configFileName` option to `filename`
* Changes default settings directory from `/<user data>/electron-settings/settings.json` to `/<user data>/config/settings.json`
* Removes support for key path watchers and associative
 methods.

1.1.1 - Jul. 12, 2016
---------------------
* Fixes internal `create` event handler bug.

1.1.0 - Jul. 11, 2016
---------------------
* Adds support for "change" event.
* Adds Kai Eichinger as a contributor.

1.0.4 - Apr. 14, 2016
---------------------
* Remove `electron-prebuilt` peer dependency. Fixes #11

1.0.3 - Apr. 05, 2016
---------------------
* Fix config path within renderer process. Fixes #9

1.0.0 - Feb. 12, 2016
---------------------
* Changes all read and writes to asynchronous code.
* Adds the `ready` event.
* Adds the ability to specify the config directory, config file name, and debounced save time when creating a new ElectronSettings instance.
* Adds the `ready`, `change`, `error`, and `save` public events.
* `set()` will no longer accept an Object as the keyPath to set the root value. Use `set('.')` instead.
* Adds `clear()` method to empty all settings.
* Adds `on` and `off` for tying into public events.
* Adds ability to watch a key path for changes.
* Adds ability to specify a minimatch string as a key path when creating a watcher. This way you can watch "\*" or "+(foo|\*.bar)" for example.
* Implements deep-diff to check for changes between two different settings states.
* Adds a getter for the internal settings cache via `settings.cache`.
* Adds a getter for the internal watchList via `settings.watchList`.

0.1.0 - Dec. 23, 2015
---------------------
* Syntactic compliance with Electron 0.36.0.
* `set`, `unset`, `addChangeListener`, and `removeChangeListener` now return a reference to the ElectronSettings instance. This will allow chaining of methods, such as `ElectronSettings.unset('foo').set('bar', 'baz')`.
* Adds `electron-prebuilt@~0.36.0` as a peer dependency. Syntactic compliance with Electron 0.36.0 will break applications using older versions of Electron.
* Moving to 0.1.0 because of the breaking changes by syntactic compliance with Electron 0.36.0.
