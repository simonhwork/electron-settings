[Electron Settings] » **Migration Guide**

***

Migration Guide
===============

## v1 to v2

v2 introduces a lot of great new features, but also changes how a lot of electron-settings' internals work. Here's what you need to know:

### Breaking Changes

#### Instantiation

**Applies to:** Everyone

In v1, to create a new `ElectronSettings` instance, you would perform the following:

```js
const ElectronSettings = require('electron-settings');

const settings = new ElectronSettings();
```

However in v2, all you need to do is require the package. This way you don't need a central settings instance. It just works wherever you require it.

```js
const settings = require('electron-settings');
```


#### Instance Options

**Applies to:** Some

Now that [we have done away with instantiation](#instatiation), we have also lost the ability to pass in an `options` object to the settings constructor. As a reminder, these options were `configDirPath`, `configFilePath`, and `debounceSaveTime`. In an effort to streamline and simplify electron-settings, it has been decided that the ability to customize these options was not necessary in the first place and have been *entirely removed*. Which means ***if you set a custom config directory or name for your settings file, you will need to migrate the settings to the new v2 location.***

If you did not make any modifications to the directory or file name, then congratulations, your settings will be automatically migrated! :clap: :tada:

To migrate the old settings to v2, simply include `settings.migrate()` within your app's `ready` handler and pass in the custom config directory and file name as you would into the module constructor in v1. It will do all the heavy lifting for you.

```
app.on('ready', () => {
  const settings = require('electron-settings');
  
  // Synchronously migrates the old v1 settings file to
  // the new v2 location located at `config/settings.json`.
  settings.migrate({
    configDirName: 'my-custom-config-dir',
    configFileName: 'cool-settings'
  });
});
```


#### Key Path Watchers

**Applies to:** Some

Key path watchers were a seemingly unnecessary and bulky feature that made electron-settings feel too utilitarian. In a recent effort to streamline electron-settings, key path watcher functionality has been *entirely removed*. If you attempt to call `watch`, `unwatch`, `getWatchers`, or `clearWatchers`, you will be met with a deprecation message, but the app will not throw.
  
If your app relies on key path watchers, unfortunately you will need to find an alternative solution.



### Non-Breaking Changes

#### Method Deprecations

The following methods have been deprecated or modified.

* `getConfigFilePath()` - Use `getPathToSettingsFile()` instead.
* `destroy()`
  
  
#### Event Deprecations

The following events have been deprecated or modified.

* `'change'` - Now refers to file change events and has no relation to key path watchers.
* `'create'` - Deprecated. A file is created automatically the first time the module is required. It would never be possible to watch for `'create'` events, because by the time you could call `settings.on('create')`, the file will have already been created as it this is done synchronously.



***

<small>Last updated Jul. 14th, 2016, by [Nathan Buchar]</small>



[Electron Settings]: /

[Nathan Buchar]: (mailto:hello@nathanbuchar.com)
