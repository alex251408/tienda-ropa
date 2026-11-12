
(function () {
  "use strict";

  const CLAVE_CARRITO = "carrito_matteo_salvatore";
  const COSTO_DELIVERY = 10;
  const URL_ENVIO_PEDIDOS = "https://script.google.com/macros/s/AKfycbyrAWvWNHluhAlW_8Jf6XTIiWEIEyyV58mx0P6a8u27N0GP4BxP5bhp5KmcjKqOlzFIiA/exec";
  const CLAVE_PEDIDOS = "pedidos_matteo_salvatore";
const NOMBRE_BD = "matteo_salvatore_pruebas";
const TIENDA_COMPROBANTES = "comprobantes";
  const RUTA_UBIGEO = "data/ubigeo/";

  let datosDepartamentos = [];
  let datosProvincias = [];
  let datosDistritos = [];

  const departamentoSelect = document.getElementById("departamento");
  const provinciaSelect = document.getElementById("provincia");
  const distritoSelect = document.getElementById("distrito");

  // ==========================================
  // CARGAR ARCHIVOS UBIGEO
  // ==========================================

  async function cargarUbigeo() {
    try {
      const [dep, prov, dist] = await Promise.all([
        fetch(RUTA_UBIGEO + "ubigeo_peru_2026_departamentos.json"),
        fetch(RUTA_UBIGEO + "ubigeo_peru_2026_provincias.json"),
        fetch(RUTA_UBIGEO + "ubigeo_peru_2026_distritos.json")
      ]);

      if (!dep.ok || !prov.ok || !dist.ok) {
        throw new Error("No se pudieron cargar los archivos UBIGEO.");
      }

      const [departamentos, provincias, distritos] = await Promise.all([
        dep.json(),
        prov.json(),
        dist.json()
      ]);

      datosDepartamentos = departamentos;
      datosProvincias = provincias;
      datosDistritos = distritos;

      mostrarDepartamentos();

    } catch (error) {
      console.error("Error cargando UBIGEO:", error);

      if (departamentoSelect) {
        departamentoSelect.innerHTML =
          '<option value="">Error al cargar departamentos</option>';
      }
    }
  }

  // ==========================================
  // MOSTRAR DEPARTAMENTOS
  // ==========================================

  function mostrarDepartamentos() {
    if (!departamentoSelect) return;

    departamentoSelect.innerHTML =
      '<option value="">Selecciona un departamento</option>';

    datosDepartamentos.forEach(dep => {
      const opcion = document.createElement("option");

      opcion.value = dep.id;
      opcion.textContent = dep.name;

      departamentoSelect.appendChild(opcion);
    });
  }

  // ==========================================
  // MOSTRAR PROVINCIAS SEGÚN DEPARTAMENTO
  // ==========================================

  if (departamentoSelect) {
    departamentoSelect.addEventListener("change", () => {
      const codigoDepartamento = departamentoSelect.value;

      provinciaSelect.innerHTML =
        '<option value="">Selecciona una provincia</option>';

      distritoSelect.innerHTML =
        '<option value="">Selecciona un distrito</option>';

      provinciaSelect.disabled = true;
      distritoSelect.disabled = true;

      if (!codigoDepartamento) return;

      const provinciasFiltradas = datosProvincias.filter(prov =>
        prov.department_id === codigoDepartamento
      );

      provinciasFiltradas.forEach(prov => {
        const opcion = document.createElement("option");

        opcion.value = prov.id;
        opcion.textContent = prov.name;

        provinciaSelect.appendChild(opcion);
      });

      provinciaSelect.disabled = false;
    });
  }

  // ==========================================
  // MOSTRAR DISTRITOS SEGÚN PROVINCIA
  // ==========================================

  if (provinciaSelect) {
    provinciaSelect.addEventListener("change", () => {
      const codigoProvincia = provinciaSelect.value;

      distritoSelect.innerHTML =
        '<option value="">Selecciona un distrito</option>';

      distritoSelect.disabled = true;

      if (!codigoProvincia) return;

      const distritosFiltrados = datosDistritos.filter(dist =>
        dist.province_id === codigoProvincia
      );

      distritosFiltrados.forEach(dist => {
        const opcion = document.createElement("option");

        opcion.value = dist.id;
        opcion.textContent = dist.name;

        distritoSelect.appendChild(opcion);
      });

      distritoSelect.disabled = false;
    });
  }

  // ==========================================
  // FORMATO DE PRECIOS
  // ==========================================

  const formatoPrecio = (precio) => {
    return "S/ " + Number(precio || 0).toFixed(2);
  };

  // ==========================================
  // LEER CARRITO
  // ==========================================

  function leerCarrito() {
    try {
      return JSON.parse(localStorage.getItem(CLAVE_CARRITO)) || [];
    } catch (error) {
      console.error("Error leyendo el carrito:", error);
      return [];
    }
  }

  // ==========================================
  // MOSTRAR PRODUCTOS DEL CARRITO
  // ==========================================

  function mostrarProductos() {
    const contenedor = document.getElementById("checkoutProducts");
    const mensajeVacio = document.getElementById("emptyCart");
    const productos = leerCarrito();

    if (!contenedor) return;

    contenedor.innerHTML = "";

    if (productos.length === 0) {
      if (mensajeVacio) mensajeVacio.hidden = false;
      contenedor.hidden = true;

      actualizarTotales(0);
      return;
    }

    if (mensajeVacio) mensajeVacio.hidden = true;
    contenedor.hidden = false;

    productos.forEach((producto) => {
      const cantidad = Number(producto.cantidad) || 1;
      const precio = Number(producto.precio) || 0;
      const subtotal = precio * cantidad;

      const articulo = document.createElement("div");
      articulo.className = "checkout-product";

      const imagen = document.createElement("img");
      imagen.src = producto.imagen || "";
      imagen.alt = producto.nombre || "Producto";

      imagen.onerror = () => {
        imagen.style.display = "none";
      };

      const informacion = document.createElement("div");
      informacion.className = "checkout-product-info";

      const nombre = document.createElement("h3");
      nombre.textContent = producto.nombre || "Producto";

      const detalles = document.createElement("p");

      detalles.textContent =
        "Color: " + (producto.color || "No especificado") +
        " | Talla: " + (producto.talla || "No especificada");

      const controlesCantidad = document.createElement("div");
controlesCantidad.className = "checkout-quantity";

const botonRestar = document.createElement("button");
botonRestar.type = "button";
botonRestar.textContent = "−";
botonRestar.setAttribute("aria-label", "Disminuir cantidad");

const cantidadTexto = document.createElement("span");
cantidadTexto.textContent = cantidad;

const botonSumar = document.createElement("button");
botonSumar.type = "button";
botonSumar.textContent = "+";
botonSumar.setAttribute("aria-label", "Aumentar cantidad");

controlesCantidad.append(botonRestar, cantidadTexto, botonSumar);
const avisoStock = document.createElement("p");
avisoStock.className = "checkout-stock-message";
avisoStock.setAttribute("aria-live", "polite");
function actualizarCantidad(nuevaCantidad) {
  if (nuevaCantidad < 1) return;

  const carritoActual = leerCarrito();
  const indice = productos.indexOf(producto);

  if (indice === -1 || !carritoActual[indice]) return;

  carritoActual[indice].cantidad = nuevaCantidad;

  localStorage.setItem(
    CLAVE_CARRITO,
    JSON.stringify(carritoActual)
  );

  mostrarProductos();
}

botonRestar.addEventListener("click", () => {
  actualizarCantidad(cantidad - 1);
});

botonSumar.addEventListener("click", async () => {
  try {
    const respuesta = await fetch("data/productos.json", {
      cache: "no-store"
    });

    if (!respuesta.ok) {
      throw new Error("No se pudo cargar el catálogo");
    }

    const catalogo = await respuesta.json();

    const productoCatalogo = catalogo.productos.find(
      item => item.id === producto.id
    );

    if (!productoCatalogo || !window.Inventario) {
      throw new Error("No se pudo consultar el inventario");
    }

    const inventario = await window.Inventario.cargar(productoCatalogo);

    const normalizar = valor =>
      String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();

    const colorEncontrado = Object.keys(inventario || {}).find(
      color => normalizar(color) === normalizar(producto.color)
    );

    const tallas = colorEncontrado ? inventario[colorEncontrado] : {};

    const tallaEncontrada = Object.keys(tallas).find(
      talla => normalizar(talla) === normalizar(producto.talla)
    );

    const stockDisponible = Number(tallas[tallaEncontrada]) || 0;

    if (cantidad >= stockDisponible) {
  avisoStock.textContent =
  "Ya no hay más unidades disponibles de este producto.";
  return;
}

    actualizarCantidad(cantidad + 1);

  } catch (error) {
  console.error("Error al consultar el inventario:", error);

  avisoStock.textContent =
    "No se pudo verificar la disponibilidad. Intenta nuevamente.";
}
});

      const precioTexto = document.createElement("p");
      precioTexto.textContent = formatoPrecio(subtotal);

     const botonEliminar = document.createElement("button");
botonEliminar.type = "button";
botonEliminar.className = "checkout-remove";
botonEliminar.setAttribute("aria-label", "Eliminar producto");
botonEliminar.title = "Eliminar producto";

botonEliminar.innerHTML = `
  <svg viewBox="0 0 24 24"
       xmlns="http://www.w3.org/2000/svg"
       aria-hidden="true">
    <rect x="6" y="7" width="12" height="14" rx="2"
          fill="none" stroke="currentColor" stroke-width="1.8"/>
    <path d="M4 7h16M9 7V4h6v3M10 11v6M14 11v6"
          fill="none" stroke="currentColor" stroke-width="1.8"
          stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

botonEliminar.addEventListener("click", () => {
  const carritoActual = leerCarrito();

  carritoActual.splice(productos.indexOf(producto), 1);

  localStorage.setItem(
    CLAVE_CARRITO,
    JSON.stringify(carritoActual)
  );

  mostrarProductos();
});

informacion.append(nombre, detalles, controlesCantidad, avisoStock, precioTexto);
articulo.append(imagen, informacion, botonEliminar);

contenedor.appendChild(articulo);
    });

    const subtotalGeneral = productos.reduce((total, producto) => {
      return total +
        (Number(producto.precio) || 0) *
        (Number(producto.cantidad) || 1);
    }, 0);

    actualizarTotales(subtotalGeneral);
  }

  // ==========================================
  // ACTUALIZAR TOTALES
  // ==========================================

  function actualizarTotales(subtotal) {
    const delivery = subtotal > 0 ? COSTO_DELIVERY : 0;
    const total = subtotal + delivery;

    const subtotalElemento = document.getElementById("subtotal");
    const deliveryElemento = document.getElementById("deliveryCost");
    const totalElemento = document.getElementById("totalCompra");

    if (subtotalElemento) {
      subtotalElemento.textContent = formatoPrecio(subtotal);
    }

    if (deliveryElemento) {
      deliveryElemento.textContent = formatoPrecio(delivery);
    }

    if (totalElemento) {
      totalElemento.textContent = formatoPrecio(total);
    }
  }

  // ==========================================
  // CONFIGURAR MÉTODOS DE PAGO
  // ==========================================

  function configurarPagos() {
    const opciones = document.querySelectorAll(
      'input[name="metodoPago"]'
    );

    const detalles = document.getElementById("paymentDetails");

    if (!detalles || opciones.length === 0) return;

    const informacionPagos = {
      yape: `
        <div class="payment-brand payment-brand-yape">
          <img src="img/pagos/yape-log.jpg" alt="Yape">
        </div>
        <div class="payment-panel-content">
          <h2>Pago mediante Yape</h2>
          <p>Escanea nuestro código QR desde tu aplicación Yape.</p>
          <div class="payment-qr-placeholder">
            Aquí colocaremos tu código QR de Yape.
          </div>
          <div class="payment-data-row">
            <strong>Número de celular:</strong>
            <span>Pendiente de configurar</span>
          </div>
          <div class="payment-data-row">
            <strong>Titular:</strong>
            <span>Pendiente de configurar</span>
          </div>
          <div class="payment-reminder">
            <strong>ⓘ Información importante</strong>
            <p>Luego de realizar el pago, adjunta tu comprobante en la sección correspondiente.</p>
          </div>
        </div>
      `,

      plin: `
        <div class="payment-brand payment-brand-plin">
          <img src="img/pagos/plim-log.jpg" alt="Plin">
        </div>
        <div class="payment-panel-content">
          <h2>Pago mediante Plin</h2>
          <p>Escanea nuestro código QR desde tu aplicación Plin.</p>
          <div class="payment-qr-placeholder">
            Aquí colocaremos tu código QR de Plin.
          </div>
          <div class="payment-data-row">
            <strong>Número de celular:</strong>
            <span>Pendiente de configurar</span>
          </div>
          <div class="payment-data-row">
            <strong>Titular:</strong>
            <span>Pendiente de configurar</span>
          </div>
          <div class="payment-reminder">
            <strong>ⓘ Información importante</strong>
            <p>Luego de realizar el pago, adjunta tu comprobante en la sección correspondiente.</p>
          </div>
        </div>
      `,

      transferencia: `
        <div class="payment-brand payment-brand-bcp">
          <img src="img/pagos/bcp-log.jpg" alt="BCP">
        </div>
        <div class="payment-panel-content">
          <h2>Transferencia bancaria BCP</h2>
          <p>Realiza tu depósito o transferencia utilizando estos datos:</p>
          <div class="payment-data-row">
            <strong>Banco:</strong>
            <span>BCP</span>
          </div>
          <div class="payment-data-row">
            <strong>Titular:</strong>
            <span>Pendiente de configurar</span>
          </div>
          <div class="payment-data-row">
            <strong>N.º de cuenta:</strong>
            <span>Pendiente de configurar</span>
          </div>
          <div class="payment-data-row">
            <strong>CCI:</strong>
            <span>Pendiente de configurar</span>
          </div>
          <div class="payment-reminder">
            <strong>ⓘ Información importante</strong>
            <p>Luego de realizar el pago, adjunta tu comprobante en la sección correspondiente.</p>
          </div>
        </div>
      `
    };

    opciones.forEach((opcion) => {
      opcion.addEventListener("change", () => {
        const metodo = document.querySelector(
          'input[name="metodoPago"]:checked'
        );

        if (!metodo || !informacionPagos[metodo.value]) {
          detalles.hidden = true;
          detalles.innerHTML = "";
          return;
        }

        detalles.innerHTML = informacionPagos[metodo.value];
        detalles.hidden = false;
      });
    });

    // Mostrar el panel si ya existe un método seleccionado.
    const metodoInicial = document.querySelector(
      'input[name="metodoPago"]:checked'
    );

    if (metodoInicial) {
      metodoInicial.dispatchEvent(new Event("change", { bubbles: true }));
    } else {
      detalles.hidden = true;
      detalles.innerHTML = "";
    }
  }
  
  // ==========================================
  // GUARDAR COMPROBANTE EN INDEXEDDB
  // ==========================================

  function guardarComprobante(numeroPedido, archivo) {
    return new Promise((resolve, reject) => {
      const solicitud = indexedDB.open(NOMBRE_BD, 1);

      solicitud.onupgradeneeded = (evento) => {
        const bd = evento.target.result;

        if (!bd.objectStoreNames.contains(TIENDA_COMPROBANTES)) {
          bd.createObjectStore(TIENDA_COMPROBANTES);
        }
      };

      solicitud.onerror = () => {
        reject(new Error("No se pudo abrir el almacenamiento de comprobantes."));
      };

      solicitud.onsuccess = () => {
        const bd = solicitud.result;
        const transaccion = bd.transaction(TIENDA_COMPROBANTES, "readwrite");
        const tienda = transaccion.objectStore(TIENDA_COMPROBANTES);

        tienda.put(archivo, numeroPedido);

        transaccion.oncomplete = () => {
          bd.close();
          resolve();
        };

        transaccion.onerror = () => {
          bd.close();
          reject(new Error("No se pudo guardar el comprobante."));
        };
      };
    });
  }

  // ==========================================
  // GENERAR NÚMERO DE PEDIDO
  // ==========================================

  function generarNumeroPedido() {
    const fecha = new Date();
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");

    const pedidos = JSON.parse(
      localStorage.getItem(CLAVE_PEDIDOS) || "[]"
    );

    const correlativo = String(pedidos.length + 1).padStart(4, "0");

    return `MS-${anio}${mes}${dia}-${correlativo}`;
  }

  // ==========================================
  // ESCAPAR TEXTO HTML
  // ==========================================

  function escaparHTML(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, (caracter) => {
      const equivalencias = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      };

      return equivalencias[caracter];
    });
  }

  // ==========================================
  // MOSTRAR CONFIRMACIÓN DEL PEDIDO
  // ==========================================

  function mostrarConfirmacion(pedido) {
    const contenedor = document.querySelector(".checkout-container");

    if (!contenedor) return;

    contenedor.innerHTML = `
      <section class="checkout-card" style="
        max-width: 650px;
        margin: 50px auto;
        padding: 35px;
        text-align: center;
      ">
        <div style="font-size: 55px; margin-bottom: 15px;">
          ✓
        </div>

        <h1 style="margin-bottom: 12px;">
          ¡Pedido recibido!
        </h1>

        <p style="margin-bottom: 20px;">
          Hemos recibido tu solicitud correctamente.
        </p>

        <div style="
          background: #fff4df;
          color: #946200;
          padding: 13px;
          border-radius: 8px;
          margin-bottom: 25px;
        ">
          <strong>Pago pendiente de verificación</strong>
        </div>

        <p>Número de pedido:</p>

        <h2 style="margin: 10px 0 25px;">
          ${escaparHTML(pedido.numero)}
        </h2>

        <p>
          Hola, ${escaparHTML(pedido.cliente.nombre)}.
        </p>

        <p style="margin: 15px 0;">
          Tu pedido ha quedado registrado. Revisaremos tu comprobante
          y posteriormente confirmaremos el pago.
        </p>

        <p style="font-size: 20px; font-weight: bold; margin: 20px 0;">
          Total: ${formatoPrecio(pedido.total)}
        </p>

        <p style="color: #666; font-size: 14px;">
          Gracias por elegir Matteo Salvatore.
        </p>

        <a href="productos.html" style="
          display: inline-block;
          margin-top: 25px;
          padding: 14px 25px;
          background: #7426a8;
          color: white;
          text-decoration: none;
          border-radius: 7px;
          font-weight: bold;
        ">
          VOLVER A LA TIENDA
        </a>
      </section>
    `;

    window.scrollTo(0, 0);
  }
    // ==========================================
  // PREPARAR Y ENVIAR PEDIDO POR CORREO
  // ==========================================

  function convertirArchivoBase64(archivo) {
    return new Promise((resolve, reject) => {
      const lector = new FileReader();

      lector.onload = () => {
        const resultado = lector.result;
        resolve(resultado.split(",")[1]);
      };

      lector.onerror = () => {
        reject(new Error("No se pudo leer el comprobante."));
      };

      lector.readAsDataURL(archivo);
    });
  }

  async function enviarPedidoPorCorreo(pedido, archivo) {
    const comprobanteBase64 = await convertirArchivoBase64(archivo);

    const datos = {
      numeroPedido: pedido.numero,
      nombre: pedido.cliente.nombre,
      telefono: pedido.cliente.telefono,
      correo: pedido.cliente.correo,

      departamento: pedido.direccion.departamento,
      provincia: pedido.direccion.provincia,
      distrito: pedido.direccion.distrito,
      direccion: pedido.direccion.direccion,
      referencia: pedido.direccion.referencia,

      productos: pedido.productos.map(producto =>
        `${producto.nombre} | Color: ${producto.color} | Talla: ${producto.talla} | Cantidad: ${producto.cantidad} | Precio: ${formatoPrecio(producto.precio)}`
      ).join("\n"),

      metodoPago: pedido.metodoPago,
      subtotal: formatoPrecio(pedido.subtotal),
      delivery: formatoPrecio(pedido.delivery),
      total: formatoPrecio(pedido.total),

      comprobanteBase64: comprobanteBase64,
      comprobanteTipo: archivo.type,
      comprobanteNombre: archivo.name
    };

    await fetch(URL_ENVIO_PEDIDOS, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(datos)
    });
  }

  // ==========================================
  // PROCESAR PEDIDO
  // ==========================================

  function configurarFormulario() {
    const formulario = document.getElementById("checkoutForm");
    const boton = document.getElementById("btnRealizarPedido");

    if (!formulario || !boton) return;

    formulario.addEventListener("submit", async (evento) => {
      evento.preventDefault();

      const productos = leerCarrito();

      // No permitir pedidos con carrito vacío.
      if (productos.length === 0) {
        alert("Tu carrito está vacío. Agrega productos antes de continuar.");
        return;
      }

      // Validar campos obligatorios.
      if (!formulario.reportValidity()) {
        return;
      }

      const archivo = document.getElementById("comprobante").files[0];

      if (!archivo) {
        alert("Debes adjuntar tu comprobante de pago.");
        return;
      }

      if (
        !archivo.type.startsWith("image/") &&
        archivo.type !== "application/pdf"
      ) {
        alert("El comprobante debe ser una imagen o un archivo PDF.");
        return;
      }

      // Evitar envíos repetidos.
      boton.disabled = true;
      boton.textContent = "PROCESANDO PEDIDO...";

      try {
        const metodoSeleccionado = document.querySelector(
          'input[name="metodoPago"]:checked'
        );

        if (!metodoSeleccionado) {
          throw new Error("Selecciona un método de pago.");
        }

        const subtotal = productos.reduce((total, producto) => {
          return total +
            (Number(producto.precio) || 0) *
            (Number(producto.cantidad) || 1);
        }, 0);

        const delivery = subtotal > 0 ? COSTO_DELIVERY : 0;
        const total = subtotal + delivery;

        const numeroPedido = generarNumeroPedido();

        const pedido = {
          numero: numeroPedido,
          fecha: new Date().toISOString(),
          estado: "pendiente_verificacion",

          cliente: {
            nombre: document.getElementById("nombre").value.trim(),
            telefono: document.getElementById("telefono").value.trim(),
            correo: document.getElementById("correo").value.trim()
          },

          direccion: {
            departamento: departamentoSelect.selectedOptions[0].textContent,
            provincia: provinciaSelect.selectedOptions[0].textContent,
            distrito: distritoSelect.selectedOptions[0].textContent,
            direccion: document.getElementById("direccion").value.trim(),
            referencia: document.getElementById("referencia").value.trim()
          },

          productos: productos.map(producto => ({
            nombre: producto.nombre,
            color: producto.color || "",
            talla: producto.talla || "",
            cantidad: Number(producto.cantidad) || 1,
            precio: Number(producto.precio) || 0,
            imagen: producto.imagen || ""
          })),

          metodoPago: metodoSeleccionado.value,

          comprobante: {
            nombre: archivo.name,
            tipo: archivo.type,
            tamano: archivo.size
          },

          subtotal,
          delivery,
          total
        };

        // Guardar primero el archivo.
        await guardarComprobante(numeroPedido, archivo);

        // Registrar los datos del pedido.
        const pedidos = JSON.parse(
          localStorage.getItem(CLAVE_PEDIDOS) || "[]"
        );

        pedidos.push(pedido);

        localStorage.setItem(
  CLAVE_PEDIDOS,
  JSON.stringify(pedidos)
);

// Enviar pedido y comprobante al correo.
await enviarPedidoPorCorreo(pedido, archivo);

// Mostrar confirmación.
mostrarConfirmacion(pedido);

      } catch (error) {
        console.error("Error procesando el pedido:", error);

        alert(
          error.message ||
          "No se pudo registrar el pedido. Inténtalo nuevamente."
        );

        boton.disabled = false;
        boton.textContent = "REALIZAR PEDIDO";
      }
    });
  }


  // ==========================================
  // INICIAR CHECKOUT
  // ==========================================

  async function iniciarCheckout() {
    mostrarProductos();
    configurarPagos();
    configurarFormulario();
    await cargarUbigeo();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarCheckout);
  } else {
    iniciarCheckout();
  }

})();
