# keywords.json — cómo añadir palabras clave

**Archivo a editar:** [`keywords.json`](./keywords.json) (esta carpeta `docs/`).

El buscador importa este fichero en tiempo de compilación. Tras guardar cambios:

1. **Reinicia** el servidor de desarrollo (`Ctrl+C` y `npm run dev`).
2. Prueba la consulta en `/es/buscador`.

## Reglas de coincidencia

- **Una palabra** (p. ej. `"sueldo"`): debe aparecer al **inicio de una palabra** en la consulta (`\b`). No hace falta coincidir con la palabra entera: `"sueldo"` coincide con `"sueldos"`.
- **Varias palabras** (p. ej. `"alto cargo"`): la frase debe aparecer **tal cual** en la consulta (sin importar tildes: `retribución` = `retribucion`).
- **Orden del grafo:** se recorre `knowledge_graph` de arriba a abajo; **la primera coincidencia gana**. Si añades una keyword en un nodo que va después de otro, un nodo anterior puede “robar” la consulta (p. ej. `"declaración"` → `bienes_patrimonio` antes que otros).
- **Tildes:** se ignoran al comparar.

## Solo añadir keyword a un tema existente

Edita el array `keywords` del nodo (`retribuciones`, `contratacion`, etc.). No hace falta tocar `topics.ts`.

## Añadir un tema nuevo (`id` nuevo)

1. Añade el nodo en `keywords.json`.
2. Añade el mismo `id` y textos en [`src/domain/buscador/topics.ts`](../src/domain/buscador/topics.ts).
3. Añade el `id` al tipo `TopicId` en [`src/domain/buscador/types.ts`](../src/domain/buscador/types.ts).

Si falta `topics.ts`, el buscador mostrará **unknown** aunque la keyword coincida.
