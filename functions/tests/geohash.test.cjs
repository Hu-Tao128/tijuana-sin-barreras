const test = require("node:test");
const assert = require("node:assert/strict");

const { encode, bboxCoveringPrefixes } = require("../lib/middleware/geohash.js");

test("encode - (lat=0, lng=0, precision=7) produce un hash de 7 caracteres", () => {
  const hash = encode(0, 0, 7);
  assert.equal(hash.length, 7);
  assert.ok(/^[0-9bcdefghjkmnpqrstuvwxyz]+$/.test(hash), "Hash debe usar solo caracteres base32 validos");
});

test("encode - Tijuana (lat=32.5, lng=-117.0, precision=7)", () => {
  const hash = encode(32.5, -117.0, 7);
  assert.equal(hash.length, 7);
  assert.ok(hash.startsWith("9"));
});

test("encode - ecuador (lat=0) genera distinto al polo norte (lat=85)", () => {
  const hashEquator = encode(0, -75, 7);
  const hashNorth = encode(85, -75, 7);
  assert.notEqual(hashEquator, hashNorth);
});

test("encode - longitud 180 genera distinto a -180", () => {
  const hash180 = encode(0, 180, 7);
  const hashNeg180 = encode(0, -180, 7);
  assert.notEqual(hash180, hashNeg180);
});

test("encode - misma entrada produce mismo hash", () => {
  const a = encode(40.7128, -74.006, 7);
  const b = encode(40.7128, -74.006, 7);
  assert.equal(a, b);
});

test("encode - precision 1 da hash de 1 caracter", () => {
  const hash = encode(0, 0, 1);
  assert.equal(hash.length, 1);
});

test("encode - precision 10 da hash de 10 caracteres", () => {
  const hash = encode(50, 10, 10);
  assert.equal(hash.length, 10);
});

test("encode - lat 90 lng 180 no lanza excepcion", () => {
  assert.doesNotThrow(() => encode(90, 180, 7));
});

test("encode - lat -90 lng -180 no lanza excepcion", () => {
  assert.doesNotThrow(() => encode(-90, -180, 7));
});

test("bboxCoveringPrefixes - area pequena devuelve al menos 1 prefijo", () => {
  const prefixes = bboxCoveringPrefixes(
    { north: 32.53, south: 32.52, east: -117.0, west: -117.01 },
    5
  );
  assert.ok(prefixes.length >= 1, "Debe devolver al menos 1 prefijo");
});

test("bboxCoveringPrefixes - cada prefijo tiene la precision indicada", () => {
  const prefixes = bboxCoveringPrefixes(
    { north: 32.55, south: 32.50, east: -116.99, west: -117.02 },
    5
  );
  for (const p of prefixes) {
    assert.equal(p.length, 5, `Prefijo ${p} debe tener largo 5`);
  }
});

test("bboxCoveringPrefixes - area de medio grado contiene varios prefijos", () => {
  const prefixes = bboxCoveringPrefixes(
    { north: 33.0, south: 32.0, east: -116.0, west: -117.5 },
    5
  );
  assert.ok(prefixes.length >= 2, "Area de medio grado debe dar varios prefijos");
});

test("bboxCoveringPrefixes - area cubre esquinas correctamente", () => {
  const prefixes = bboxCoveringPrefixes(
    { north: 32.54, south: 32.50, east: -117.00, west: -117.05 },
    5
  );
  assert.ok(prefixes.length >= 1);
});

test("encode - precision default es 7", () => {
  const hash = encode(20, 30);
  assert.equal(hash.length, 7);
});

test("encode - compara dos puntos cercanos comparten prefijo", () => {
  const a = encode(32.53, -117.03, 7);
  const b = encode(32.53001, -117.03001, 7);
  assert.equal(a.slice(0, 6), b.slice(0, 6));
});
