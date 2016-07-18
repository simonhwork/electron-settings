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

```js
const settings = require('electron-settings');

settings.set('user', {
  firstName: 'Cosmo',
  lastName: 'Kramer'
});

settings.get('user.firstName');
// => "Cosmo"
```

And don't forget to [quit safely!][section_quitting-safely]


How It Works
------------

Electron doesn't have a built-in system for managing persistent user settings for your application. Bummer. This package attempts to bridge that gap using an adaption of [atom/config][external_atom-config], Atom's own internal configuration manager.

With electron-settings, you will not actually interact directly with the file system. Instead, you're working with a local copy of the settings object that's stored in memory instead of on the disk. Any time this cache is modified, a save request is issued internally which will then save the current state of the settings cache to the file system in the background. This behavior allows you to synchronously read and write settings *much* faster than you would reading from and writing to the file directly.

**Just be sure to check that the app can quit safely before quitting** – otherwise data waiting to be saved may be lost.


Quitting Safely
---------------

Part of what makes electron-settings fast is its caching layer and lazy interaction with the file system, but as a consequence special precautions need to be taken to ensure that data is not corrupted or lost if the app quits in the middle of a save or before a queued save request has been fulfilled.

When the app will quit, ensure that it can in fact quit safely by using the [`canQuitSafely`][method_canQuitSafely] method and the [`'can-quit-safely'`][event_can-quit-safely] event handler.

```js
// When the app is about to quit, check that we can quit
// the app safely without losing any data. If we cannot,
// prevent the app from quitting, wait for the next
// "can-quit-safely" event, then quit the app.
app.on('will-quit', event => {
  if (!settings.canQuitSafely()) {
    event.preventDefault();

    settings.once('can-quit-safely', () => {
      app.quit();
    });
  }
});
```

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

[section_quitting-safely]: #quitting-safely

[docs_troubleshooting]: ./docs/troubleshooting.md
[docs_migration-guide]: ./docs/migration-guide.md
[docs_events]: ./docs/events.md
[docs_methods]: ./docs/methods.md

[event_can-quit-safely]: ./docs/events.md#event-can-quit-safely

[method_canQuitSafely]: ./docs/methods.md#settingscanquitsafely

[external_electron]: https://electron.atom.com
[external_atom-config]: https://github.com/atom/atom/blob/master/src/config.coffee
