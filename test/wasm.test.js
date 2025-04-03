// this tests wasm interop and structs

import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import WasiPreview1 from 'easywasi'

import MemoryView from '../src/index.js'

const wasi_snapshot_preview1 = new WasiPreview1()
wasi_snapshot_preview1.fd_fdstat_set_rights = () => {}

const memory = new WebAssembly.Memory({ initial: 1024, maximum: 1024 })
const mod = await WebAssembly.compile(await readFile(path.join(import.meta.dirname, 'test.wasm')))
const i = await WebAssembly.instantiate(mod, {
  env: { memory },
  wasi_snapshot_preview1
})
const wasm = i.exports
const mem = new MemoryView(memory, wasm.malloc)

const Color = mem.struct({
  r: 'Uint8',
  g: 'Uint8',
  b: 'Uint8',
  a: 'Uint8'
})

test('should be able to receive/return a string from WASM function', ({ assert }) => {
  const retPtr = wasm.malloc(20)
  wasm.test1(mem.setString('World'), retPtr)
  const response = mem.getString(retPtr)
  assert.equal(response, 'Hello World')
})

test('should be able to work with an u8 struct', ({ assert }) => {
  const color = Color({ r: 0, g: 0, b: 0, a: 0 })
  color.a = 255
  const buf = color._bytes
  const ref = new Uint8Array([0x00, 0x00, 0x00, 0xff]).buffer
  assert.deepEqual(buf, ref)
  mod.test2(color._address)
  assert.equal(color.r, 0)
  assert.equal(color.g, 0)
  assert.equal(color.b, 0)
  assert.equal(color.a, 100)
})
