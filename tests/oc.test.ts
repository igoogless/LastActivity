import { afterEach, beforeEach, expect, test } from "bun:test"
import { rm, readFile } from "node:fs/promises"
import { construir_payload, crear, generar_evidencia, leer_paquete, validar } from "../src/tools/oc"

const ctx = { directory: import.meta.dir.slice(0, -6), sessionId: "test" }
const parse = (value: string) => JSON.parse(value)

beforeEach(async () => { await rm(`${ctx.directory}/out`, { recursive: true, force: true }) })
afterEach(async () => { await rm(`${ctx.directory}/out`, { recursive: true, force: true }) })

test("aplica bloqueos de proveedor y aprobador", async () => {
  for (const caso of ["sol-002", "sol-003"]) {
    const paquete = parse(await leer_paquete.execute({ caso }, ctx)).data
    const resultado = parse(await validar.execute({ caso, paquete }, ctx)).data
    expect(resultado.apta).toBe(false)
    expect(resultado.bloqueos.length).toBeGreaterThan(0)
  }
})

test("detecta retroactividad RC8 en sol-005", async () => {
  const paquete = parse(await leer_paquete.execute({ caso: "sol-005" }, ctx)).data
  const resultado = parse(await validar.execute({ caso: "sol-005", paquete }, ctx)).data
  expect(resultado.retroactiva).toBe(true)
  expect(resultado.confirmaciones.join(" ")).toContain("RC8")
})

test("genera evidencia TXT y PDF", async () => {
  const evidence = parse(await generar_evidencia.execute({ caso: "sol-001" }, ctx)).data
  expect(evidence.ruta).toBe("out/sol-001/aprobacion.pdf")
  const pdf = await readFile(`${ctx.directory}/out/sol-001/aprobacion.pdf`)
  expect(pdf.subarray(0, 4).toString()).toBe("%PDF")
})

test("requiere confirmación antes de crear una excepción", async () => {
  const paquete = parse(await leer_paquete.execute({ caso: "sol-004" }, ctx)).data
  const validacion = parse(await validar.execute({ caso: "sol-004", paquete }, ctx)).data
  const payload = parse(await construir_payload.execute({ caso: "sol-004", paquete, derivados: validacion.derivados }, ctx)).data.payload
  expect(parse(await crear.execute({ caso: "sol-004", payload }, ctx)).ok).toBe(false)
  const created = parse(await crear.execute({ caso: "sol-004", payload, confirmado: true }, ctx)).data
  expect(created.numero_oc).toBe("4500000001")
  expect(payload.excepciones[0].codigo).toBe("RC5")
})

test("mantiene idempotencia", async () => {
  const paquete = parse(await leer_paquete.execute({ caso: "sol-001" }, ctx)).data
  const validacion = parse(await validar.execute({ caso: "sol-001", paquete }, ctx)).data
  const payload = parse(await construir_payload.execute({ caso: "sol-001", paquete, derivados: validacion.derivados }, ctx)).data.payload
  await crear.execute({ caso: "sol-001", payload }, ctx)
  const duplicate = parse(await crear.execute({ caso: "sol-001", payload }, ctx)).data
  expect(duplicate.idempotente).toBe(true)
})
