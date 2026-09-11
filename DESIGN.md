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