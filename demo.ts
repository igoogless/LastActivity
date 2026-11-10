import { rm } from "node:fs/promises"
import { construir_payload, crear, leer_paquete, validar } from "./src/tools/oc"

const directory = import.meta.dir
const ctx = { directory, sessionId: "demo" }
await rm(`${directory}/out`, { recursive: true, force: true })

for (const caso of ["sol-001", "sol-002", "sol-003", "sol-004", "sol-005", "sol-006"]) {
  const packageResult = JSON.parse(await leer_paquete.execute({ caso }, ctx))
  if (!packageResult.ok) { console.log(`${caso}: ${packageResult.error}`); continue }
  const validation = JSON.parse(await validar.execute({ caso, paquete: packageResult.data }, ctx)).data
  console.log(`\n${caso}: apta=${validation.apta}; bloqueos=${validation.bloqueos.join(" | ") || "ninguno"}; confirmaciones=${validation.confirmaciones.join(" | ") || "ninguna"}; retroactiva=${validation.retroactiva}`)
  if (!validation.apta) continue
  const payloadResult = JSON.parse(await construir_payload.execute({ caso, paquete: packageResult.data, derivados: validation.derivados }, ctx))
  if (caso === "sol-004") { console.log("sol-004: confirmación explícita aplicada"); console.log(JSON.parse(await crear.execute({ caso, payload: payloadResult.data.payload, confirmado: true }, ctx)).data); continue }
  if (!validation.confirmaciones.length) console.log(JSON.parse(await crear.execute({ caso, payload: payloadResult.data.payload }, ctx)).data)
}
const duplicatePackage = JSON.parse(await leer_paquete.execute({ caso: "sol-001" }, ctx)).data
const duplicateValidation = JSON.parse(await validar.execute({ caso: "sol-001", paquete: duplicatePackage }, ctx)).data
const duplicatePayload = JSON.parse(await construir_payload.execute({ caso: "sol-001", paquete: duplicatePackage, derivados: duplicateValidation.derivados }, ctx)).data.payload
console.log("\nIdempotencia sol-001:", JSON.parse(await crear.execute({ caso: "sol-001", payload: duplicatePayload }, ctx)).data)
