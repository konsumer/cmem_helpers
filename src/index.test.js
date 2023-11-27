import memhelpers from './index.js'
import { readFile } from 'fs/promises'
import aEq from 'arraybuffer-equal'

const wasmBytes = await readFile('src/test.wasm')

const memory = new WebAssembly.Memory({
  initial: 10,
  maximum: 100
})

const getStructAsBytes = (s) => memory.buffer.slice(s._address, s._address + s._size)

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
const { struct, structClass, setString, getString } = memhelpers(memory.buffer, mod.malloc)

const Color = struct({
  r: 'Uint8',
  g: 'Uint8',
  b: 'Uint8',
  a: 'Uint8'
})

const ColorClass = structClass({
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

const Vector3Class = structClass({
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
  const color = Color({ r: 0, g: 0, b: 0, a: 0 })
  color.a = 255
  const buf = getStructAsBytes(color)
  const ref = new Uint8Array([0x00, 0x00, 0x00, 0xff]).buffer
  expect(aEq(buf, ref)).toBeTruthy()
  expect(color.a).toBe(255)
})

test('should be able to work with an i32 struct', () => {
  const v = Vector3()
  v.x = 0
  v.y = 10
  v.z = -100
  const buf = getStructAsBytes(v)
  const ref = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x0a, 0x00, 0x00, 0x00, 0x9c, 0xff, 0xff, 0xff]).buffer
  expect(aEq(ref, buf)).toBeTruthy()
  expect(v.x).toEqual(0)
  expect(v.y).toEqual(10)
  expect(v.z).toEqual(-100)
})

test('should be able to work with an u8 structClass', () => {
  const color = new ColorClass({ r: 0, g: 0, b: 0, a: 0 })
  color.a = 255
  const buf = getStructAsBytes(color)
  const ref = new Uint8Array([0x00, 0x00, 0x00, 0xff]).buffer
  expect(aEq(buf, ref)).toBeTruthy()
  expect(color.a).toBe(255)
})

test('should be able to work with an i32 structClass', () => {
  const v = new Vector3Class()
  v.x = 0
  v.y = 10
  v.z = -100
  const buf = getStructAsBytes(v)
  const ref = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x0a, 0x00, 0x00, 0x00, 0x9c, 0xff, 0xff, 0xff]).buffer
  expect(aEq(ref, buf)).toBeTruthy()
  expect(v.x).toEqual(0)
  expect(v.y).toEqual(10)
  expect(v.z).toEqual(-100)
})
