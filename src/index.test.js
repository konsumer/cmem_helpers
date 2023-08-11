import memhelpers from './index.js'
import { readFile } from 'fs/promises'

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

test('should be able to receive/return a string from WASM function', () => {
  const retPtr = mod.malloc(20)
  mod.test1(setString('World'), retPtr)
  const response = getString(retPtr)
  expect(response).toBe('Hello World')
})

test('should be able to work with a struct', () => {
  const color = Color()
  color.a = 255
  mod.test2(color._address)
  console.log(color._address)
})
