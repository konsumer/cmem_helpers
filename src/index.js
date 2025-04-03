const decoder = new TextDecoder("utf-8");
const encoder = new TextEncoder("utf-8");

export default class MemoryView {
  constructor(memory, malloc, littleEndian = true) {
    this.memory = memory;
    this.view = new DataView(memory.buffer);
    this.malloc = malloc;
    this.littleEndian = littleEndian;
  }

  // set a int8 in memory
  setInt8(p, v) {
    return this.view.setInt8(p, v);
  }

  // get a int8 from memory
  getInt8(p) {
    return this.view.getInt8(p);
  }

  // set uint8 in memory
  setUint8(p, v) {
    return this.view.setUint8(p, v);
  }

  // get a uint8 from memory
  getUint8(p) {
    return this.view.getUint8(p);
  }

  // set a int16 in memory
  setInt16(p, v) {
    return this.view.setInt16(p, v, this.littleEndian);
  }

  // get a int16 from memory
  getInt16(p) {
    return this.view.getInt16(p, this.littleEndian);
  }

  // set a uint16 in memory
  setUint16(p, v) {
    return this.view.setUint16(p, v, this.littleEndian);
  }

  // get a uint16 from memory
  getUint16(p) {
    return this.view.getUint16(p, this.littleEndian);
  }

  // set a int32 in memory
  setInt32(p, v) {
    return this.view.setInt32(p, v, this.littleEndian);
  }

  // get a int32 from memory
  getInt32(p) {
    return this.view.getInt32(p, this.littleEndian);
  }

  // set a int32 in memory
  setUint32(p, v) {
    return this.view.setUint32(p, v, this.littleEndian);
  }

  // get a biguint64 from memory
  getUint32(p) {
    return this.view.getUint32(p, this.littleEndian);
  }

  // set a biguint64 in memory
  setBigInt64(p, v) {
    return this.view.setBigInt64(p, v, this.littleEndian);
  }

  // get a biguint64 from memory
  getBigInt64(p) {
    return this.view.getBigInt64(p, this.littleEndian);
  }

  // set a biguint64 in memory
  setBigUint64(p, v) {
    return this.view.setBigUint64(p, v, this.littleEndian);
  }

  // get a biguint64 from memory
  getBigUint64(p) {
    return this.view.getBigUint64(p, this.littleEndian);
  }

  // set a float32 in memory
  setFloat32(p, v) {
    return this.view.setFloat32(p, v, this.littleEndian);
  }

  // get a float32 from memory
  getFloat32(p) {
    return this.view.getFloat32(p, this.littleEndian);
  }

  // set a float64 in memory
  setFloat64(p, v) {
    return this.view.setFloat64(p, v, this.littleEndian);
  }

  // get a float64 from memory
  getFloat64(p) {
    return this.view.getFloat64(p, this.littleEndian);
  }

  // get a string from memory
  getString(ptr) {
    const buffer = new Uint8Array(this.memory.buffer, ptr);
    return decoder.decode(buffer.slice(0, buffer.indexOf(0)));
  }

  // set a string in memory
  setString(value, ptr) {
    if (typeof ptr === "undefined") {
      ptr = this.malloc(value.length + 1);
    }
    let p = ptr;
    for (const b of encoder.encode(value)) {
      this.view.setUint8(p++, b);
    }
    this.view.setUint8(value.length, 0);
    return ptr;
  }

  // get bytes from memory
  getBytes(ptr, len) {
    const buffer = new Uint8Array(this.memory.buffer);
    return buffer.slice(ptr, ptr + len);
  }

  // set some bytes in memory
  setBytes(ptr, value) {
    const buffer = new Uint8Array(this.memory.buffer);
    buffer.set(value, ptr);
  }

  // given a type-description, create/access a struct in memory
  struct(description, ptr) {
    return (value, ptr) => {};
  }
}
