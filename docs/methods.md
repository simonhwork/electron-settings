[Electron Settings] » **Methods**

***

Methods
=======

* [`has()`][method_has]
* [`get()`][method_get]
* [`set()`][method_set]
* [`delete()`][method_delete]
* [`defaults()`][method_defaults]
* [`getPathToConfigFile()`][method_getPathToConfigFile]
* [`canQuitSafely()`][method_canQuitSafely]



***



### `settings.has(keyPath)`

* **`keyPath`** *String* - The path to the key that we wish to check exists within the settings object.

Checks if the key path exists within the settings object. Will return `true` if it exists, or `false` if it doesn't. Take the following for example:

**settings.json**
```json
{
  "foo": {
    "bar": "baz"
  }
}
```

**main.js**
```js
settings.has('foo.bar');
// => true

settings.has('grizzknuckle');
// => false
```

We can see that `'foo.bar'` exists, whereas `'girzzknuckle'` does not.


***


### `settings.get([keyPath])`

* **`keyPath`** *String* (optional) - The path to the key that we wish to get the value of.

Returns the value of the key at the chosen key path. If the value at the chosen key path is an object or array, a copy will be returned instead of a direct reference. If no key path is specified, this will return the entire settings object instead. Take the following for example:

**settings.json**
```json
{
  "foo": {
    "bar": "baz"
  }
}
```

**main.js**
```js
settings.get();
// => { foo: { bar: 'baz' } }

settings.get('foo.bar');
// => 'baz'
```

We can see that when the key path is not specified, the entire settings object is returned. However, if a key path is chosen, we get the value of that key, provided it exists.


***


### `settings.set(keyPath, value[, callback])`

* **`keyPath`** *String* - The path to the key whose value we wish to set. This key need not already exist.
* **`value`** *Any* - The value to set the key and the chosen key path to.
* **`callback`** *Function* (optional) - Invoked when the settings cache containing these changes have been saved to disk.

Sets the value of the key at the chosen key path. If no key path is specified, this will set the value of the entire settings object instead, but `value` must be an object. Take a look at the following example:

**settings.json**
```json
{}
```

Set the `'user.name'` key path to an object.
```js
settings.set('user.name', {
  first: 'Cosmo',
  last: 'Kramer'
});

settings.get('user.name.first');
// => 'Cosmo'
```

Set the value of the entire settings object.
```js
settings.set({
  foo: 'bar'
});

settings.get();
// => { foo: 'bar' }
```


***


### `settings.delete(keyPath[, callback])`

* **`keyPath`** *String* - The path to the key we wish to delete.
* **`callback`** *Function* (optional) - Invoked when the settings cache containing these changes have been saved to disk.

Deletes the key and value at the chosen key path. Take the following for example:

**settings.json**
```json
{
  "foo": {
    "bar": "baz"
  }
}
```

**main.js**
```js
settings.delete('foo.bar');

settings.get('foo');
// => { foo: {} }
```

You can see above that when we delete the value of `'foo.bar'`, the value for `'foo'` has been deleted and replaced with an empty object. Note here that deleteting a key will not set it to `null`.


***


### `settings.canQuitSafely()`

Returns a boolean indicating whether or not the user can quit safely or not. Part of what makes electron-settings fast is its caching layer and lazy interaction with the file system, but as a result special precautions need to be taken to ensure that data is not lost or corrupted if the app quits in the middle of a save or before a queued save request has been fulfilled. When the app will quit, ensure that it can in fact quit safely before quitting.

Take a look at the following scenarios:

```js
settings.set('foo', 'bar');

console.log(settings.canQuitSafely());
// => false

app.quit();
```

In the above example, the data that was just set is lost, because the app quit before it had a chance to save to disk. We can ensure that this does not happen by using the `canQuitSafely` method in conjunction with the `'can-quit-safely'` event:

```js
settings.set('foo', 'bar');

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

app.quit();
```

Additionally, all methods that send save requests also return promises that resolve once the settings cache is saved.

```js
settings.set('foo', 'bar').then(() => {
  console.log(settings.canQuitSafely());
  // => true
})

console.log(settings.canQuitSafely());
// => false;
```


***


### `settings.defaults(obj[, callback])`

* **`obj`** *Object* - The object that will be extended by the current settings object.
* **`callback`** *Function* (optional) - Invoked when the settings cache containing these changes have been saved to disk.

Extends the current settings object, ensuring that all keys present within the defaults object exist in the settings object. Take the following for example:

**settings.json**
Given:
```json
{
  "foo": "bar"
}
```

**main.js**

Apply default settings.
```js
settings.defaults({
  foo: 'qux',
  snap: 'crackle'
});

settings.get();
// => { foo: 'bar', snap: 'crackle' }
```



***

<small>Last updated Jul. 15th, 2016, by [Nathan Buchar]</small>



[Electron Settings]: /

[Nathan Buchar]: (mailto:hello@nathanbuchar.com)

[method_has]: #settingshaskeypath
[method_get]: #settingsgetkeypath
[method_set]: #settingssetkeypath-value-callback
[method_delete]: #settingsdeletekeypath-callback
[method_defaults]: #settingsdefaultsobj-callback
[method_canQuitSafely]: #settingscanquitsafely
[method_getPathToConfigFile]: #settingsgetpathtoconfigfile
