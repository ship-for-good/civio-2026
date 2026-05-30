# Team Naranja

# PRISMA · Transparencia Activa

Asistente de navegación del ecosistema de transparencia española. Ayuda a localizar dónde se publica cada tipo de información pública (presupuestos, retribuciones, contratos, agendas, etc.).

## Problem it solves
La información pública está dispersa, desordenada y es difícil de entender. La herramienta la unifica, la aclara y la hace accesible para cualquiera.

## Prerequisites
- Node.js (v18 o superior)  
- npm o yarn  
- Next.js  
- React  
- TailwindCSS  
- SDK de Anthropic (Claude)

## Installation and setup instructions

## Stack

- [React](https://react.dev/) 19
- [TanStack Start](https://tanstack.com/start) + [TanStack Router](https://tanstack.com/router)
- [Vite](https://vite.dev/) 7
- [Tailwind CSS](https://tailwindcss.com/) 4

En desarrollo, las respuestas del asistente se generan en el cliente a partir de `src/data/catalog.json` (El MVP fue desarrollado sin base de datos ni API externa).

## Requisitos

- **Node.js ≥ 22.12** (requerido por TanStack Start). Comprueba tu versión:

  ```bash
  node -v
  ```

- **Gestor de paquetes**: npm (incluido con Node) o [Bun](https://bun.sh/) (el repo incluye `bun.lock`).

## Ejecución en local

### 1. Clonar e entrar en el proyecto

```bash
git clone https://github.com/ship-for-good/civio-2026.git
git checkout team-naranja
cd team-naranja
```

### 2. Instalar dependencias

Con npm:

```bash
npm install
```

Con Bun:

```bash
bun install
```

### 3. Arrancar el servidor de desarrollo

```bash
npm run dev
```

(o `bun run dev`)

La salida indicará la URL local, normalmente:

```text
Local: http://localhost:8080/
```

### 4. Abrir en el navegador

Visita **http://localhost:8080/** y prueba las consultas sugeridas o escribe la tuya.

**Guía de ejemplos:** [docs/ejemplos-busqueda.md](./docs/ejemplos-busqueda.md) — 5 preguntas detalladas que cubren los estados verde, ámbar y rojo.

### 5. Detener el servidor

En la terminal donde corre el proceso, pulsa **Ctrl + C**.

## Variables de entorno

No es necesario crear un archivo `.env` para desarrollo básico: no hay base de datos ni claves de API configuradas.

Si más adelante añades configuración:

- Secretos y valores solo de servidor: variables sin prefijo en `.env` (ver `src/lib/config.server.ts`).
- Valores públicos accesibles desde el cliente: prefijo `VITE_` en `.env` (nunca pongas secretos ahí).

## Scripts disponibles

| Comando            | Descripción                          |
| ------------------ | ------------------------------------ |
| `npm run dev`      | Servidor de desarrollo con hot reload |
| `npm run build`    | Build de producción                  |
| `npm run preview`  | Previsualizar el build localmente    |
| `npm run lint`     | ESLint                               |
| `npm run format`   | Prettier (formatear el código)       |

## Estructura relevante

```text
src/
  routes/           # Rutas (file-based routing de TanStack)
  data/catalog.json # Catálogo de temas y fuentes de transparencia
  lib/matching.ts   # Lógica de emparejamiento de consultas
  hooks/            # Hook del asistente (mock en cliente)
```

`src/routeTree.gen.ts` se genera automáticamente; no lo edites a mano.

## Solución de problemas

| Problema | Qué hacer |
| -------- | --------- |
| Avisos `EBADENGINE` o errores de TanStack Start | Actualiza Node a ≥ 22.12 |
| Puerto 8080 en uso | Cierra el otro proceso o libera el puerto |
| Dependencias inconsistentes | Borra `node_modules` y ejecuta de nuevo `npm install` |

## Resumen rápido

```bash
npm install
npm run dev
# Abre http://localhost:8080/
```
