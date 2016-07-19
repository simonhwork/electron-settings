Changelog
=========
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

***

2.0.0 - UNRELEASED
------------------
* Adds `has()` method to check if a key exists.
* Adds `FSWatcher` support to wathc for file change events to update the settings file even if electron-settings did not modify it.
* Adds troubleshooting guide.
* Adds migration guide.
* Adds the ability to set the root object using `set()` by not specifying a key path.
* Removes the `'created'` event as there is no way to listen for this event because the event is only called during instantiation before a reference to the instance can be obtained.
* Replaces local key path helpers library Atom's official key-path-helpers package.
* Removes Lodash as a dependency :raised_hands:
* `options.debouncedSaveTime` has been removed.
* Simplifies how much data key path watchers return. Now no longer returns a massive settings diff object. If you'd like to implement this on your own, check out [`deep-diff`][external_package_deep-diff]. To see how [`watch()`](method_watch) now works, see the [methods guide](docs_methods).
* Adds extensive testing and support for automatic testing with Travis.

⚠️ **Breaking Changes**

* Deprecates the following methods:
  * `getWatchers()`
  * `clearWatchers()`
  * `destroy()`
* Deprecates the `'error'` event.
* `set()`, `unset`, and `clear()` will now no longer accept any options object or the `'.'` key path.

[docs_methods]: ./docs/methods.md
[method_watch]: ./docs/methods.md#watch
[external_package_deep-diff]: https://npmjs.org/package/deep-diff

1.1.1 - Jul. 12, 2016
---------------------
* Fixes internal `'create'` event handler bug.

1.1.0 - Jul. 11, 2016
---------------------
* Adds support for `'change'` event.
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
