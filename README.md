# Agente de Órdenes de Compra SAP

## Arranque

```bash
bun install && bun run dev
```

Abre `http://localhost:3000`. Sin `ANTHROPIC_API_KEY`, la aplicación conserva un flujo local determinista para procesar los fixtures. Con clave, usa el ciclo de herramientas del proveedor Anthropic. Copia `.env.example` a `.env` para configurar puerto, modelo y límite de iteraciones.

## Demo sin modelo

```bash
bun run demo
bun run test
```

Procesa los seis casos, confirma `sol-004` y verifica la idempotencia de `sol-001`.

## API

- `POST /api/chat` → `{ sessionId, message }`
- `GET /api/sessions/:id`
- `GET /api/health`

La salida se escribe bajo `out/`; no se versiona. El servidor limita las solicitudes por sesión, aplica CSP y no registra el contenido de conversación. Configura `ALLOWED_ORIGIN` al desplegar. Para un despliegue reproducible: `docker build -t oc-agent . && docker run -p 3000:3000 --env-file .env oc-agent`. La URL pública depende del proveedor y sus credenciales de despliegue.
