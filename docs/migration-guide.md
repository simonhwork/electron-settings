[Electron Settings] » **Migration Guide**

***

Migration Guide (v1 to v2)
==========================

v2 introduces a lot of great new features, but also changes how a lot of the internals of electron-settings work. Here's what you need to know:

### Breaking Changes

#### Location of Settings File

In v1, the default path to the `settings.json` file was `<user data path>/electron-settings/settings.json`. In v2, this has been changed to `<user data path>/config/settings.json`.

If you used the default `options.configDirPath` when instantiating electron-settings in v1, then any settings saved during this period will be lost. To ensure that you use the settings file generated from v1, simply instantiate electron-settings with the `configDirPath` option and point it to the old path.

```js
const path = require('path');
const ElectronSettings = require('electron-settings');

const settings = new ElectronSettings({
  configDirPath: path.join(app.getPath('userData'), 'electron-settings')
});
```

#### Key Path Watchers

Key path watchers are and bulky feature that makes electron-settings feel too utilitarian. In a recent effort to streamline electron-settings, key path watcher functionality has been *simplified*. Key path watchers will now no longer return a detailed diff object. If you'd like to implement this on your own, check out [`deep-diff`][external_package_deep-diff]. It will instead just return the type of event (`create`, `change`, or `delete`), the key path, and the new value if applicable.
  
To read more about how [`watch()`](method_watch) works in v2, see the [methods guide](docs_methods).


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

* `"create"` - A file is created automatically when a new `ElectronSettings` instates is constructed (assuming persistence is enabled). It would never be possible to watch for `"create"` events, because by the time you could bind the `"create"` event, the file will have already been created as it this is done synchronously.
* `"error"`



***

<small>Last updated Jul. 19th, 2016, by [Nathan Buchar]</small>






[Electron Settings]: /

[Nathan Buchar]: (mailto:hello@nathanbuchar.com)

[docs_methods]: ./methods.md

[method_set]: ./methods.md#set
[method_clear]: ./methods.md#clear
[method_watch]: ./methods.md#watch

[external_package_deep-diff]: https://npmjs.org/package/deep-diff
