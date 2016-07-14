[Electron Settings] » **Methods**

***

Methods
=======

* [`has()`][method_has]
* [`get()`][method_get]
* [`set()`][method_set]
* [`unset()`][method_unset]
* [`clear()`][method_clear]
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

Returns the value of the key at the chosen key path. If no key path is specified, this will return the entire settings object instead. Take the following for example:

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


### `settings.set(keyPath, value[, options])`

* **`keyPath`** *String* - The path to the key whose value we wish to set. This key need not already exist.
* **`value`** *Any* - The value to set the key and the chosen key path to.
* **`options`** *Object*
  * `options.shouldSave` *Boolean* (optional) - Whether or not we should issue a save request to update the settings file. Defaults to `true`.
  * `options.saveImmediately` *Boolean* (optional) - Whether or not we should save to disk immediately. This is functionally equivalent to a 0ms debounce, but note that it is still an asynchronous save. Defaults to `false`.

Sets the value of the key at the chosen key path. If no key path is specified, this will set the value of the entire settings object instead, but `value` must be an object. Returns a promise that will resolve the when the settings cache containing these changes is saved to disk. Take the following for example:

```js
settings.set('user.name', {
  first: 'Cosmo',
  last: 'Kramer'
});

settings.get('user.name.first');
// => 'Cosmo'
```


***


### `settings.unset(keyPath[, options])`

* **`keyPath`** *String* - The path to the key we wish to delete.
* **`options`** *Object*
  * `options.shouldSave` *Boolean* (optional) - Whether or not we should issue a save request to update the settings file. Defaults to `true`.
  * `options.saveImmediately` *Boolean* (optional) - Whether or not we should save to disk immediately. This is functionally equivalent to a 0ms debounce, but note that it is still an asynchronous save. Defaults to `false`.

Deletes the key and value at the chosen key path. Returns a promise that will resolve the when the settings cache containing these changes is saved to disk. Take the following for example:

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
settings.unset('foo.bar');

settings.get('foo');
// => { foo: {} }
```

You can see above that when we unset the value of `'foo.bar'`, the value for `'foo'` has been deleted and replaced with an empty object. Note here that unsetting a key will not set it to `null`.


***


### `settings.clear([options])`

* **`options`** *Object*
  * `options.shouldSave` *Boolean* (optional) - Whether or not we should issue a save request to update the settings file. Defaults to `true`.
  * `options.saveImmediately` *Boolean* (optional) - Whether or not we should save to disk immediately. This is functionally equivalent to a 0ms debounce, but note that it is still an asynchronous save. Defaults to `false`.

Clears the entire settings object. Returns a promise that will resolve the when the settings cache containing these changes is saved to disk. Take the following for example:

**settings.json**
Given:
```json
{
  "foo": {
    "bar": "baz"
  }
}
```

**main.js**
```js
settings.clear();

settings.get();
// => {}
```


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


### `settings.defaults(obj[, options])`

* `obj` *Object* - The object that will be extended by the current settings object.
* **`options`** *Object*
  * `options.shouldSave` *Boolean* (optional) - Whether or not we should issue a save request to update the settings file. Defaults to `true`.
  * `options.saveImmediately` *Boolean* (optional) - Whether or not we should save to disk immediately. This is functionally equivalent to a 0ms debounce, but note that it is still an asynchronous save. Defaults to `false`.
  * `options.overwrite` *Boolean* (optional) - Whether or not we should overwrite settings that already exist with their respective default values (shallow merge). Defaults to `false`.

Extends the current settings object, ensuring that all keys present within the defaults object exist in the settings object. Returns a promise that will resolve the when the settings cache containing these changes is saved to disk. Take the following for example:

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

Apply default settings using `options.overwrite`.
```js
settings.defaults({
  foo: 'qux',
  snap: 'crackle'
}, {
  overwrite: true
});

settings.get();
// => { foo: 'qux', snap: 'crackle' }
```



***

<small>Last updated Jul. 14th, 2016, by [Nathan Buchar]</small>



[Electron Settings]: /

[Nathan Buchar]: (mailto:hello@nathanbuchar.com)

[method_has]: #settingshaskeypath
[method_get]: #settingsgetkeypath
[method_set]: #settingssetkeypath-value-options
[method_unset]: #settingsunsetkeypath-options
[method_clear]: #settingsclearoptions
[method_defaults]: #settingsdefaultsobj-options
[method_canQuitSafely]: #methodcanquitsafely
[method_getPathToConfigFile]: #methodgetpathtoconfigfile
