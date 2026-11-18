
/* =====================================================
   MODA&FASHION - CHAT DE ATENCION AL CLIENTE
   Archivo: js/chat-widget.js

   - Utiliza el botón original de WhatsApp.
   - No crea un segundo botón flotante.
   - Muestra una ventana de atención al cliente.
   - Permite derivar al cliente a WhatsApp.
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

  // ==========================================
  // CONFIGURACIÓN
  // ==========================================

  const MF_WHATSAPP = "51994319421";

  // Buscar el botón original de WhatsApp
  const chatButton = document.querySelector(".whatsapp-float");

  if (!chatButton) {
    console.error(
      "Moda&Fashion: No se encontró el botón original .whatsapp-float"
    );
    return;
  }

  // ==========================================
  // CREAR VENTANA DEL CHAT
  // ==========================================

  const chatWindow = document.createElement("section");

  chatWindow.id = "mf-chat-window";

  chatWindow.setAttribute(
    "aria-label",
    "Chat de atención Moda&Fashion"
  );

  chatWindow.innerHTML = `
    <div class="mf-chat-header">

      <div class="mf-chat-brand">
        <strong>MODA&FASHION</strong>
        <span>Atención al cliente</span>
      </div>

      <button
        id="mf-chat-close"
        type="button"
        aria-label="Cerrar chat">
        &times;
      </button>

    </div>

    <div
      class="mf-chat-messages"
      id="mf-chat-messages">
    </div>

    <div class="mf-chat-footer">
      Atención al cliente de Moda&Fashion
    </div>
  `;

  // Insertar únicamente la ventana del chat
  document.body.appendChild(chatWindow);

  const chatMessages = document.getElementById(
    "mf-chat-messages"
  );

  // ==========================================
  // AGREGAR MENSAJES
  // ==========================================

  function mfAddMessage(message, type = "bot") {

    const bubble = document.createElement("div");

    bubble.className = `mf-chat-message mf-chat-${type}`;

    bubble.textContent = message;

    chatMessages.appendChild(bubble);

    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // ==========================================
  // MOSTRAR OPCIONES
  // ==========================================

  function mfShowOptions() {

    const container = document.createElement("div");

    container.className = "mf-chat-options";

    const options = [
      ["💳 Métodos de pago", "pago"],
      ["🚚 Envíos y delivery", "delivery"],
      ["💵 ¿Puedo pagar contraentrega?", "contraentrega"],
      ["🙋 Quiero hablar con un asesor", "asesor"]
    ];

    options.forEach(([label, action]) => {

      const button = document.createElement("button");

      button.type = "button";

      button.className = "mf-chat-option";

      button.textContent = label;

      button.addEventListener("click", function () {

        container.remove();

        mfHandleOption(action, label);

      });

      container.appendChild(button);

    });

    chatMessages.appendChild(container);

    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // ==========================================
  // RESPUESTAS AUTOMÁTICAS
  // ==========================================

  function mfHandleOption(action, label) {

    mfAddMessage(label, "user");

    switch (action) {

      case "pago":

        mfAddMessage(
          "Aceptamos Yape, Plin y transferencia bancaria mediante BCP. Si necesitas ayuda con el pago, puedes conversar con nuestro asesor."
        );

        break;

      case "delivery":

        mfAddMessage(
          "Formas de entrega:\n" +
          "📍 Contraentrega en Estación La Cultura (gratis).\n" +
          "📍 Otra estación: +S/5.\n" +
          "🚗 InDrive con depósito previo.\n" +
          "📦 Agencia Shalom (a tu ciudad)."
        );

        break;

      case "contraentrega":

        mfAddMessage(
          "Para confirmar si tenemos disponible el pago contraentrega para tu zona, te recomendamos consultar directamente con nuestro asesor."
        );

        break;

      case "asesor":

        mfAddMessage(
          "¡Por supuesto! 😊 Pulsa el botón de abajo para conversar directamente con nuestro asesor por WhatsApp."
        );

        mfAddWhatsAppButton();

        break;
    }

    // Volver a mostrar las opciones
    if (action !== "asesor") {

      mfShowOptions();

    }
  }

  // ==========================================
  // BOTÓN DE WHATSAPP PARA HABLAR CON ASESOR
  // ==========================================

  function mfAddWhatsAppButton() {

    const container = document.createElement("div");

    container.className = "mf-chat-options";

    const link = document.createElement("a");

    link.className = "mf-chat-whatsapp";

    link.textContent = "Hablar con un asesor por WhatsApp";

    link.href =
      `https://wa.me/${MF_WHATSAPP}?text=${encodeURIComponent(
        "Hola, vengo de la página web de Moda&Fashion. Quisiera recibir atención personalizada."
      )}`;

    link.target = "_blank";

    link.rel = "noopener noreferrer";

    container.appendChild(link);

    chatMessages.appendChild(container);

    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

 
  // ==========================================
  // ABRIR CHAT DESDE EL BOTÓN ORIGINAL
  // ==========================================

  chatButton.addEventListener("click", function (event) {

    // Evitar que abra directamente WhatsApp
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    // Abrir ventana emergente
    chatWindow.classList.add("mf-chat-open");

    // Mostrar bienvenida solamente la primera vez
    if (!chatMessages.dataset.initialized) {

      mfAddMessage(
        "¡Hola! 👋 Bienvenido a Moda&Fashion. Estamos aquí para ayudarte. ¿Qué información necesitas?"
      );

      chatMessages.dataset.initialized = "true";

      mfShowOptions();

      // Comenzar mostrando el saludo y las opciones desde arriba
      chatMessages.scrollTop = 0;

    }

  }, true);


  // ==========================================
  // CERRAR CHAT
  // ==========================================

  document.getElementById("mf-chat-close").addEventListener(
    "click",
    function () {

      chatWindow.classList.remove("mf-chat-open");

    }
  );

  console.log(
    "Moda&Fashion: Chat conectado al botón original de WhatsApp."
  );

});
