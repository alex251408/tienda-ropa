/* =========================================================
   MODA FASHION — js/productos.js
   Lee data/productos.json y genera dinámicamente las tarjetas
   de producto dentro de ".featured-section .products-grid".

   - En index.html: muestra los productos destacados.
   - En productos.html (la cuadrícula lleva el atributo data-catalogo):
     filtra según la dirección de la página:
        productos.html                       -> todos
        productos.html?categoria=polos       -> solo esa categoría
        productos.html?categoria=ofertas     -> solo los que tienen precio anterior
        productos.html?buscar=henley         -> búsqueda por texto
   Para agregar un producto o una categoría solo hay que editar el JSON.
   ========================================================= */

(function () {
  "use strict";

  const RUTA_JSON = "data/productos.json";
  const SELECTOR_GRID = ".featured-section .products-grid";

  /* ---------- Utilidades ---------- */

  function crearElemento(etiqueta, clase, texto) {
    const el = document.createElement(etiqueta);
    if (clase) el.className = clase;
    if (texto !== undefined) el.textContent = texto;
    return el;
  }

  /** Minúsculas y sin tildes, para comparar "Camisería" con "camiseria". */
  function normalizar(texto) {
    return String(texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .trim();
  }

  function mayusculaInicial(texto) {
    const t = String(texto || "").trim();
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  /** 59.9 -> "S/ 59.90" */
  function formatearPrecio(valor) {
    const numero = Number(valor);
    if (Number.isNaN(numero)) return "S/ 0.00";
    return "S/ " + numero.toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  /** Porcentaje de descuento entero, o 0 si no hay oferta. */
  function porcentajeDescuento(precio, precioAnterior) {
    const actual = Number(precio);
    const anterior = Number(precioAnterior);
    if (!(anterior > actual)) return 0;
    return Math.max(1, Math.round((1 - actual / anterior) * 100));
  }

  function esOferta(producto) {
    return porcentajeDescuento(producto.precio, producto.precioAnterior) > 0;
  }

  /* ---------- Tarjeta de producto ---------- */

  function crearTarjetaProducto(producto) {
    const {
      id = "",
      nombre = "Producto sin nombre",
      categoria = "",
      precio = 0,
      precioAnterior = null,
      imagenPrincipal = "",
      stock = 0
    } = producto;

    const descuento = porcentajeDescuento(precio, precioAnterior);
    const porColor = producto.stockPorColor;
    const total = porColor && typeof porColor === "object"
      ? Object.values(porColor).reduce(function (suma, v) {
          if (v && typeof v === "object") {
            return suma + Object.values(v).reduce(function (s2, n) { return s2 + (Number(n) || 0); }, 0);
          }
          return suma + (Number(v) || 0);
        }, 0)
      : Number(stock);
    const agotado = total <= 0;

    const article = crearElemento("article", "product-card");
    if (categoria) article.dataset.categoria = categoria;

    const link = crearElemento("a", "product-link");
    link.href = "producto.html?id=" + encodeURIComponent(id);

    const wrapper = crearElemento("div", "product-image-wrapper");
    if (imagenPrincipal) {
      const img = crearElemento("img", "product-image");
      img.src = imagenPrincipal;
      img.alt = nombre;
      img.loading = "lazy";
      img.decoding = "async";
      // Si la foto no existe, se muestra un fondo neutro en vez del icono roto
      img.addEventListener("error", function () {
        img.remove();
        wrapper.classList.add("is-empty");
      }, { once: true });
      wrapper.appendChild(img);
    } else {
      wrapper.classList.add("is-empty");
    }

    if (agotado) {
      wrapper.appendChild(crearElemento("span", "product-badge product-badge-soldout", "Agotado"));
    } else if (descuento > 0) {
      wrapper.appendChild(crearElemento("span", "product-badge product-badge-offer", "-" + descuento + "%"));
    } else {
      wrapper.appendChild(crearElemento("span", "product-badge product-badge-available", "Disponible"));
      
      
    }
    

    const info = crearElemento("div", "product-info");
    info.appendChild(crearElemento("h3", "product-name", nombre));

    const filaPrecio = crearElemento("div", "product-price-row");
    filaPrecio.appendChild(crearElemento("span", "product-price", formatearPrecio(precio)));
    if (descuento > 0) {
      filaPrecio.appendChild(crearElemento("span", "product-price-old", formatearPrecio(precioAnterior)));
    }
    info.appendChild(filaPrecio);

    link.appendChild(wrapper);
    link.appendChild(info);
    article.appendChild(link);
    return article;
  }

  function renderizarProductos(productos, grid) {
    grid.innerHTML = "";
    const fragmento = document.createDocumentFragment();
    productos.forEach(function (producto) {
      fragmento.appendChild(crearTarjetaProducto(producto));
    });
    grid.appendChild(fragmento);
  }

  /** Mensaje dentro de la cuadrícula; con enlace opcional para volver a ver todo. */
  function mostrarMensaje(grid, texto, conEnlaceATodos) {
    grid.innerHTML = "";
    const caja = crearElemento("div", "products-empty-message");
    caja.appendChild(crearElemento("p", "", texto));
    if (conEnlaceATodos) {
      const enlace = crearElemento("a", "btn btn-secondary", "Ver todos los productos");
      enlace.href = "productos.html";
      caja.appendChild(enlace);
    }
    grid.appendChild(caja);
  }

  /* ---------- Catálogo (productos.html) ---------- */

  function filtrar(productos, categoria, buscar) {
    const cat = normalizar(categoria);
    const palabras = normalizar(buscar).split(/\s+/).filter(Boolean);

    return productos.filter(function (p) {
      if (cat === "ofertas") {
        if (!esOferta(p)) return false;
        } else if (cat && cat !== "hombre" && normalizar(p.categoria) !== cat) {
        return false;
      }
      if (palabras.length) {
        const texto = normalizar([p.nombre, p.categoria, p.descripcion, p.sku].join(" "));
        if (!palabras.every(function (palabra) { return texto.includes(palabra); })) return false;
      }
      return true;
    });
  }

  /** Chips: Todos + una por cada categoría que exista en el JSON + Ofertas (si hay). */
  function construirFiltros(productos, categoriaActual) {
    const contenedor = document.getElementById("catalogoFiltros");
    if (!contenedor) return;
    contenedor.innerHTML = "";

    const actual = normalizar(categoriaActual);
    const vistas = new Set();
    const opciones = [{ texto: "Todos", valor: "" }];

    productos.forEach(function (p) {
      const clave = normalizar(p.categoria);
      if (clave && !vistas.has(clave)) {
        vistas.add(clave);
        opciones.push({ texto: mayusculaInicial(p.categoria), valor: p.categoria });
      }
    });
    if (productos.some(esOferta)) opciones.push({ texto: "Ofertas", valor: "ofertas" });

    opciones.forEach(function (op) {
      const enlace = crearElemento("a", "filter-chip", op.texto);
      enlace.href = op.valor ? "productos.html?categoria=" + encodeURIComponent(op.valor) : "productos.html";
      if (normalizar(op.valor) === actual) {
        enlace.classList.add("is-active");
        enlace.setAttribute("aria-current", "page");
      }
      contenedor.appendChild(enlace);
    });

    // Si la categoría activa queda fuera de la fila visible, se desliza hasta ella
    const activo = contenedor.querySelector(".is-active");
    if (activo && activo.scrollIntoView) {
      contenedor.scrollLeft = Math.max(0, activo.offsetLeft - 16);
    }
  }

  function actualizarCabecera(cantidad, categoria, buscar) {
    let titulo = "Todos los productos";
    if (buscar) titulo = "Resultados para “" + buscar + "”";
    else if (categoria) titulo = mayusculaInicial(categoria);

    const tituloEl = document.getElementById("catalogoTitulo");
    if (tituloEl) tituloEl.textContent = titulo;

    const conteoEl = document.getElementById("catalogoConteo");
    if (conteoEl) conteoEl.textContent = cantidad === 1 ? "1 producto" : cantidad + " productos";

    document.title = titulo + " | Matteo Salvatore";
  }

  /** Deja escrito en el buscador del encabezado lo que se buscó. */
  function prepararBuscador(buscar) {
    const entrada = document.querySelector(".search-input");
    if (entrada && buscar) entrada.value = buscar;
  }

  /* ---------- Carga ---------- */

  async function cargarProductos() {
    const respuesta = await fetch(RUTA_JSON, { cache: "no-store" });
    if (!respuesta.ok) {
      throw new Error("No se pudo obtener productos.json (HTTP " + respuesta.status + ")");
    }
    const datos = await respuesta.json();
    if (!datos || !Array.isArray(datos.productos)) {
      throw new Error("El formato de productos.json no es válido: falta la clave 'productos'.");
    }
    return datos.productos;
  }

  async function iniciar() {
    const grid = document.querySelector(SELECTOR_GRID);
    if (!grid) return;

    const esCatalogo = grid.hasAttribute("data-catalogo");

    try {
      const todos = await cargarProductos();
      if (window.Inventario) {
        await Promise.all(todos.map(async function (p) {
          const inv = await window.Inventario.cargar(p);
          if (inv) p.stockPorColor = inv;
        }));
      }

      // Página principal: productos destacados, sin filtrar
      if (!esCatalogo) {
        if (todos.length === 0) mostrarMensaje(grid, "Todavía no hay productos para mostrar.", false);
        else renderizarProductos(todos, grid);
        return;
      }

      // Catálogo: filtra según la dirección de la página
      const params = new URLSearchParams(window.location.search);
      const categoria = (params.get("categoria") || "").trim();
      const buscar = (params.get("buscar") || "").trim();

      prepararBuscador(buscar);
      construirFiltros(todos, categoria);

      const lista = filtrar(todos, categoria, buscar);
      actualizarCabecera(lista.length, categoria, buscar);

      if (lista.length > 0) {
        renderizarProductos(lista, grid);
      } else if (buscar) {
        mostrarMensaje(grid, "No encontramos productos para “" + buscar + "”. Prueba con otra palabra.", true);
      } else if (categoria) {
        mostrarMensaje(grid, "Todavía no hay productos en esta categoría.", true);
      } else {
        mostrarMensaje(grid, "Todavía no hay productos para mostrar.", false);
      }
    } catch (error) {
      console.error("[productos.js] Error al cargar productos:", error);
      mostrarMensaje(
        grid,
        "No se pudieron cargar los productos en este momento. Por favor, actualiza la página o inténtalo más tarde.",
        false
      );
    }
  }

  document.addEventListener("DOMContentLoaded", iniciar);
})();
