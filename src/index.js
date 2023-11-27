// this is called when the user didn't set malloc
function noMalloc () {
  throw new Error('No malloc defined. Either give a malloc to setup, or an address to this operation.')
}

// if len is not set, this is the max-size of a string for getString
const MAX_STRING_LEN = 1024 * 20

const decoder = new TextDecoder()
const encoder = new TextEncoder()

export default function cmemHelpers (memoryBuffer, malloc = noMalloc, littleEndian = true) {
  function setString (value, pointer, len = 0) {
    if (!len) {
      len = value.length + 1
    }
    if (!pointer) {
      pointer = malloc(len)
    }
    const mem = new Uint8Array(memoryBuffer)
    const buffer = encoder.encode(value)
    for (let b = 0; b < len; b++) {
      mem[pointer + b] = buffer[b] || '\0'
    }
    return pointer
  }

  function getString (pointer, len = 0) {
    const mem = new DataView(memoryBuffer)
    let end = pointer + len
    if (!len) {
      while (end < (pointer + MAX_STRING_LEN)) {
        if (mem.getUint8(end) === 0) {
          break
        }
        end++
      }
    }
    return decoder.decode(memoryBuffer.slice(pointer, end))
  }

  const struct = def => {
    const offsets = {}
    let size = 0
    const fieldSizes = {}
    for (const k of Object.keys(def)) {
      offsets[k] = size
      fieldSizes[k] = parseInt(def[k].match(/(\d+)/)[0]) / 8
      size += fieldSizes[k]
    }

    // it's tempting to cache these as a single DataView, but it can get out of sync
    const handler = {
      get (obj, prop) {
        if (prop == '_address') {
          return obj._address
        }

        if (prop == '_size') {
          return obj._size
        }

        if (def[prop]) {
          const view = new DataView(obj._buffer)
          return view[`get${def[prop]}`]((obj._address + offsets[prop]), littleEndian)
        }
      },
      set (obj, prop, val) {
        if (def[prop]) {
          const view = new DataView(obj._buffer)
          view[`set${def[prop]}`]((obj._address + offsets[prop]), val, littleEndian)
        }
        return true
      }
    }
    return (initval = {}, address) => {
      const p = new Proxy({ _address: address || malloc(size), _size: size, _buffer: memoryBuffer }, handler)
      for (const i of Object.keys(initval)) {
        p[i] = initval[i]
      }
      return p
    }
  }

  const structClass = def => {
    const offsets = {}
    let size = 0
    const fieldSizes = {}
    for (const k of Object.keys(def)) {
      offsets[k] = size
      fieldSizes[k] = parseInt(def[k].match(/(\d+)/)[0]) / 8
      size += fieldSizes[k]
    }
    const f = new Function(['malloc', 'memoryBuffer', 'littleEndian'], `return class {
      constructor(init={}, address) {
        this._size = ${size}
        this._address = address || malloc(this._size)
        this._mem = memoryBuffer
        this._littleEndian = littleEndian
        for (const k of Object.keys(init)) {
          this[k] = init[k]
        }
      }
${Object.keys(offsets).map(k => {
        return `        get ${k}() {
          const view = new DataView(this._mem)
          return view.get${def[k]}((this._address + ${offsets[k]}), this._littleEndian)
        }
        set ${k}(v) {
          const view = new DataView(this._mem)
          view.set${def[k]}((this._address + ${offsets[k]}), v, this._littleEndian)
        }`
      }).join('\n')}
    }`)
    return f(malloc, memoryBuffer, littleEndian)
  }

  return { struct, structClass, setString, getString }
}
