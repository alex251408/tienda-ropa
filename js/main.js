/* =========================================================
   MODA FASHION — js/main.js
   Funciones generales del sitio.
   Por ahora: carrusel del banner principal (#heroCarousel).
   ========================================================= */

(function () {
  "use strict";

  /* ---------------------------------------------------------
     CARRUSEL DEL BANNER
     - Se desliza con el dedo o el trackpad (scroll-snap en CSS).
     - Avanza solo cada INTERVALO ms y vuelve al inicio al llegar al final.
     - Se detiene mientras la persona lo toca, pasa el mouse o navega
       con el teclado, y cuando la pestaña no está visible.
     - No avanza solo si la persona pidió menos movimiento en su sistema.
     --------------------------------------------------------- */
  function iniciarCarrusel() {
    const carrusel = document.getElementById("heroCarousel");
    const pista = document.getElementById("heroTrack");
    if (!carrusel || !pista) return;

    const INTERVALO = 5000;
    const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const botonAnterior = carrusel.querySelector(".hero-prev");
    const botonSiguiente = carrusel.querySelector(".hero-next");
    const contenedorPuntos = carrusel.querySelector(".hero-dots");

    let temporizador = null;
    let pausado = false;
    let indiceActual = 0;

    const diapositivas = function () {
      return Array.from(pista.querySelectorAll(".hero-slide"));
    };

    /** Ir a la diapositiva número i (con vuelta al inicio / al final). */
    function irA(i) {
      const total = diapositivas().length;
      if (total === 0) return;
      const destino = (i + total) % total;
      pista.scrollTo({
        left: destino * pista.clientWidth,
        behavior: reducirMovimiento ? "auto" : "smooth"
      });
    }

    function marcarPunto(i) {
      indiceActual = i;
      if (!contenedorPuntos) return;
      contenedorPuntos.querySelectorAll(".hero-dot").forEach(function (punto, n) {
        punto.setAttribute("aria-current", n === i ? "true" : "false");
      });
    }

    /** Crea los puntos y muestra flechas solo si hay más de una diapositiva. */
    function construirControles() {
      const total = diapositivas().length;
      const hayVarias = total > 1;

      if (contenedorPuntos) {
        contenedorPuntos.innerHTML = "";
        for (let n = 0; n < total; n++) {
          const punto = document.createElement("button");
          punto.type = "button";
          punto.className = "hero-dot";
          punto.setAttribute("aria-label", "Ir a la imagen " + (n + 1) + " de " + total);
          punto.addEventListener("click", function () { irA(n); reiniciarAutomatico(); });
          contenedorPuntos.appendChild(punto);
        }
        contenedorPuntos.hidden = !hayVarias;
      }
      if (botonAnterior) botonAnterior.hidden = !hayVarias;
      if (botonSiguiente) botonSiguiente.hidden = !hayVarias;

      marcarPunto(Math.min(indiceActual, total - 1));
      if (hayVarias) iniciarAutomatico(); else detenerAutomatico();
    }

    /* ----- Avance automático ----- */
    function iniciarAutomatico() {
      detenerAutomatico();
      if (reducirMovimiento || pausado || diapositivas().length < 2) return;
      temporizador = setInterval(function () { irA(indiceActual + 1); }, INTERVALO);
    }
    function detenerAutomatico() {
      if (temporizador) { clearInterval(temporizador); temporizador = null; }
    }
    function reiniciarAutomatico() { iniciarAutomatico(); }

    function pausar() { pausado = true; detenerAutomatico(); }
    function reanudar() { pausado = false; iniciarAutomatico(); }

    /* ----- Qué diapositiva se ve (al deslizar a mano o automático) ----- */
    let esperandoFrame = false;
    pista.addEventListener("scroll", function () {
      if (esperandoFrame) return;
      esperandoFrame = true;
      requestAnimationFrame(function () {
        esperandoFrame = false;
        const ancho = pista.clientWidth || 1;
        marcarPunto(Math.round(pista.scrollLeft / ancho));
      });
    }, { passive: true });

    /* ----- Flechas ----- */
    if (botonAnterior) botonAnterior.addEventListener("click", function () { irA(indiceActual - 1); reiniciarAutomatico(); });
    if (botonSiguiente) botonSiguiente.addEventListener("click", function () { irA(indiceActual + 1); reiniciarAutomatico(); });

    /* ----- Pausas ----- */
    // Solo un mouse real pausa al pasar por encima (un toque en celular también
    // simula "mouse encima" y dejaría el carrusel pausado para siempre)
    carrusel.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") pausar(); });
    carrusel.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") reanudar(); });
    carrusel.addEventListener("focusin", pausar);
    carrusel.addEventListener("focusout", reanudar);
    // Al tocar con el dedo se pausa; al soltar se reanuda con calma
    carrusel.addEventListener("touchstart", pausar, { passive: true });
    carrusel.addEventListener("touchend", function () { setTimeout(reanudar, 2500); }, { passive: true });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) detenerAutomatico(); else if (!pausado) iniciarAutomatico();
    });

    /* ----- Si cambia el ancho de la pantalla, mantener la imagen actual ----- */
    window.addEventListener("resize", function () {
      pista.scrollTo({ left: indiceActual * pista.clientWidth, behavior: "auto" });
    });

    /* ----- Imágenes que faltan -----
       1) Si falta la versión de celular, se usa la de computadora.
       2) Si falta también la de computadora, la diapositiva se quita. ----- */
    function alFallarImagen(img) {
      const picture = img.closest("picture");
      const fuente = picture && picture.querySelector("source");
      if (fuente) { fuente.remove(); return; }   // el navegador vuelve a intentar con img/src
      const diapositiva = img.closest(".hero-slide");
      if (diapositiva) diapositiva.remove();
    }
    // Los errores de imagen no "suben" por el HTML, por eso se escucha en captura
    pista.addEventListener("error", function (e) {
      if (e.target && e.target.tagName === "IMG" && e.target.closest(".hero-slide-img")) {
        alFallarImagen(e.target);
      }
    }, true);
    // Por si alguna ya falló antes de que este código arrancara
    pista.querySelectorAll(".hero-slide-img img").forEach(function (img) {
      if (img.complete && img.naturalWidth === 0) alFallarImagen(img);
    });

    /* ----- Fondo difuminado: rellena el espacio cuando la imagen no tiene la
           misma proporción que el banner (así la imagen siempre se ve completa) ----- */
    function ponerFondo(img) {
      const diapositiva = img.closest(".hero-slide-img");
      const origen = img.currentSrc || img.src;
      if (diapositiva && origen) diapositiva.style.setProperty("--fondo", 'url("' + origen + '")');
    }
    pista.addEventListener("load", function (e) {
      if (e.target && e.target.tagName === "IMG" && e.target.closest(".hero-slide-img")) ponerFondo(e.target);
    }, true);
    pista.querySelectorAll(".hero-slide-img img").forEach(function (img) {
      if (img.complete && img.naturalWidth > 0) ponerFondo(img);
    });

    // Cuando se quita una diapositiva, se reconstruyen los puntos
    new MutationObserver(construirControles).observe(pista, { childList: true });

    construirControles();
  }

  document.addEventListener("DOMContentLoaded", iniciarCarrusel);
})();


/* =========================================================
   CARRITO (guardado en el navegador del cliente)
   - window.Carrito.agregar(item, maximo) suma un producto.
   - El número rojo sobre el icono 🛒 muestra cuántas prendas lleva.
   ========================================================= */
(function () {
  "use strict";

  const CLAVE = "carrito_matteo_salvatore";

  function leer() {
    try {
      const datos = JSON.parse(localStorage.getItem(CLAVE) || "[]");
      return Array.isArray(datos) ? datos : [];
    } catch (e) { return []; }
  }
  function guardar(lista) {
    try { localStorage.setItem(CLAVE, JSON.stringify(lista)); } catch (e) {}
  }
  function total() {
    return leer().reduce(function (s, i) { return s + (Number(i.cantidad) || 0); }, 0);
  }

  /** Suma 1 unidad. Devuelve false si ya llegó al máximo disponible. */
  function agregar(item, maximo) {
    const lista = leer();
    const existente = lista.find(function (i) {
      return i.id === item.id && i.color === item.color && i.talla === item.talla;
    });
    const actual = existente ? existente.cantidad : 0;
    if (maximo && actual >= maximo) return false;
    if (existente) existente.cantidad += 1;
    else lista.push(Object.assign({}, item, { cantidad: 1 }));
    guardar(lista);
    actualizarContador();
    return true;
  }

  function actualizarContador() {
    const n = total();
    document.querySelectorAll('a[aria-label="Carrito de compras"]').forEach(function (enlace) {
      let marca = enlace.querySelector(".cart-count");
      if (!marca) {
        marca = document.createElement("span");
        marca.className = "cart-count";
        enlace.appendChild(marca);
      }
      marca.textContent = n > 99 ? "99+" : String(n);
      marca.hidden = n === 0;
    });
  }

  function aviso(texto) {
    let caja = document.getElementById("avisoCarrito");
    if (!caja) {
      caja = document.createElement("div");
      caja.id = "avisoCarrito";
      caja.setAttribute("role", "status");
      document.body.appendChild(caja);
    }
    caja.textContent = texto;
    caja.classList.add("is-visible");
    clearTimeout(aviso._t);
    aviso._t = setTimeout(function () { caja.classList.remove("is-visible"); }, 2200);
  }

  function inyectarEstilos() {
    const css = document.createElement("style");
    css.textContent =
      "a[aria-label='Carrito de compras']{position:relative}" +
      ".cart-count{position:absolute;top:-4px;right:-6px;min-width:18px;height:18px;padding:0 4px;" +
      "border-radius:9px;background:#D6553B;color:#fff;font-size:11px;font-weight:700;line-height:18px;text-align:center}" +
      ".cart-count[hidden]{display:none}" +
      "#avisoCarrito{position:fixed;left:50%;bottom:90px;transform:translate(-50%,20px);z-index:300;" +
      "background:#3B1E42;color:#fff;padding:.75rem 1.2rem;border-radius:999px;font-size:.9rem;font-weight:600;" +
      "box-shadow:0 8px 24px rgba(0,0,0,.25);opacity:0;pointer-events:none;transition:opacity .25s,transform .25s;max-width:90vw;text-align:center}" +
      "#avisoCarrito.is-visible{opacity:1;transform:translate(-50%,0)}";
    document.head.appendChild(css);
  }

  window.Carrito = { leer: leer, total: total, agregar: agregar, aviso: aviso };

  document.addEventListener("DOMContentLoaded", function () {
    inyectarEstilos();
    actualizarContador();
  });
})();


/* =========================================================
   INVENTARIO DESDE EXCEL (CSV)
   Si existe data/inventario/<ID-DEL-PRODUCTO>.csv, el stock por color y
   talla se lee de ahí y reemplaza al "stockPorColor" del JSON.
   Columnas que reconoce (por el título): COLOR, TALLA y
   STOCK DISPONIBLE (si no existe, usa STOCK).
   ========================================================= */
(function () {
  "use strict";

  function norm(t) {
    return String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
  }

  /** Lee CSV con comillas, saltos de línea dentro de celdas y separador , ; o tabulación. */
  function leerCsv(texto) {
    texto = texto.replace(/^\uFEFF/, "");
    const primera = texto.split(/\r?\n/)[0] || "";
    const cuenta = function (c) { return primera.split(c).length - 1; };
    const sep = cuenta(";") > cuenta(",") && cuenta(";") >= cuenta("\t") ? ";" : (cuenta("\t") > cuenta(",") ? "\t" : ",");
    const filas = []; let fila = [], celda = "", enComillas = false;
    for (let i = 0; i < texto.length; i++) {
      const c = texto[i];
      if (enComillas) {
        if (c === '"' && texto[i + 1] === '"') { celda += '"'; i++; }
        else if (c === '"') enComillas = false;
        else celda += c;
      } else if (c === '"') enComillas = true;
      else if (c === sep) { fila.push(celda); celda = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && texto[i + 1] === "\n") i++;
        fila.push(celda); celda = ""; filas.push(fila); fila = [];
      } else celda += c;
    }
    if (celda !== "" || fila.length) { fila.push(celda); filas.push(fila); }
    return filas;
  }

  function aStock(csv) {
    const filas = leerCsv(csv).filter(function (f) { return f.some(function (c) { return c.trim() !== ""; }); });
    if (filas.length < 2) return null;
    const cab = filas[0].map(norm);
    const iColor = cab.findIndex(function (h) { return h.indexOf("color") === 0; });
    const iTalla = cab.findIndex(function (h) { return h.indexOf("talla") === 0; });
    let iStock = cab.findIndex(function (h) { return h.indexOf("disponible") !== -1; });
    if (iStock < 0) iStock = cab.findIndex(function (h) { return h === "stock"; });
    if (iColor < 0 || iTalla < 0 || iStock < 0) return null;

    const res = {};
    filas.slice(1).forEach(function (f) {
      const color = (f[iColor] || "").trim();
      const talla = (f[iTalla] || "").trim().toUpperCase();
      const valor = (f[iStock] || "").trim();
      if (!color || !talla || valor === "") return;   // filas repetidas sin dato no suman
      if (!res[color]) res[color] = {};
      res[color][talla] = Math.max(0, Number(valor.replace(",", ".")) || 0);  // el mismo dato repetido no se suma
    });
    return Object.keys(res).length ? res : null;
  }

  /** Inventario general: columnas NOMBRE (producto + color + talla), TALLA y STOCK. */
  function aStockGeneral(csv, prefijo) {
    const filas = leerCsv(csv).filter(function (f) { return f.some(function (c) { return c.trim() !== ""; }); });
    if (filas.length < 2) return null;
    const cab = filas[0].map(norm);
    const iNombre = cab.findIndex(function (h) { return h.indexOf("nombre") === 0; });
    const iTalla = cab.findIndex(function (h) { return h.indexOf("talla") === 0; });
    let iStock = cab.findIndex(function (h) { return h.indexOf("disponible") !== -1; });
    if (iStock < 0) iStock = cab.findIndex(function (h) { return h === "stock"; });
    if (iNombre < 0 || iTalla < 0 || iStock < 0) return null;

    const pre = norm(prefijo);
    const res = {};
    filas.slice(1).forEach(function (f) {
      const nombre = norm(f[iNombre]);
      const talla = (f[iTalla] || "").trim().toUpperCase();
      const valor = (f[iStock] || "").trim();
      if (!talla || valor === "" || nombre.indexOf(pre) !== 0) return;
      let resto = nombre.slice(pre.length);
      if (resto && resto.charAt(0) !== " " && resto.charAt(0) !== "-") return;  // otro producto con nombre parecido
      resto = resto.replace(/^[\s-]+/, "");
      const t = norm(talla).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      resto = resto.replace(new RegExp("\\s*(talla\\s*)?" + t + "$"), "").replace(/[\s-]+$/, "").trim();
      if (!resto) return;
      const color = resto.charAt(0).toUpperCase() + resto.slice(1);
      if (!res[color]) res[color] = {};
      res[color][talla] = Math.max(0, Number(valor.replace(",", ".")) || 0);  // dato repetido: no se suma
    });
    return Object.keys(res).length ? res : null;
  }

  async function leerArchivo(ruta) {
    try {
      const r = await fetch(ruta, { cache: "no-store" });
      if (!r.ok) return null;
      const bytes = await r.arrayBuffer();
      try { return new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
      catch (e) { return new TextDecoder("windows-1252").decode(bytes); }
    } catch (e) { return null; }
  }

  let inventarioGeneral = null;   // se descarga una sola vez por página

  /**
   * Recibe el producto del JSON.
   * 1) Si tiene "inventario": "POLO PIMA BASICO", busca esas filas en data/inventario.csv
   * 2) Si no, busca data/inventario/<id>.csv (columnas COLOR, TALLA, STOCK)
   */
  async function cargar(producto) {
    if (!producto) return null;
    if (producto.inventario) {
      if (!inventarioGeneral) inventarioGeneral = leerArchivo("data/inventario.csv");
      const texto = await inventarioGeneral;
      const r = texto ? aStockGeneral(texto, producto.inventario) : null;
      if (r) return r;
    }
    const texto = await leerArchivo("data/inventario/" + encodeURIComponent(producto.id) + ".csv");
    return texto ? aStock(texto) : null;
  }

  window.Inventario = { cargar: cargar, _leer: aStock };
})();
   /* Contacto -> WhatsApp */
   (function () {
     var NUMERO = "51994319421";
     var MENSAJE = "Hola, quiero más información sobre sus productos";
     document.addEventListener("DOMContentLoaded", function () {
       document.querySelectorAll('a[href="contacto.html"]').forEach(function (a) {
         a.href = "https://wa.me/" + NUMERO + "?text=" + encodeURIComponent(MENSAJE);
         a.target = "_blank";
         a.rel = "noopener noreferrer";
       });
     });
   })();
