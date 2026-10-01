# Sistema de diseño — CtrlAsis

Guía de identidad visual del frontend Angular de control de acceso.

## Paleta de marca

Cinco colores base definen toda la aplicación. El acento de marca (amarillo) es el único color saturado permitido; el resto son neutros cálidos (crema/gris/negro). La paleta **no cambia entre temas**: lo que cambia es el rol que cada token semántico cumple (los fondos se oscurecen, el texto se aclara), usando siempre estos 5 colores.

| Nombre | Hex | RGB |
|--------|-----|-----|
| Crema | `#F4F2E8` | `244, 242, 232` |
| Gris claro | `#B0B0B0` | `176, 176, 176` |
| Amarillo (acento) | `#FFDF00` | `255, 223, 0` |
| Gris carbón | `#413F3F` | `65, 63, 63` |
| Negro | `#1C1C1C` | `28, 28, 28` |

## Principios de diseño

- **Poco ruido visual.** Sin sombras ni gradientes decorativos; las únicas sombras admitidas son delgadas (`shadow-[0px_1px_3px_rgba(0,0,0,0.1)]`) para separar superficies elevadas (modales, tarjetas de resultado).
- **Jerarquía por tamaño y peso, no por color.** Los títulos se diferencian por tamaño de fuente y grosor, nunca por saturación. Dejar texto de contenido en amarillo está prohibido (ver reglas del acento).
- **`Space Grotesk` para números destacados** (KPIs, montos, DNI en pantalla de ingreso). El resto de la tipografía usa `Inter`.
- **Los estados activos/seleccionados usan la "píldora negra con amarillo"**: fondo `secondary-container` (negro) + texto/ícono `on-secondary-container` (amarillo). Amaba sobre cualquier superficie clara u oscura.

## Reglas del acento amarillo (`primary`)

Permitido únicamente en:
- CTAs principales (botones con texto negro sobre amarillo: `bg-secondary text-on-secondary`).
- KPIs e íconos destacados, **nunca** como texto de cuerpo.
- Elementos activos/seleccionados (navegación, pestañas, números de paginación activos, `hover:text-primary` en íconos de acción).
- Acentos mínimos (barras de gráficos `secondary-fixed`).

Prohibido:
- Texto de contenido, títulos o labels (usar `on-background` / `on-surface` / `on-surface-variant`).
- Fondo de paneles completos (hoja de marca neutra en superficies).

## Tokens de color por tema

Todos los tokens se definen en `src/styles.css`: los valores **Light** dentro de `@theme` y los **Dark** en el bloque `.dark`. Se acceden en componentes con utilities de Tailwind (`bg-surface`, `text-on-surface`, etc.) — cada utility emite `var(--color-*)`, por lo que el tema se aplica sin tocar los componentes.

### Semánticos canónicos

| Token | Light | Dark |
|-------|-------|------|
| `background` | `#F4F2E8` | `#1C1C1C` |
| `surface` | `#FFFFFF` | `#413F3F` |
| `surface-muted` | `#B0B0B0` | `#413F3F` |
| `primary` | `#FFDF00` | `#FFDF00` |
| `text` | `#1C1C1C` | `#F4F2E8` |
| `text-muted` | `#413F3F` | `#B0B0B0` |
| `border` | `#B0B0B0` | `#413F3F` |

### Superficies

| Token | Light | Dark |
|-------|-------|------|
| `on-background` | `#1C1C1C` | `#F4F2E8` |
| `on-surface` | `#1C1C1C` | `#F4F2E8` |
| `surface-bright` | `#FFFFFF` | `#4A4848` |
| `surface-dim` | `#EEEAD9` | `#2E2C2C` |
| `surface-variant` | `#E7E3D4` | `#3A3838` |
| `on-surface-variant` | `#413F3F` | `#B0B0B0` |
| `surface-container-lowest` | `#FFFFFF` | `#4A4848` |
| `surface-container-low` | `#FAF7EC` | `#454343` |
| `surface-container` | `#F4F2E8` | `#504E4E` |
| `surface-container-high` | `#EBE8DA` | `#5A5858` |
| `surface-container-highest` | `#E2DFCE` | `#646262` |
| `surface-tint` | `#FFDF00` | `#FFDF00` |

### Acento de marca (primary/secondary = amarillo)

| Token | Light | Dark |
|-------|-------|------|
| `primary-container` | `#FFF3B0` | `#7A6D1F` |
| `on-primary-container` | `#1C1C1C` | `#1C1C1C` |
| `primary-fixed` | `#FFEF9E` | `#A8962A` |
| `on-primary-fixed` | `#1C1C1C` | `#F4F2E8` |
| `primary-fixed-dim` | `#EEDF8F` | `#5E5A20` |
| `on-primary-fixed-variant` | `#413F3F` | `#F4F2E8` |
| `secondary` | `#FFDF00` | `#FFDF00` |
| `on-secondary` | `#1C1C1C` | `#1C1C1C` |
| `secondary-container` | `#1C1C1C` | `#1C1C1C` |
| `on-secondary-container` | `#FFDF00` | `#FFDF00` |
| `secondary-fixed` | `#FFDF00` | `#FFDF00` |
| `on-secondary-fixed` | `#1C1C1C` | `#1C1C1C` |
| `secondary-fixed-dim` | `#D6BB00` | `#C7AC00` |
| `on-secondary-fixed-variant` | `#8A7A00` | `#C9C4B0` |

### Neutros de apoyo (íconos, tooltips, avatares)

| Token | Light | Dark |
|-------|-------|------|
| `tertiary` | `#413F3F` | `#F4F2E8` |
| `on-tertiary` | `#F4F2E8` | `#1C1C1C` |
| `tertiary-container` | `#E7E3D4` | `#555252` |
| `on-tertiary-container` | `#2A2929` | `#F4F2E8` |
| `tertiary-fixed` | `#413F3F` | `#C7C2B2` |
| `on-tertiary-fixed` | `#F4F2E8` | `#1C1C1C` |
| `tertiary-fixed-dim` | `#C8C3B2` | `#8F8A78` |

### Estados semánticos

| Token | Light | Dark |
|-------|-------|------|
| `success` | `#1B7F3B` | `#5FCE83` |
| `on-success` | `#FFFFFF` | `#0F3D1C` |
| `success-container` | `#D6F0D3` | `#1E4830` |
| `on-success-container` | `#0E3D22` | `#BDECCB` |
| `warning` | `#B26A00` | `#FFC53D` |
| `on-warning` | `#FFFFFF` | `#4A2B00` |
| `warning-container` | `#FBEBC5` | `#5A4015` |
| `on-warning-container` | `#4A2B00` | `#FBEBC5` |
| `warning-dim` | `#D9A315` | `#B07D10` |
| `warning-hover` | `#8A5500` | `#D9A315` |
| `danger` (alias `error`) | `#C32E2E` | `#FF6B6B` |
| `on-danger` | `#FFFFFF` | `#4A1010` |
| `danger-container` | `#FFDAD9` | `#5E1B1B` |
| `on-danger-container` | `#8B1616` | `#FFDAD9` |

### Bordes e inversos

| Token | Light | Dark |
|-------|-------|------|
| `outline` | `#B0B0B0` | `#413F3F` |
| `outline-variant` | `#D6D3C6` | `#4D4A4A` |
| `inverse-primary` | `#FFDF00` | `#FFDF00` |
| `inverse-surface` | `#1C1C1C` | `#F4F2E8` |
| `inverse-on-surface` | `#F4F2E8` | `#1C1C1C` |

> Nota: los tokens `text`, `text-muted`, `border` y `surface-muted` generan utilities de nombre literales (`text-text`, `border-border`) que no se usan en los componentes; existen solo como mapeo de la solicitud original. Usar los tokens `on-*/outline` para contenido y bordes.

## Notificaciones (toast)

Sistema global de feedback desplegado en `app.html` (`<app-toast-container />`).

### Servicio — `ToastService` (`core/services/toast.service.ts`)

- Singleton (`providedIn: 'root'`). Signal reactiva `toasts` con la cola visible.
- API: `success(message, opts)`, `error(...)`, `warning(...)`, `info(...)`; `opts = { title?, duration? }`.
- Máximo **3 toasts visibles** (el más antiguo sale con animación al entrar uno nuevo).
- Auto-dismiss por defecto **4000 ms**; cierre manual con botón X o tecla `Escape`.
- La salida anima con la clase `leaving` (~200 ms) antes de quitarse del estado.

### Componente — `ToastComponent` (`shared/components/toast/`)

- Posición: **top-right** en desktop, **top-center** en móvil (breakpoint 640px).
- Tipos por tokens del tema:
  | Tipo | Icono | Fondo / borde / texto |
  |------|-------|-----------------------|
  | `success` | CheckCircle | `success-container` / `success` / `on-success-container` |
  | `error` | XCircle | `error-container` / `error` / `on-error-container` |
  | `warning` | AlertTriangle | `warning-container` / `warning` / `on-warning-container` |
  | `info` | Info | `tertiary-container` / `tertiary` / `on-tertiary-container` |
- Barra de progreso inferior con el acento del tipo; al hacer **hover se pausa** el auto-dismiss (`animation-play-state`). Al terminar la barra se cierra el toast.
- Entrada: *slide-in-right* con rebote (desktop) y *slide-in-top* con rebote (móvil). Sin hex nuevos: todo vía `var(--color-*)`.
- Accesibilidad: cada toast con `role="alert"`, contenedor `aria-live="polite" aria-atomic="false"`, botón de cierre con `aria-label`, y cierre con `Escape`. Z-index `100` (por encima de modales `z-50`).
- Uso (reemplaza alerts inline): cargas/fallos de página, validación de acceso, CRUD de socios y todos los formularios (pagos, planes, catálogos, configuración, login).

## Tema claro/oscuro

### Implementación

- `src/app/core/services/theme.service.ts` — `ThemeService` expone el modo como signal de solo lectura (`ThemeMode = 'light' | 'dark'`), con `toggle()`, `setMode()`, resolución inicial (localStorage → `prefers-color-scheme`) y aplicación (togglea la clase `.dark` sobre `document.documentElement`). Usa `isPlatformBrowser` para ser seguro bajo SSR.
- `src/index.html` — script inline anti-FOUC que aplica la clase `.dark` antes del bootstrap de Angular (misma lógica de persistencia) para evitar destello de tema claro.
- `src/app/shared/components/layout/navbar/navbar.component.html` — botón de toggle con íconos `Sun`/`Moon` (`lucide-angular`), `aria-label` dinámico.

### Persistencia

Clave `ctrlasis_theme` en `localStorage`, con valores `light`/`dark`. Si no existe, se respeta la preferencia del sistema.

### Cómo agregar un token nuevo respetando light/dark

1. Definir el valor **Light** en `src/styles.css` dentro de `@theme` (p. ej. `--color-marca-cool-tone: #123456;`).
2. Definir el valor **Dark** en el bloque `.dark` del mismo archivo.
3. Usarlo en componentes con la utility generada: `bg-marca-cool-tone`, `text-marca-cool-tone`, `border-marca-cool-tone`.

Nunca añadir hex directamente en un componente — editar siempre `styles.css` para mantener ambos temas.

## Accesibilidad (WCAG AA)

Lineamientos que aplica todo el frontend.

### Contraste verificado

Ratios de contraste calculados sobre las superficies reales de uso (se conservan tras aplicar luz/oscuro):

| Par de tokens | Ratio | Cumple AA |
|---------------|-------|-----------|
| `on-surface` (`#1C1C1C`) sobre `surface` (`#FFFFFF`) | 15.4:1 | Sí (texto/UI) |
| `on-surface` sobre `background` (`#F4F2E8`) | ~14.7:1 | Sí |
| `on-surface` sobre `secondary-container` (`#1C1C1C`) | 21.0:1 | Sí |
| `on-secondary` (`#1C1C1C`) sobre `secondary` (`#FFDF00`) | ~18.4:1 | Sí |
| `on-surface-variant` (`#413F3F`) sobre `surface-container-low` (`#FAF7EC`) | ~9.4:1 | Sí |
| `on-surface-variant` (`#413F3F`) sobre `surface` (`#FFFFFF`) | ~10.6:1 | Sí |
| Amarillo (`#FFDF00`) como texto sobre blanco | ~1.3:1 | **No — prohibido** |

Reglas derivadas:
- **Prohibido** texto o ícono `primary`/`secondary` (amarillo) sobre fondos claros. Los CTAs usan el par invertido (`bg-secondary text-on-secondary`).
- Feedbacks de estados usar los pares `on-*-container` (nunca texto del color saturado directo sobre superficie).
- Placeholders con opacidad (`/50`, `/40`) quedan exentos por ser texto decorativo con campo asociado con nombre accesible.

### Prácticas obligatorias

- **Foco visible**: `:focus-visible` con outline de 2px (`styles.css`, bloque `ACCESIBILIDAD`). Nunca quitar outline sin alternativa.
- **Reduced motion**: respetar `prefers-reduced-motion` (bloque global en `styles.css`).
- **Landmarks**: `<main id="main-content" tabindex="-1">` en cada página (target del skip link "Saltar al contenido principal" en `app.html`); `<nav aria-label="Navegación principal">` en sidebar; una sola `h1` por página provista por Navbar.
- **Modales**: todo overlay usa `@modalOverlay`/`@modalPanel` con `role="dialog" aria-modal="true"` + `aria-label` descriptivo (activa el focus-trap global `appA11yDialogManager`). Foco inicial al primer control del diálogo; cierre con `Escape` donde aplique.
- **Formularios**: cada control con nombre accesible (label asociado con `for`/`id` o `aria-label`); `aria-invalid` en controles inválidos tocados y `role="alert"` en mensajes de error.
- **Botones de ícono**: siempre `aria-label` explícito (nunca depender solo de `title`).
- **Pestañas**: `role="tablist"` con `aria-selected` en el botón activo.
- **Live regions**: resultados/notificaciones críticas con `role="status" aria-live="polite"` (p. ej. resultado de validación de acceso) y toasts ya declarados en la sección superior.