[Electron Settings] » **Events**

***

Events
=======

* [`save`][event_save]
* [`change`][event_change]
* [`error`][event_error]
* [`canQuitSafely`][event_can-quit-safely]


### Event: `'save'`

Returns:
* **`event`** *Event*

Emitted when the settings have been saved to disk.


### Event: `'change'`

Returns:
* **`event`** *Event*

Emitted when a change has been made to the settings file, even if electron-settings was not responsible. Uses Node's `fs.watch()` method to watch the settings file for changes.


### Event: `'error'`

Returns:
* **`event`** *Event*
* **`err`** *Error*

Emitted if and when an error occurs while writing to disk.


### Event: `'can-quit-safely'`

Returns:
* **`event`** *Event*

Emitted after a save occurs and there are no queued save requests. You should always check if you can quit safely before quitting the application, otherwise you will lose unsaved data. Take the following for example, which also uses the `canQuitSafely` method:

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



***

<small>Last updated Jul. 14th, 2016, by [Nathan Buchar]</small>



[Electron Settings]: /

[Nathan Buchar]: (mailto:hello@nathanbuchar.com)

[event_save]: #event-save
[event_change]: #event-change
[event_error]: #event-error
[event_can-quit-safely]: #event-can-quit-safely
