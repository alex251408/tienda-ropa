
(function () {
  "use strict";

  const CLAVE_CARRITO = "carrito_matteo_salvatore";
  const COSTO_DELIVERY = 10;
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

      const cantidadTexto = document.createElement("p");
      cantidadTexto.textContent = "Cantidad: " + cantidad;

      const precioTexto = document.createElement("p");
      precioTexto.textContent = formatoPrecio(subtotal);

      informacion.append(nombre, detalles, cantidadTexto, precioTexto);
      articulo.append(imagen, informacion);

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
  // INICIAR CHECKOUT
  // ==========================================

  async function iniciarCheckout() {
    mostrarProductos();
    configurarPagos();
    await cargarUbigeo();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarCheckout);
  } else {
    iniciarCheckout();
  }

})();
