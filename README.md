# cmem_helpers

This provides a few simple & light helpers for working with C-memory. It should be useful for FFI, native node-modules, and browser/node wasm, and has no dependencies. It should also work for other runtimes like bun, deno, or quickjs.

Use it to pass and work with strings, and structs. It is very light and intended for no-emscripten host-code, or situations where you want to do your own thing, a bit.

I also wrote a couple medium posts about how it works:

- [structs](https://medium.com/@konsumer/c-structs-and-javascript-9012d7e0ca8a)
- [strings](https://medium.com/@konsumer/c-strings-and-javascript-b79784bc921e)

## usage

### installation

You can add it to your project like this:

```
npm i cmem_helpers
```

And then import or require it:

```js
import memhelpers from 'cmem_helpers'

// OR

const memhelpers = require('cmem_helpers')
```

You can also use it on the web:

```html
<script type=module>
import memhelpers from 'https://cdn.jsdelivr.net/npm/cmem_helpers/+esm'
</script>
```

You can also use an [importmap](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap) to make your code look the same:

```html
<script type="importmap">
{
  "imports": {
    "cmem_helpers": "https://cdn.jsdelivr.net/npm/cmem_helpers/+esm"
  }
}
</script>
<script type=module>
import memhelpers from 'cmem_helpers'
// YOUR CODE HERE
</script>
```

### getting started

Here is an example with WASM, in the browser/nodejs:

```js
import memhelpers from 'cmem_helpers'

// define this to pass functions to WASM
const env = {
  demo(namePtr){
    console.log(`Hello ${getString(namePtr)}!`)
  }
}

// load your bytes in wasmBytes however you do that
const wasmBytes = '...'

const mod = (await WebAssembly.instantiate(wasmBytes, { env })).instance.exports

// here is the actual setup
const { struct, structClass, setString, getString } = memhelpers(mod.memory.buffer, mod.malloc)
```

The first param is a buffer associated with the memory, and the second is optional, and it's a way to allocate bytes, and get a pointer. In this example, I exposed a function called `malloc` in my wasm, so I can allocate bytes, in the host. You can see an example in the [test wasm](src/wasm/).

### strings

These are for basic C-style null-terminated UTF-8 strings.

```js
// get a string from a pointer, using /0 termination (standard c-string)
getString(strPtr)

// explicitly tell it the length
getString(strPtr, 100)

// set a string in memory, with length (remember the last /0 char)
setString("Hello", address, 6)

// set a string in memory, without length
setString("Hello", address)

// get a pointer to a new string (if you setup malloc earlier)
const ptr = setString("Hello")
```


### structs

This very simple helper uses [DataView](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView) to interact directly with the memory.

Valid types are:

- `BigInt64`
- `BigUint64`
- `Float32`
- `Float64`
- `Int16`
- `Int32`
- `Int8`
- `Uint16`
- `Uint32`
- `Uint8`

You can define a struct like this:

```js
const Color = struct({
  r: 'Uint8',
  g: 'Uint8',
  b: 'Uint8',
  a: 'Uint8'
})
```

And now you can make `Color` objects, with an address, and/or intiial value:

```js
const color = Color({r: 0, g: 0, b: , a: 255}, address)
```

If you provided a `malloc` function earlier, when you set it up, you can also do this:

```js
const color = Color()
const color = Color({r: 0, g: 0, b: , a: 255})
```

And it will allocate it for you. It will have a couple members: `_size` and `_address` that you can use in other things, for example to pass the pointer to a function:

```js
mod.useMyColor(color._address)
```

#### structClass

You can also use `structClass`, if you like to use them more like classes, and they will work the same:

```js
const Color = structClass({
  r: 'Uint8',
  g: 'Uint8',
  b: 'Uint8',
  a: 'Uint8'
})
const color = new Color()
```


### planned

I have a few ideas for the future:

- All struct-type also as fixed-length arrays (eg `ArrayUint8(10, address)`)
- Nested struct fields as pointers (with param for bit-size to support wasm/ffi) or inline-bytes
