electron-settings
==================

A fast and powerful persistent user settings manager for [Electron][external_electron] adapted from [Atom's own configuration manager][external_atom-config].

Having trouble? [Check the troubleshooting guide][docs_troubleshooting]

Migrating from v1? [Click here][docs_migration-guide]

[![Join the chat at https://gitter.im/nathanbuchar/electron-settings](https://badges.gitter.im/nathanbuchar/electron-settings.svg)](https://gitter.im/nathanbuchar/electron-settings?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)



***



Install
-------

```
$ npm install electron-settings
```


Quick Start
-----------

**`new ElectronSettings([options])`**

**Options**
* `defaults` *Object* - Default settings to use if the settings file does not yet exist.
* `prettify` *Boolean* - Prettify the JSON output. Defaults to `false`.
* `enablePersistence` *Boolean* - If `false`, electron-settings won't save settings to disk. Defaults to `true`.

**Example**

```js
const ElectronSettings = require('electron-settings');

const settings = new ElectronSettings();

settings.set('user', {
  firstName: 'Cosmo',
  lastName: 'Kramer'
});

settings.get('user.firstName');
// => "Cosmo"
```


How It Works
------------

Electron doesn't have a built-in system for managing persistent user settings for your application. Bummer. This package attempts to bridge that gap using an adaption of [atom/config][external_atom-config], Atom's own internal configuration manager.

With electron-settings, you will not actually interact directly with the file system. Instead, you're working with a local copy of the settings object that's stored in memory instead of on the disk. Any time this cache is modified, a save request is issued internally which will then save the current state of the settings cache to the file system in the background.

This behavior allows you to synchronously read and write settings *much* faster than you would reading from and writing to the file directly.


Documentation
-------------
* [Events][docs_events]
* [Methods][docs_methods]


Contributors
-------
* [Nathan Buchar] (Owner)
* [Kai Eichinger]
* *You?*


License
-------
[ISC][license]


***

:bird:



[license]: ./LICENSE.md

[Nathan Buchar]: mailto:hello@nathanbuchar.com
[Kai Eichinger]: mailto:kai.eichinger@outlook.com
[Your Name]: mailto:you@email.com

[docs_troubleshooting]: ./docs/troubleshooting.md
[docs_migration-guide]: ./docs/migration-guide.md
[docs_events]: ./docs/events.md
[docs_methods]: ./docs/methods.md

[external_electron]: https://electron.atom.com
[external_atom-config]: https://github.com/atom/atom/blob/master/src/config.coffee
