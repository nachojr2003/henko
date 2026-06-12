# CLAUDE.md — Corporación Henko

## Identidad del cliente

| Campo | Valor |
|---|---|
| **Nombre** | Corporación Henko |
| **Slug** | `henko` |
| **Rubro** | Inmobiliaria — venta de lotes residenciales |
| **País** | Perú |
| **Ciudad** | Huancayo y Pichanaki, Junín |
| **Teléfono 1** | 932 846 404 |
| **Teléfono 2** | 973 972 370 |
| **Website** | (pendiente — confirmar con cliente) |
| **Repo GitHub** | `nachojr2003/henko` |

## Identidad visual

> Colores extraídos del logo — APROXIMADOS (no se recibió brand manual oficial).
> Confirmar con el cliente antes de usar en materiales impresos.

| Color | Hex | Uso |
|---|---|---|
| **Verde primario** | `#1B6B2D` | Encabezados, botones primarios, bordes destacados |
| **Amarillo/dorado** | `#F5C300` | Acentos, CTAs secundarios |
| **Blanco** | `#FFFFFF` | Fondos |
| **Gris oscuro** | `#1F2937` | Texto cuerpo |

Logo: cuadrado 1600×1600 px — archivo: `henko logo.jpg`
URL GitHub raw (usar en emails): `https://raw.githubusercontent.com/nachojr2003/henko/main/henko%20logo.jpg`
URL jsDelivr (más estable para emails): `https://cdn.jsdelivr.net/gh/nachojr2003/henko@main/henko%20logo.jpg`

## Proyectos / Productos

### Proyecto La Esmeralda Condominio (Pichanaki)
- Lotes: 100 m², 150 m², 200 m², hasta 250 m²
- Inicial desde S/ 19,900
- Financiamiento directo sin intereses hasta 12 meses
- Cerca de plaza principal y Colegio Los Ángeles
- A 2 cuadras de Av. Marginal

### Proyecto Santa Inés (Orcotuna, Huancayo)
- Lotes: 90 m² a 120 m²
- Inicial desde S/ 9,900
- Frente a la Plaza de Toros de Orcotuna
- A 2 cuadras de la Carretera Central

## Stack técnico

| Componente | Detalle |
|---|---|
| **n8n** | Instancia IJV Agency en GCP |
| **Supabase** | Proyecto compartido IJV — tablas sufijo `_henko` |
| **LLM Chat** | Gemini 2.5 Flash |
| **Embeddings** | gemini-embedding-001 (3072 dims) |
| **Widget** | IIFE vanilla JS en `widget/agent.js` |
| **Hosting** | GitHub Pages / Vercel — repo `nachojr2003/henko` |

## Tablas Supabase

- `leads_henko` — leads capturados por el agente
- `documents_henko` — vector store KB (vector 3072)
- RPC: `match_documents_henko`

## DataTables n8n

- `chat_logs_henko`
- `conversation_insights_henko`

## Workflows n8n

1. `Agent - Chat Henko` — ACTIVO
2. `Agent - Leads Henko` — ACTIVO
3. `_oneshot_henko_kb_ingest` — one-shot (ejecutar una vez, luego desactivar)
4. `Insights - Daily Henko` — INACTIVO inicialmente
5. `Insights - Quincenal Henko` — INACTIVO inicialmente

## Email destino (producción)

> Confirmar con cliente antes de activar. Por ahora, MODE TEST = javier.vergara@ijvagency.com

- Lead notification: (confirmar con cliente)
- Reports: (confirmar con cliente)

## Notas de build

- [ ] SQL corrido en Supabase por Nacho
- [ ] DataTables creadas en n8n
- [ ] KB ingestada (documentos en `documents_henko`)
- [ ] `Agent - Chat Henko` smoke-testeado
- [ ] Widget construido y pusheado
- [ ] Repo GitHub creado: `nachojr2003/henko`
- [ ] Colores confirmados con cliente (actualmente aproximados)
- [ ] URL del sitio del cliente confirmada (para logo en emails)
