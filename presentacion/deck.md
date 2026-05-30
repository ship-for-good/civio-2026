---
marp: true
paginate: true
backgroundColor: #0b1220
color: #e6edf6
style: |
  :root {
    --teal: #34d8c8;
    --teal-soft: #7af0e4;
    --slate: #93a4bd;
    --red: #ff6b6b;
    --amber: #ffd166;
    --green: #7ee787;
  }
  section {
    font-family: -apple-system, "Segoe UI", Inter, Helvetica, sans-serif;
    font-size: 30px;
    padding: 60px 70px;
    background:
      radial-gradient(1200px 500px at 85% -10%, rgba(52,216,200,.12), transparent 60%),
      #0b1220;
  }
  h1 { color: #fff; font-size: 62px; line-height: 1.05; margin: 0 0 .2em; }
  h2 { color: var(--teal); font-size: 40px; margin: 0 0 .4em; }
  h3 { color: var(--teal-soft); font-size: 30px; margin: 0 0 .3em; }
  strong { color: var(--teal-soft); }
  a { color: var(--teal); }
  ul { line-height: 1.5; }
  li::marker { color: var(--teal); }
  .lead { font-size: 34px; color: #cdd9ea; }
  .joke {
    margin-top: 28px; color: var(--slate); font-style: italic;
    border-left: 4px solid var(--teal); padding-left: 16px; font-size: 26px;
  }
  .big { font-size: 46px; color:#fff; font-weight: 700; line-height: 1.15; }
  .flow { display:flex; gap:18px; justify-content:space-between; margin-top:36px; }
  .flow .step {
    flex:1; text-align:center; background:rgba(52,216,200,.07);
    border:1px solid rgba(52,216,200,.25); border-radius:16px; padding:22px 10px;
  }
  .flow .step b { display:block; font-size:42px; margin-bottom:8px; }
  .flow .step span { font-size:22px; color:#cdd9ea; }
  .pills { display:flex; gap:14px; flex-wrap:wrap; margin-top:26px; }
  .pill { background:rgba(52,216,200,.10); border:1px solid rgba(52,216,200,.3);
    border-radius:999px; padding:10px 20px; font-size:24px; color:#d7e6f5; }
  footer { color: var(--slate); }
  section::after { color: var(--slate); }
  section.center { display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; }
  .center-pills { justify-content:center; }
  .r{ color:var(--red); font-weight:700; }
  .a{ color:var(--amber); font-weight:700; }
  .g{ color:var(--green); font-weight:700; }
  .hero { background:radial-gradient(circle at 50% 35%, #18324a, #0e1b2c);
    border:1px solid rgba(52,216,200,.35); border-radius:32px; padding:22px; display:inline-block;
    box-shadow:0 10px 50px rgba(52,216,200,.25); margin-bottom:14px; }
  .hero img { display:block; width:300px; }
  .kpi { font-size:64px; color:#fff; font-weight:800; }
  .muted { color: var(--slate); font-size:24px; }
---

<!-- _paginate: false -->
<!-- _class: center -->

<div class="hero"><img src="mascota-icon.png" alt="SQLete"></div>

# SQLete

<p class="lead">El derecho de acceso a la información, <strong>sin que se te escape un plazo</strong>.</p>

<p class="muted">Reto OPP-2 · Civio · Hackathon Software Crafters</p>

<!--
0:00–0:10 · Portada.
"Somos SQLete. Convertimos el caos de las solicitudes de transparencia en plazos que no se escapan."
-->

---

## El trabajo de detective

Hoy, un periodista de Civio para **cada** notificación tiene que:

- Entrar al portal **con certificado digital**
- Descargar el PDF y abrirlo… **solo para saber qué es**
- Calcular a mano los plazos legales
- Repetirlo por **decenas de expedientes en paralelo**

Y si se le pasa un plazo → **derecho perdido.**

<p class="joke">Spoiler: el certificado digital siempre caduca el día que lo necesitas.</p>

<!--
0:10–0:40 (30s) · El dolor.
Es un email opaco; entras con certificado, bajas el PDF y lo abres solo para saber qué es. Por decenas de expedientes. Un plazo que se pasa = derecho perdido.
-->

---

## ¿Qué hace SQLete?

<p class="big">Arrastras el PDF de una notificación → la app lo interpreta sola, calcula todos los plazos legales y te avisa de lo que vence.</p>

<div class="flow">
  <div class="step"><b>📄</b><span>Sueltas el PDF</span></div>
  <div class="step"><b>👽</b><span>IA clasifica + extrae</span></div>
  <div class="step"><b>📅</b><span>Calcula plazos</span></div>
  <div class="step"><b>📊</b><span>Dashboard</span></div>
  <div class="step"><b>🔔</b><span>Te avisa</span></div>
</div>

<p class="joke">Sin OCR, sin pócimas, sin sacrificar a un becario.</p>

<!--
0:40–0:55 · Qué es, en una frase. El "upgrade" de la Airtable que Civio ya usa.
-->

---

## Demo · arrastra y suelta

<p class="lead">Suelto un PDF <strong>real del Consejo de Transparencia</strong>…</p>

SQLete responde, en segundos:

- **Tipo:** resolución parcial
- **Organismo:** Ministerio X
- **Fecha de inicio de tramitación:** la saca del propio documento
- Salida **estructurada** → no se inventa campos; si duda, lo marca para revisión

<p class="joke">Tarda menos en leerlo que tú en encontrar dónde se descargaba.</p>

<!--
0:55–1:35 · DEMO (en vivo si va fino; captura si no). 35+ PDFs reales del CTBG cargados.
-->

---

## El motor de plazos

En cuanto entra la notificación, SQLete calcula **solo**:

- **Silencio negativo (art. 20.4)** → si vence sin respuesta, se entiende denegado
- **Prórroga del art. 20.1** (volumen) → 1 mes ➜ 2 meses
- **Ventana de reclamación al CTBG** → cuántos días te quedan

Dashboard con **semáforo**: <span class="r">rojo vence ya</span> · <span class="a">ámbar pronto</span> · <span class="g">verde en plazo</span>.

<p class="joke">El silencio administrativo es negativo. El nuestro, al menos, te avisa.</p>

<!--
1:35–2:15 · Dashboard + plazos. Reemplaza su Airtable manual. Tests con las fechas reales del CSV de Civio.
-->

---

## Redistribución · lo que ningún Airtable hace

<p class="big">Detectamos cuando <strong>1 solicitud se multiplica en 22 expedientes</strong>, uno por ministerio…</p>

…y los **agrupamos** con los plazos de cada hijo. Se acabó el trabajo de detective cruzando referencias a mano.

<p class="muted">Determinista: parseamos el campo "Notas" del propio CSV de Civio.</p>

<p class="joke">Una solicitud, 22 ministerios. La Administración multiplicándose como gremlins.</p>

<!--
2:15–2:45 · Feature distintivo. parent_id por parseo de Notas (datos reales).
-->

---

<!-- _class: center -->

## Impacto

<div class="pills center-pills">
  <span class="pill">Sustituye su Airtable manual</span>
  <span class="pill">Elimina el trabajo de detective</span>
  <span class="pill">No se escapa un plazo</span>
</div>

<br>

<p class="lead"><strong>Open source (MIT)</strong> · Phoenix LiveView + PostgreSQL · reutilizable por Civio</p>

<p class="big">Que el trabajo de detective lo haga el alien.<br>Tú, a hacer periodismo.</p>

<!--
2:45–3:00 · Cierre. NO decir "Somos SQLete". Rematar con el chascarillo y dejar el dashboard en pantalla.
-->
