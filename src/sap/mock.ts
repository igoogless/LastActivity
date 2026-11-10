import { mkdir, readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"
import type { OrdenCompra, SapAdapter } from "./adapter"

type StoredOrder = { numero_oc: string; fecha: string; orden: OrdenCompra }

export class MockSapAdapter implements SapAdapter {
  constructor(private readonly directory: string) {}

  private get ordersPath() {
    return join(this.directory, "out", "sap", "ordenes.jsonl")
  }

  private async orders(): Promise<StoredOrder[]> {
    try {
      const content = await readFile(this.ordersPath, "utf8")
      return content.trim() ? content.trim().split("\n").map((line) => JSON.parse(line) as StoredOrder) : []
    } catch {
      return []
    }
  }

  async consultarProveedor(nit: string) {
    const providers = JSON.parse(await readFile(join(this.directory, "reto-03", "maestros", "proveedores.json"), "utf8")) as Array<{ nit: string; codigo_sap: string; activo: boolean }>
    const provider = providers.find((item) => item.nit === nit)
    return provider ? { codigo_sap: provider.codigo_sap, activo: provider.activo } : null
  }

  async buscarOrdenPorReferencia(solicitud_id: string) {
    const order = (await this.orders()).find((item) => item.orden.referencia.solicitud_id === solicitud_id)
    return order ? { numero_oc: order.numero_oc } : null
  }

  async crearOrden(orden: OrdenCompra) {
    const existing = await this.buscarOrdenPorReferencia(orden.referencia.solicitud_id)
    if (existing) return { ...existing, fecha: new Date().toISOString() }
    const orders = await this.orders()
    const record: StoredOrder = { numero_oc: String(4_500_000_001 + orders.length), fecha: new Date().toISOString(), orden }
    await mkdir(join(this.directory, "out", "sap"), { recursive: true })
    await writeFile(this.ordersPath, `${JSON.stringify(record)}\n`, { flag: "a" })
    return { numero_oc: record.numero_oc, fecha: record.fecha }
  }
}
