# 31 Minutos de Terror — Especificación del juego

Documento base para construir el juego con Claude Code en el repo `platanus-hack-26-chile-arcade`.
Objetivo del concurso: **Mejor Juego** (Platanus Hack 26: Arcade Challenge).
Deadline de envío: **miércoles 18 de noviembre de 2026, 23:59 (Santiago, UTC−3)**.

> Nombre de trabajo: "31 Minutos de Terror". Alternativas: "Tulio Te Busca", "Fuera del Aire".
> Homenaje fan no comercial a 31 Minutos. Créditos a Aplaplac en `metadata.json` y pantalla de título.

---

## 0. Reglas del concurso (no negociables)

Estas reglas vienen del `README.md` y `AGENTS.md` del repo. Todo lo demás de este documento se subordina a ellas.

- Todo el juego vive en **`game.js`**. Solo se editan `game.js`, `metadata.json` y `cover.png`.
- **Phaser 3 v3.87.0**, cargado por CDN (no cuenta en el peso).
- **≤ 50 KB después de minificar** (antes de gzip). Validar con `npm run check-restrictions` en cada hito.
- JavaScript puro: sin `import` ni `require`.
- Sin URLs externas (`http://`, `https://`, `//`), salvo `data:` URIs.
- Sin red: nada de `fetch`, `XMLHttpRequest` ni similares.
- **No modificar `CABINET_KEYS`.** Para atajos de prueba locales solo se agregan teclas al final de cada arreglo.
- La lógica usa códigos de arcade (`P1_U`, `P1_1`, `START1`…), nunca teclas crudas.
- Persistencia solo con `window.platanusArcadeStorage` (con fallback a `localStorage`, como el starter). Validar siempre la forma de lo que se lee.
- `metadata.json`: `game_name`, `description`, `player_mode: "two_player"`.
- `cover.png`: exactamente 800×600, PNG, ≤ 500 KB.
- Claude Code **no** ejecuta `npm run dev`; lo corre el usuario.

---

## 1. Concepto

Terminó la grabación del noticiero. Se apagan las luces del set. Tulio no quiere que nadie se vaya.
Bodoque (P1) y Juanín (P2) deben recorrer el set a oscuras y completar tareas para reunir el código de la puerta de salida. En el camino se esconden de Tulio, lo distraen y hablan con otros personajes.

- Género: sigilo cooperativo con horror ligero. Mundo top-down con estética y diálogos al estilo Undertale. Tareas cortas al estilo Among Us.
- **Sin combate.**
- Run de 3 a 5 minutos, formato arcade, rejugable.

### Loop de una run

1. Título → START → intro de 2 líneas.
2. Ambos jugadores exploran el set en pantalla dividida.
3. Completan 4 tareas. Cada una entrega **un dígito** del código de salida.
4. Tulio patrulla, investiga ruidos, persigue y busca.
5. Si atrapa a un jugador, este queda secuestrado. El otro puede rescatarlo.
6. Con los 4 dígitos, ingresan el código en el teclado de la salida y escapan.
7. Pantalla de puntaje → ingreso de iniciales → ranking.

Condiciones de derrota:
- Ambos jugadores atrapados al mismo tiempo.
- El reloj llega a 0:00 y luego Tulio atrapa a ambos (ver §8).

---

## 2. Pantalla y render

- Canvas de 800×600. `Phaser.Scale.FIT` con `CENTER_BOTH`, como el starter.
- `pixelArt: true` y `roundPixels: true` para evitar píxeles borrosos y costuras entre tiles.
- **Pantalla dividida vertical:** dos cámaras de 400×600, cada una sigue a un jugador.
  - Zoom entero de **2×**. Tiles de 16 px: cada vista muestra ~12×18 tiles.
  - Línea divisoria de 2 px en el color de acento.
  - No se fusionan las cámaras cuando los jugadores están juntos.
- **HUD fijo** con `setScrollFactor(0)`, una instancia por cámara o en una cámara UI aparte:
  - Arriba al centro: reloj "AL AIRE EN 4:59".
  - Arriba de cada vista: dígitos obtenidos `[ 7 _ 3 _ ]`.
  - Abajo de cada vista: indicador contextual del botón ("1: ESCONDERSE", "2: RUIDO").
- **Oscuridad:** capa negra semitransparente sobre el mundo con un círculo de luz alrededor de cada jugador (radio ~3 tiles). Tulio lleva una linterna cuyo cono es visible para los jugadores: es parte del horror y de la lectura del juego.
  - Implementación barata: un `RenderTexture` por frame con `erase` de un círculo o gradiente. Si el rendimiento falla, usar una imagen de viñeta fija pegada a la cámara.

---

## 3. Controles

Diseño para joystick + 2 botones, que es lo que pide el README.

| Acción | P1 | P2 |
|---|---|---|
| Moverse | `P1_U/D/L/R` | `P2_U/D/L/R` |
| Interactuar: tarea, escondite, hablar, avanzar diálogo, rescatar | `P1_1` | `P2_1` |
| Usar distracción / salir de una tarea | `P1_2` | `P2_2` |
| Empezar / pausa | `START1` | `START2` |

- Las tareas pueden usar más botones (por ejemplo, Simon con los 6 botones). Cada tarea muestra en pantalla qué botones usa.
- Detectar el borde de pulsación (`justPressed`) además del estado `held`. Agregar un mapa `prev` al `held` del starter.
- Velocidad de los jugadores: 80 px/s. No hay botón de correr.

---

## 4. Mapa

### 4.1 Formato

- Grilla de tiles de 16 px definida como **arreglo de strings**: un carácter por tile.
- Un solo mapa grande con todas las salas, unidas por puertas abiertas (huecos en la pared).
- Tamaño objetivo: **48×36 tiles** (768×576 px de mundo).

Leyenda propuesta:

| Carácter | Significado |
|---|---|
| `#` | Pared |
| `.` | Piso |
| `D` | Puerta o marco (piso transitable, se dibuja distinto) |
| `H` | Escondite |
| `N` | Objeto de distracción |
| `T` | Punto posible de tarea |
| `K` | Teclado de la salida |
| `E` | Puerta de salida (bloqueada hasta ingresar el código) |
| `1` / `2` | Spawn de P1 / P2 |
| `Z` | Spawn de Tulio |
| `p` `m` `c` | NPCs: Policarpo, Mario Hugo, Calcetín con Rombos Man |
| `x` | Muebles y utilería sólidos (mesa, cámaras, focos): decorativos y bloquean |

### 4.2 Salas (6)

1. **Estudio del noticiero** (centro, la más grande). Mesa del noticiero, cámaras y focos. Spawn de los jugadores. 2 puntos de tarea.
2. **Sala de control.** Consolas y monitores. 2 puntos de tarea.
3. **Camarín.** Percheros y espejos. Muchos escondites.
4. **Bodega de utilería.** Cajas, telones y escenografía vieja. Spawn de Tulio. 2 puntos de tarea.
5. **Pasillo.** Conecta casi todo. Pocos escondites y es peligroso.
6. **Salida de emergencia.** Teclado `K` y puerta `E`. Al lado del pasillo.

### 4.3 Layout de referencia

Es un borrador de topología. Claude Code puede ajustar las medidas, pero mantiene las conexiones.

```
+-------------+-------+-------------+
|  BODEGA     D       D  CONTROL    |
|  (Z, T, T)  |PASILLO|  (T, T)     |
+------D------+       +------D------+
|             |       |             |
|  CAMARÍN    D       D  ESTUDIO    |
|  (H H H)    |       |  (1 2 T T)  |
+-------------+---D---+-------------+
              | SALIDA|
              | (K E) |
              +-------+
```

- Total: **8 puntos `T`**. En cada run se sortean 4 (ver §6).
- Cada sala tiene al menos 2 caminos de escape, para que una persecución no sea muerte segura. El pasillo es el cuello de botella.
- Ubicación de NPCs: Policarpo en el estudio, Mario Hugo en la sala de control, Calcetín con Rombos Man en el camarín (a confirmar).

### 4.4 Navegación

- BFS sobre la grilla de tiles para Tulio. Se recalcula al cambiar de objetivo, o cada 0,5 s en persecución. Unas ~30 líneas.
- Colisiones de los jugadores contra tiles sólidos con chequeo AABB manual. No usar Arcade Physics salvo que resulte más corto.

---

## 5. Tulio (IA)

### 5.1 Percepción

- **Cono de visión:** 70° de apertura y 6 tiles de alcance, orientado hacia donde camina.
- **Línea de visión:** raycast por tiles (Bresenham) desde Tulio hasta el jugador. Paredes y `x` la bloquean.
- Un jugador escondido **no** es visible, salvo que Tulio lo haya visto entrar (ver §7).
- **Oído:** recibe eventos de ruido con posición y radio (ver §8).

### 5.2 Estados

| Estado | Velocidad | Comportamiento | Transiciones |
|---|---|---|---|
| **Patrulla** | 55 px/s | Elige una sala al azar con peso: ×2 si hay un jugador o una tarea pendiente. Va a un punto al azar dentro, espera 1–2 s y gira la linterna. | Ve a un jugador → Persecución. Oye un ruido → Investiga. |
| **Investiga** | 70 px/s | Va al punto del ruido y se queda ~3 s mirando a los lados. | Ve a un jugador → Persecución. Termina → Búsqueda. |
| **Persecución** | 92 px/s | Sigue al jugador visto. Guarda su última posición conocida. | Lo toca → Captura. Lo pierde de vista por más de 1,5 s → Búsqueda. Ruido con el objetivo fuera de vista → Investiga. |
| **Búsqueda** | 60 px/s | Revisa la zona de la última posición conocida durante ~5 s. Puede revisar 1 escondite cercano al azar (25%). | Ve a un jugador → Persecución. Pasa el tiempo → Patrulla. |

- Tulio en persecución (92) es **más rápido** que los jugadores (80). Para escapar hay que cortar la línea de visión, esconderse o distraerlo.
- **Escalada:** +5% de velocidad por cada tarea completada.
- **Aviso previo:** pasos audibles con volumen según la distancia, y el cono de la linterna visible desde fuera de la luz del jugador. Así siempre existe la decisión de esconderse.
- Indicador sobre Tulio: `?` en Investiga o Búsqueda, `!` en Persecución.

### 5.3 Captura

- Tulio toca a un jugador que no está escondido → **screamer** en la vista de ese jugador (ver §10.3) → el jugador queda **secuestrado**.
- Al secuestrado se lo lleva a la bodega, a un punto fijo de "cautiverio", y queda inmóvil.
- Tulio vuelve a Patrulla.
- Si ambos quedan secuestrados → derrota.

---

## 6. Tareas (minijuegos)

### 6.1 Reglas generales

- **Pool de 5 tareas.** En cada run salen 4: siempre la cooperativa más 3 de las otras 4, al azar.
- Cada tarea se asigna a uno de los 8 puntos `T`, sin repetir. Se ve como una estación con un brillo suave.
- Se abre con `1` estando al lado. Se abre como un **panel superpuesto dentro de la vista del jugador**; el mundo sigue corriendo detrás.
- **Mientras hace una tarea, el jugador no se mueve y no está escondido.** Esa es la tensión principal.
- Se sale con `2` en cualquier momento. **Salir reinicia la tarea.**
- Duración objetivo: 10–20 s.
- Al completarla: jingle corto, el **dígito** (0–9, sorteado al inicio de la run) aparece grande en el panel y se suma al HUD de ambos.
- Cada tarea tiene un orden fijo en el código (posición 1–4), que se muestra junto al dígito: "ESCENA 2: 7". Ver §11.

### 6.2 Pool

1. **Cables de la sala de control.** 4 cables de colores a la izquierda y 4 a la derecha, en orden al azar.
   - Joystick arriba/abajo para elegir. `1` toma un cable a la izquierda, luego se elige su par a la derecha y `1` conecta.
   - Un error suelta el cable.
2. **Sintonizar la señal.** Una aguja oscila sola. El joystick izquierda/derecha la mantiene en la franja verde.
   - Hay que sumar 3 s dentro de la franja. La franja se mueve despacio.
3. **Consola de efectos (Simon).** 6 pads en la misma disposición física que los botones de la máquina (`1 2 3` arriba, `4 5 6` abajo).
   - Secuencia de 4, luego 5, luego 6 pads. Cada pad tiene su tono.
   - Un error repite la ronda actual.
4. **Calibrar los focos.** Una barra cruza un medidor. Hay que presionar `1` cuando pasa por el centro.
   - Se necesitan 3 aciertos seguidos. Cada acierto la acelera.
5. **Generador (COOPERATIVA, siempre presente).** Dos palancas en la bodega, separadas por ~6 tiles.
   - Ambos jugadores deben estar cada uno en una palanca y alternar `1` en ritmo para llenar una barra.
   - Si uno suelta por más de 1 s, la barra baja.
   - Hace **ruido** al completarse: atrae a Tulio.

> Cada tarea debe caber en ~1,5–2,5 KB minificada. Reutilizar un mismo helper de panel (marco, título, texto de botones, salir).

---

## 7. Escondites

- Tipos, según la sala:
  - Caja de utilería (bodega).
  - Perchero de vestuario (camarín).
  - Bajo la mesa del noticiero (estudio).
  - Tras el telón (bodega y pasillo).
  - Cada tipo es solo un sprite distinto; la lógica es la misma.
- Cantidad: ~10 en todo el mapa. Mínimo 1 por sala, y 3 o más en el camarín. El pasillo tiene 1 como máximo.
- **Entrar:** `1` estando al lado. El sprite del jugador desaparece y su vista se oscurece con una viñeta más cerrada. Se ve un poco hacia afuera ("asomarse").
- **Salir:** `1` de nuevo.
- Máximo 1 jugador por escondite.
- **Seguro** si Tulio no tiene línea de visión al jugador en el momento de entrar.
- **Inseguro** si Tulio lo vio entrar, es decir, si estaba en Persecución con línea de visión. Tulio va al escondite y lo saca: captura.
- En Búsqueda, Tulio puede revisar 1 escondite cercano al azar (25%). Si el jugador está ahí, lo atrapa.
- Mientras Tulio está cerca, el escondido oye un **latido** cuya intensidad depende de la distancia.

---

## 8. Distracciones y ruido

### 8.1 Objetos de distracción `N`

- Hay 1 por sala, salvo en la salida: 5 en total.
- Ejemplos:
  - Radio que se enciende (control).
  - Teléfono que suena (estudio).
  - Foco que se cae (bodega).
  - Secador de pelo (camarín).
  - Extintor que cae (pasillo).
- Se activan con `2` estando al lado, o a 2 tiles como máximo.
- **Un solo uso por run.** El objeto queda apagado o roto.
- Emiten un ruido con **radio de 10 tiles** durante 2 s, y se ve un ícono de onda en el mapa.
- Efecto sobre Tulio:
  - En Patrulla o Búsqueda dentro del radio → pasa a **Investiga** hacia el objeto.
  - En Persecución, si su objetivo está fuera de su vista → pasa a Investiga.
- Cada vez que una distracción saca a Tulio de una persecución suma el bono "Tulio distraído" (§12).

### 8.2 Ruidos involuntarios

- Código incorrecto en el teclado: alarma con radio de 14 tiles.
- Generador completado: radio de 12 tiles.

### 8.3 Reloj en cero

- Cuando el reloj llega a 0:00, Tulio entra en **Persecución permanente** sobre el jugador más cercano. Ignora los escondites salvo que no tenga línea de visión.
- El juego sigue: todavía se puede escapar, pero sin bono de tiempo.

---

## 9. NPCs y diálogo

- 3 NPCs fijos: **Policarpo**, **Mario Hugo** y **Calcetín con Rombos Man**. No se mueven.
- Se habla con `1` estando al lado. Mientras dura el diálogo, el jugador no se mueve y es visible: hablar es un riesgo.
- Cada NPC tiene 1–3 líneas cortas de **máximo ~60 caracteres**. Mezclan:
  - una frase célebre reconocible del programa;
  - una pista útil sobre un escondite, una distracción o una tarea.
- **Las frases célebres las escribe el usuario** en una constante `LINES`. Claude Code deja placeholders claros, por ejemplo `'[FRASE CÉLEBRE POLICARPO]'`. No inventa citas.

### Caja de diálogo estilo Undertale

- La caja aparece en la parte baja de la vista de quien habla, con borde blanco de 2 px y fondo negro.
- Retrato de 16×16 del personaje, escalado ×3, a la izquierda.
- Texto a máquina, ~30 caracteres por segundo, con fuente monospace del sistema.
- **Blip** procedural por cada carácter (no en los espacios), con un tono distinto por personaje.
- `1` completa la línea si todavía se está escribiendo, o pasa a la siguiente si ya terminó.

---

## 10. Arte

### 10.1 Sprites como matrices

- Cada sprite es un arreglo de strings donde cada carácter es un índice de paleta (`.` es transparente).
- En `preload`/`create` se generan texturas con `Graphics.fillRect` + `generateTexture`. Se hace una sola vez y no tiene costo en tiempo de juego.
- Tamaños:
  - Personajes: 16×16.
  - Tiles: 16×16.
  - Retratos: los mismos sprites de personaje.
  - Cara del screamer: 32×32, escalada.
- Paleta global corta (~16 colores) más paletas por personaje de 4 colores como máximo.
- Animación de caminar: 2 frames por dirección. Izquierda = derecha con `flipX`. Arriba y abajo comparten frames si hace falta ahorrar bytes.
- Para evitar glitches gráficos: `pixelArt: true`, `roundPixels`, zoom entero y posiciones de render redondeadas.

### 10.2 Personajes

| Personaje | Rol | Notas visuales |
|---|---|---|
| Juan Carlos Bodoque | P1 | Colores a validar por el usuario. |
| Juanín Juan Harry | P2 | Colores a validar por el usuario. |
| Tulio Triviño | Antagonista | Linterna en la mano. Ojos que brillan en la oscuridad. Colores a validar. |
| Policarpo, Mario Hugo, Calcetín con Rombos Man | NPCs | Colores a validar. |

> Claude Code propone una primera versión de cada sprite. El usuario corrige los colores y rasgos, porque conoce mejor el material.

### 10.3 Screamer

- Cara de Tulio de 32×32 escalada hasta llenar la vista del jugador atrapado, con un zoom-in rápido durante 0,6 s.
- Grito procedural: ruido blanco más un tono que cae.
- **Sin parpadeo estroboscópico.** A lo sumo un solo flash, porque la máquina está en un espacio público.

### 10.4 Cover

- `cover.png` de 800×600 con el título, Tulio con la linterna y Bodoque y Juanín escondidos.
- Opción barata: renderizarlo desde el propio juego con una escena de "cover" y capturar el canvas. También puede hacerse a mano.

---

## 11. Narrativa y código de salida

- **Intro** (2 líneas, en la caja de diálogo):
  - "Terminó el noticiero. Se apagaron las luces."
  - "Tulio cerró el set. Nadie se va hasta que él lo diga."
  - El texto final lo ajusta el usuario.
- **Código:** 4 dígitos sorteados al inicio de la run.
  - Cada tarea entrega el dígito de una posición, presentado como una **claqueta de cine**: "ESCENA 3: 5". Así se refuerza el tema del set.
  - El HUD muestra el código parcial `[ 7 _ 5 _ ]`.
- **Teclado `K`** (formato arcade, como una caja fuerte):
  - Se abre con `1` y muestra 4 ruedas de dígitos.
  - Joystick izquierda/derecha elige la rueda; arriba/abajo cambia el dígito; `1` confirma.
  - Se puede intentar sin tener todos los dígitos (adivinar), pero un **error dispara la alarma** (ruido de 14 tiles, §8.2).
  - Mientras se usa el teclado, el jugador no está escondido.
- **Escape:**
  - Con el código correcto, la puerta `E` se abre.
  - Gana el equipo cuando **ambos** jugadores cruzan la puerta. Si uno está secuestrado, hay que rescatarlo primero, o salir solo con penalización (a confirmar).
- **Rescate:**
  - El jugador libre llega al secuestrado y mantiene `1` durante 3 s.
  - Si Tulio aparece, se interrumpe.
  - Referencia temática del rescate: **la define el usuario** (dejar placeholder de texto).
- **Final:**
  - Victoria: pantalla "¡SALIERON AL AIRE!".
  - Derrota: pantalla "FUERA DEL AIRE".

---

## 12. Tiempo, puntaje y ranking

- **Reloj:** 5:00 de cuenta regresiva, mostrado como "AL AIRE EN m:ss".
- **Puntaje:**

| Concepto | Puntos |
|---|---|
| Tiempo restante | segundos × 10 |
| Tarea completada | +200 |
| Persecución sobrevivida (Persecución → Búsqueda → Patrulla sin captura) | +500 |
| Tulio distraído (una distracción corta una persecución) | +300 |
| Easter egg encontrado | +1000 |
| Rescate exitoso | +500 |
| Escape | +2000 |

- **Ranking:** top 5 en `platanusArcadeStorage`, con la clave `31mdt:scores`.
  - Cada entrada: `{ n: 'ABC', s: 12345 }`.
  - Validar que sea un arreglo y filtrar entradas con forma incorrecta.
- **Iniciales:** 3 letras por equipo. Reutilizar la idea de `LETTER_GRID` del starter actual, pero con joystick arriba/abajo por letra, que es más corto.

---

## 13. Audio (todo procedural, sin archivos)

Un helper `tone(freq, dur, type, vol)` sobre `this.sound.context` cubre casi todo.

| Sonido | Descripción |
|---|---|
| Blip de diálogo | Onda cuadrada de 30 ms; el tono cambia por personaje. |
| Pasos de Tulio | Golpe grave cada 0,4 s. El volumen depende de la distancia al jugador más cercano. |
| Latido | Dos golpes graves. Se acelera con la cercanía de Tulio. Se oye al estar escondido o en peligro. |
| Screamer | Ruido blanco más un tono descendente, 0,6 s. |
| Tareas | Clic al seleccionar, tono por pad en el Simon, jingle al completar. |
| Alarma | Dos tonos alternados, 1,5 s. |
| Distracción | Un sonido característico por objeto: timbre de teléfono, estática de radio, golpe. |
| **Música** | Loop chiptune **original**, lento y tenso, en tonalidad menor, de ~8 compases, con un secuenciador de notas en un arreglo. Sube de tempo en Persecución. |
| Título (opcional) | Melodía de una canción de 31 Minutos en 8 bits y ralentizada. **Solo si el usuario entrega las notas.** Si no, se usa el loop original. |

- El volumen general se mantiene moderado, porque la máquina está en un espacio público.

---

## 14. Easter eggs e interludio

- **2–3 easter eggs**: objetos o diálogos secretos en el mapa. Ideas, que el usuario confirma:
  - un objeto icónico escondido en la bodega;
  - interactuar 3 veces con la mesa del noticiero;
  - un rincón oscuro del pasillo.
- Cada uno suma +1000.
- **Interludio:** se desbloquea al encontrar todos los easter eggs en una misma run. Es una escena corta (15–20 s), casi sin input, al estilo de los minijuegos retro entre noches: un flashback de por qué Tulio está así.
  - **Prioridad más baja de todo el documento.** Se hace solo si el resto está listo y queda presupuesto de peso.

---

## 15. Presupuesto de peso (minificado)

| Módulo | KB objetivo |
|---|---|
| Input, escenas y helpers | 3 |
| Mapa (strings) y colisiones | 4 |
| Sprites (matrices) y generación de texturas | 6 |
| Tulio: IA, BFS y raycast | 4 |
| Tareas (5) y helper de panel | 10 |
| Diálogo y NPCs | 3 |
| Audio y música | 5 |
| HUD, oscuridad y split screen | 3 |
| Título, puntajes, iniciales y ranking | 4 |
| Easter eggs e interludio | 3 |
| **Total** | **~45 de 50** |

- Correr `npm run check-restrictions` al terminar cada hito.
- Si se pasa del objetivo, se recorta en este orden:
  1. Interludio.
  2. La quinta tarea (quedan 4 fijas).
  3. Animaciones arriba/abajo.
  4. Música por estados (queda un solo loop).

---

## 16. Estructura sugerida de `game.js`

```
// constantes: W, H, TILE, CABINET_KEYS (intacto), paletas
// input: held + prev + justPressed(code)
// storage: getStorage/loadData/saveData (del starter)
// audio: tone(), noise(), music sequencer
// sprites: SPR = { bodoque: [...], ... } + makeTextures(scene)
// mapa: MAP = [...] + parseMap() → tiles, puntos T/H/N/K/E/spawns
// escenas: Title → Play → Result (Phaser scenes en un solo archivo)
// Play: players, tulio (state machine), hides, noises, tasks, npcs, hud, cams
// tasks: TASKS = { wires, tune, simon, lights, generator } con API común
//        { open(p), update(p, dt), close(p) } → onDone(digitIndex)
// dialog: showDialog(cam, portrait, lines, pitch)
```

- Un solo archivo, con secciones separadas por comentarios.
- Nombres cortos pero legibles: el minificador hace el resto.
- **Arrancar desde cero.** No extender el brick breaker actual del template: ya ocupa ~49,6 KB sin minificar.

---

## 17. Plan por hitos (15 → 18 de noviembre)

| Hito | Contenido | Cuándo |
|---|---|---|
| **H1 Base jugable** | Mapa, colisiones, split screen, 2 jugadores moviéndose, oscuridad, sprites provisorios | 15–16 nov |
| **H2 Tulio** | 4 estados, cono, raycast, BFS, captura y screamer, escondites, distracciones | 16 nov |
| **H3 Tareas y salida** | Las 5 tareas, dígitos, teclado, puerta, rescate, victoria y derrota | 17 nov |
| **H4 Capa de juego** | NPCs y diálogo, audio y música, puntaje, ranking, título | 17 nov |
| **H5 Pulido** | Balance de velocidades y tiempos, sprites finales, cover, `metadata.json`, check de peso | 18 nov (mañana) |
| **H6 Opcional** | Easter eggs e interludio | Solo si sobra tiempo |
| **Envío** | Submit desde la UI de desarrollo | **18 nov, antes de las 20:00** (deja 4 h de margen) |

---

## 18. Pendientes del usuario

- [ ] Nombre final del juego.
- [ ] Frases célebres de Policarpo, Mario Hugo y Calcetín con Rombos Man, más su pista útil.
- [ ] Referencia temática del rescate.
- [ ] Colores y rasgos de cada personaje para los sprites.
- [ ] Notas de la canción para el título (opcional).
- [ ] Ideas concretas de los easter eggs.
- [ ] ¿Se puede escapar solo dejando al otro secuestrado? Propuesta: sí, con −2000 puntos.

## 19. Criterios de aceptación

- `npm run check-restrictions` pasa: ≤ 50 KB y sin violaciones.
- `CABINET_KEYS` está intacto.
- Una run completa (título → escape → iniciales → ranking) se juega solo con los controles de arcade.
- Una run se gana en 3–5 minutos con buena coordinación.
- Tulio atrapa a jugadores descuidados, pero siempre hay aviso (pasos o linterna) antes de verlo.
- No hay errores en consola ni glitches visuales al hacer zoom o mover las cámaras.
- `metadata.json` y `cover.png` cumplen el formato.
