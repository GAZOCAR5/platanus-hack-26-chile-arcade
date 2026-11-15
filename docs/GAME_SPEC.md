# Terremoto — Especificación

Juego arcade para Platanus Hack 26 (Santiago). Phaser 3.87, todo en `game.js`, ≤ 50 KB minificado.
Envío: 18 nov 2026, antes de las 20:00.

## Reglas del concurso
- Solo se editan `game.js`, `metadata.json`, `cover.png`.
- Sin imports, sin URLs externas, sin red. `CABINET_KEYS` intacto (solo se agregan teclas al final).
- Lógica con códigos arcade (`P1_U`, `P1_1`, `START1`…). Persistencia con `platanusArcadeStorage`.

## Concepto
Santiago. Llega la alerta del teléfono: viene un megaterremoto. Tienes **60 s** para saquear un edificio
enorme y bajar loot y familia al **bunker (-3)**. El terremoto llega a "???" en la escala de Richter,
la Tierra se parte y empieza el apocalipsis. Luego un **logbook** de días: sobrevives según lo que sacaste,
con decisiones de 3 opciones y mucha suerte.

- 1 o 2 jugadores co-op. 2P solo en el saqueo (pantalla dividida). El logbook es pantalla conjunta.
- Tono: tensión + humor chileno, centrado en decisiones.

## Fase 1: Saqueo (60 s)
- Vista **top-down**. HUD a la derecha: **mini-edificio en corte lateral** (pisos, un punto por jugador, bunker, PH).
- Edificio: bunker `-3`, pisos `1–12`, penthouse `PH`. Escalera a la izquierda de cada piso; subir/bajar = un tramo.
- Cada piso: pasillo central y deptos arriba y abajo, generados al azar. Cada depto tiene un **tema** que sesga su loot.
- El PH es una mansión: piscina, más easter eggs.
- Mientras más alto, mejor loot y más lejos. La casa **no se alcanza a recorrer**: el greed es la mecánica.
- Mochila de **6 espacios** por jugador. Más peso = más lento. Al llegar al bunker la mochila se vacía sola.
- Botón 1: tomar. Botón 2: soltar el último objeto.
- Al llegar a 0, quien no esté en el bunker muere y pierde su mochila.
- 2P: cada jugador es una boca más. Mismo loot que en 1P. Ranking separado 1P/2P.
- Últimos 20 s: temblores de aviso y notificaciones push con pánico.

## Fase 2: Cinemática
Pantalla negra. Número blanco grande: 6.0, 6.1 … 7.5 … 9.8, 10.0 … **???**, con shake y rumble crecientes.
Tierra caricaturesca partida en dos. "COMIENZA EL APOCALIPSIS". En 2P la pantalla se junta.

## Fase 3: Logbook
- Recursos contables: **agua** y **comida** en raciones. Cada persona consume 1 de cada una por día.
- Cada persona: sana / herida / enferma / muerta. 3 días sin agua o 6 sin comida → muere.
- Días normales: texto automático (~1,5 s por día).
- Cada 2–4 días al azar: evento con hasta 3 opciones (joystick + Botón 1). Las opciones dependen del loot.
  Probabilidades ocultas; el objeto que ayuda aparece como opción ("Salir con la linterna").
- Probabilidades cambian con el tiempo: réplicas decaen (Omori), saqueos suben días 2–5, enfermedad sube sin botiquín.
- Desde el día 20: 10 % diario de **evento final** (decisión). Éxito = ending con bonus. Fracaso = mueres o sigues sin bonus.
- Puntaje: días × 100 + easter eggs + vivos + bonus de ending.
- Resumen final: "te habría salvado: …".
- Presupuesto de texto: ~30 eventos + 4 endings (~12 KB).

## Recursos y objetos

Espacios entre paréntesis. Efectos finos se ajustan en la etapa 3.

**Agua**
- Bidón de 5 L (3) · Botella de agua (1) · Bebida de 3 L (2)

**Comida**
- Lata de atún (1) · Porotos en tarro (1, necesita abrelatas) · Tallarines (1, necesita agua y gas)
- Marraquetas (1, se ponen duras al día 3) · Charqui (1) · Tarro de manjar (1, + ánimo) · Sopaipillas frías (1)

**Herramientas**
- Linterna (1, necesita pilas) · Pilas (1) · Radio a pilas (2) · Botiquín (2) · Encendedor (1)
- Abrelatas (1) · Cortaplumas (1) · Cinta americana (1) · Frazada (2) · Mapa de Santiago (1)
- Balón de gas (4) · Mascarilla (1) · Uslero de la abuela (1, defensa) · Naipe para carioca (1, ánimo)
- Guitarra (3, ánimo) · Pisco (1, ánimo o desinfectante)

**Combos**: linterna+pilas, radio+pilas, porotos+abrelatas, tallarines+gas+agua, botiquín+pisco.

**Personas**
- La abuela (4) · Quiltro (2) · Gato (1) · Vecina copuchenta (3)
- La abuela y el quiltro parten en el depto de la familia (piso 3).

## Easter eggs (puntos; a veces sirven)
| Objeto | Esp. | Uso en el logbook |
|---|---|---|
| Gaviota del Festival | 2 | Se cambia por comida con saqueadores |
| Peluca de Leo Rey | 1 | Te haces pasar por él: el campamento te regala cosas |
| Terremoto (el trago) | 1 | Ánimo enorme, pero pierdes un día por la caña |
| Volantín con hilo curado | 2 | Señal para el helicóptero (ending) |
| Tarjeta Bip con saldo | 1 | Nada. "La micro no pasa más" |
| Billete de 20 lucas | 1 | Soborno que nadie acepta |
| Moai de souvenir | 3 | Solo puntos (pesa) |
| Completo a medio comer | 1 | +1 comida, 50 % intoxicación |
| Polera "Yo sobreviví al 27F" | 1 | Ánimo |
| Sombrero de huaso | 1 | Evento con un caballo |
| Cartón de lotería premiado | 1 | Nada, pero dolor máximo |
| Pañuelo de cueca | 1 | Ánimo en el evento del 18 |
| Réplica de la Copa América | 2 | Puntos y ánimo |

Probabilidad de egg por depto sube con el piso. El PH trae 3 garantizados.

## Temas de depto
Abuelita · Gamer · Conserje · Estudiante · Doctora · Tío del asado · Airbnb vacío · Hippie · Deportista.

## Etapas
| Etapa | Contenido | Estado |
|---|---|---|
| **E1 Saqueo** | Layouts generados, movimiento top-down con colisiones, escaleras, HUD lateral, objetos placeholder, mochila, bunker, timer, 1P/2P con pantalla dividida, pantalla de resultado | En curso |
| **E2 Alerta y cinemática** | Alerta del teléfono, notificaciones push, temblores de aviso, cinemática Richter → ??? → Tierra partida | |
| **E3 Logbook** | Raciones, estados, días, eventos, endings, resumen "te habría salvado" | |
| **E4 Arcade** | Título, puntaje, iniciales, ranking 1P/2P | |
| **E5 Arte y audio** | Muebles, personajes, iconos, sonido procedural | |
| **E6 Pulido** | Balance, cover, metadata, peso | |
