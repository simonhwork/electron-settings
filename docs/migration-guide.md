[Electron Settings] » **Migration Guide**

***

Migration Guide (v1 to v2)
==========================

v2 introduces a lot of great new features, but also changes how a lot of electron-settings' internals work. Here's what you need to know:

### Breaking Changes

#### Key Path Watchers

Key path watchers are and bulky feature that makes electron-settings feel too utilitarian. In a recent effort to streamline electron-settings, key path watcher functionality has been *simplified*. Key path watchers will now no longer return a detailed diff object. If you'd like to implement this on your own, check out [`deep-diff`][external_package_deep-diff]
  
To see how [`watch()`](method_watch) now works, see the [methods guide](docs_methods).



### Non-Breaking Changes

#### Method Deprecations

The following methods have been deprecated or modified.

**Deprecated**

* `getWatchers()`
* `clearWatchers()`
* `destroy()`

**Modified**

* `set()`
  * `options` are no longer accepted.
  * Will no longer accept `'.'` as a key path. To set the root, simply don't specify any key path at all. See [`set()`][method_set].
* `unset()`
  * `options` are no longer accepted.
  * Will no longer accept `'.'` as a key path. If you'd like to reset the root, simply use [`clear()`][method_clear].
* `clear()`
  * `options` are no longer accepted.
  
  
#### Event Deprecations

The following events have been deprecated.

* `'create'` - A file is created automatically when a new `ElectronSettings` instates is constructed (assuming persistence is enabled). It would never be possible to watch for `'create'` events, because by the time you could bind the `'create'` event, the file will have already been created as it this is done synchronously.
* `'error'`



***

<small>Last updated Jul. 18th, 2016, by [Nathan Buchar]</small>






[Electron Settings]: /

[Nathan Buchar]: (mailto:hello@nathanbuchar.com)

[docs_methods]: ./methods.md

[method_set]: ./methods.md#set
[method_clear]: ./methods.md#clear
[method_watch]: ./methods.md#watch

[external_package_deep-diff]: https://npmjs.org/package/deep-diff
