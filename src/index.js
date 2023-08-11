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
    for (const k of Object.keys(def)) {
      offsets[k] = size
      size += (parseInt(def[k].match(/(\d+)/)[0]) / 8)
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
          const view = new DataView(memoryBuffer)
          return view[`get${def[prop]}`](obj._address + offsets[prop], littleEndian)
        }
      },
      set (obj, prop, val) {
        if (def[prop]) {
          const view = new DataView(memoryBuffer)
          view[`set${def[prop]}`](obj._address + offsets[prop], val, littleEndian)
        }
        return true
      }
    }
    return address => new Proxy({ _address: address || malloc(size), _size: size }, handler)
  }

  return { struct, setString, getString }
}
