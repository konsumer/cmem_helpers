import memhelpers from './index.js'
import { readFile } from 'fs/promises'
import aEq from 'arraybuffer-equal'

const wasmBytes = await readFile('src/test.wasm')

const memory = new WebAssembly.Memory({
  initial: 10,
  maximum: 100
})

const env = {
  memory,

  // these are imports for the wasm (imported from string.h)

  strcat (dest, src) {
    setString(getString(dest) + getString(src), dest)
    return dest
  },

  strcpy (dest, src) {
    setString(getString(src), dest)
    return dest
  }
}

const mod = (await WebAssembly.instantiate(wasmBytes, { env })).instance.exports
const { struct, setString, getString } = memhelpers(memory.buffer, mod.malloc)

const Color = struct({
  r: 'Uint8',
  g: 'Uint8',
  b: 'Uint8',
  a: 'Uint8'
})

const Vector3 = struct({
  x: 'Int32',
  y: 'Int32',
  z: 'Int32'
})

test('should be able to receive/return a string from WASM function', () => {
  const retPtr = mod.malloc(20)
  mod.test1(setString('World'), retPtr)
  const response = getString(retPtr)
  expect(response).toBe('Hello World')
})

test('should be able to work with an u8 struct', () => {
  const color = Color()
  color.a = 255
  mod.test2(color._address)
  const buf = memory.buffer.slice(color._address, color._address + color._size)
  const ref = new Uint8Array([0x10, 0x02, 0x02, 0x64]).buffer
  expect(aEq(buf, ref)).toBeTruthy()
  expect(color.a).toBe(100)
})

test('should be able to work with an i32 struct', () => {
  const v = Vector3()
  v.x = 0
  v.y = 10
  v.z = -100
  const buf = memory.buffer.slice(v._address, v._address + v._size)
  const ref = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x0a, 0x00, 0x00, 0x00, 0x9c, 0xff, 0xff, 0xff]).buffer
  expect(aEq(ref, buf)).toBeTruthy()
})
