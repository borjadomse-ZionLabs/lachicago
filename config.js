/* ==========================================================================
   LA CHICAGO · CONFIGURACIÓN
   Único archivo a tocar para cambiar datos, horarios, servicios y precios.
   ========================================================================== */
window.SITE = {
  marca: "La Chicago",
  fundador: "Charls Albert",
  instagramFundador: "charlsalbert_",

  sedes: {
    vilanova: {
      id: "vilanova",
      nombre: "La Chicago",
      ciudad: "Vilanova i la Geltrú",
      corto: "Vilanova",
      lema: "La barbería de los alta gama",
      direccion: "Carrer de Joan Maragall, 27",
      cp: "08800 Vilanova i la Geltrú",
      telefono: "931971532",
      telefonoTxt: "931 97 15 32",
      whatsappLink: "https://wa.me/message/HS3FELGO2NCOP1",   // enlace de WhatsApp Business de su bio
      instagram: "chicago_vilanova",
      mapsUrl: "https://www.google.com/maps/place/Chicago+Barber+Shop/@41.2197687,1.723365,17z/data=!4m6!3m5!1s0x12a386fae7b99ffd:0x5dd889b69cb3510f!8m2!3d41.2197687!4d1.723365",
      resenas: { nota: 4.4, total: 234, fuente: "Google" },
      barberos: [],                  // vacío = "Primer profesional disponible"
      reservasEndpoint: "",          // URL de Google Apps Script (calendario de Vilanova). Vacío = modo demo
      horario: { 1: [["10:00", "20:00"]], 2: [["10:00", "20:00"]], 3: [["10:00", "20:00"]], 4: [["10:00", "20:00"]], 5: [["10:00", "20:00"]], 6: [["10:00", "20:00"]], 0: [] }
    },
    sitges: {
      id: "sitges",
      nombre: "La Chicago 2.0",
      ciudad: "Sitges",
      corto: "Sitges",
      lema: "Barbería unisex · Trenzas · Peluquería",
      direccion: "Carrer de Sant Josep, 36",
      cp: "08870 Sitges",
      telefono: "",                  // ⚠️ añadir teléfono de Sitges si lo tiene
      telefonoTxt: "",
      whatsappLink: "https://wa.me/message/HS3FELGO2NCOP1",
      instagram: "chicago_sitges",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Carrer+de+Sant+Josep+36+08870+Sitges",
      resenas: { nota: 4.9, total: 118, fuente: "Booksy" },
      barberos: ["José Ángel"],      // ⚠️ completar con el equipo real
      reservasEndpoint: "",
      horario: { 1: [["10:00", "20:00"]], 2: [["10:00", "20:00"]], 3: [["10:00", "20:00"]], 4: [["10:00", "20:00"]], 5: [["10:00", "20:00"]], 6: [["10:00", "20:00"]], 0: [] }
    }
  },

  demoOcupados: true,     // DEMO: marca huecos ocupados para que la agenda se vea viva. false al entregar.
  intervaloMin: 30,
  diasVista: 21,
  antelacionMin: 60,
  cerrado: ["2026-12-25", "2027-01-01", "2027-01-06"],

  /* Servicios. precio: número (desde) o null = "Consultar". sedes: dónde se ofrece. */
  categorias: [
    { id: "barberia", nombre: "Barbería" },
    { id: "pelu", nombre: "Peluquería & color" },
    { id: "trenzas", nombre: "Trenzas & extras" }
  ],
  servicios: [
    { id: "corte", nombre: "Corte de cabello", desc: "Corte y peinado con producto de primera calidad.", precio: 18, desde: true, min: 40, cat: "barberia", sedes: ["vilanova", "sitges"], img: "fade-2", top: true },
    { id: "corteBarba", nombre: "Corte + barba", desc: "El ritual completo: corte, perfilado y barba a cuchilla.", precio: 25, desde: true, min: 50, cat: "barberia", sedes: ["vilanova", "sitges"], img: "fade-4", top: true },
    { id: "corteBarbaCejas", nombre: "Corte + barba + cejas", desc: "Todo incluido, detalle a cuchilla.", precio: 25, min: 50, cat: "barberia", sedes: ["vilanova", "sitges"], img: "fade-3" },
    { id: "caballero", nombre: "Corte caballero signature", desc: "Corte con extra: diseño, textura o acabado especial.", precio: 20, min: 30, cat: "barberia", sedes: ["vilanova", "sitges"], img: "curly" },
    { id: "barba", nombre: "Arreglo de barba", desc: "Máquina y cuchilla. Líneas limpias, contorno perfecto.", precio: 10, desde: true, min: 10, cat: "barberia", sedes: ["vilanova", "sitges"], img: "fade-5" },
    { id: "cerquillo", nombre: "Cerquillo · perfilado", desc: "Retoque de líneas entre cortes.", precio: 10, desde: true, min: 10, cat: "barberia", sedes: ["vilanova", "sitges"], img: "fade-1" },
    { id: "cejas", nombre: "Cejas a cuchilla", desc: "Definición precisa en cinco minutos.", precio: 3, min: 5, cat: "barberia", sedes: ["vilanova", "sitges"], img: "chimbala" },
    { id: "infantil", nombre: "Corte infantil", desc: "Hasta 10 años. Paciencia de oro.", precio: 15, min: 25, cat: "barberia", sedes: ["vilanova", "sitges"], img: "fade-2" },
    { id: "facial", nombre: "Facial", desc: "Limpieza e hidratación para salir nuevo.", precio: 15, desde: true, min: 15, cat: "barberia", sedes: ["vilanova", "sitges"], img: "dalvin-2" },

    { id: "balayage", nombre: "Balayage", desc: "Mechas de raíz con conexión, luz natural y brillo.", precio: null, min: 150, cat: "pelu", sedes: ["sitges"], img: "balayage-2", top: true },
    { id: "color", nombre: "Color · mechas", desc: "Del rubio platino al cobre intenso.", precio: null, min: 120, cat: "pelu", sedes: ["sitges"], img: "look-red" },
    { id: "keratina", nombre: "Keratina", desc: "Alisado y control del frizz de larga duración.", precio: null, min: 120, cat: "pelu", sedes: ["sitges"], img: "look-energy" },
    { id: "corteMujer", nombre: "Corte & peinado mujer", desc: "Corte, secado y styling a medida.", precio: null, min: 60, cat: "pelu", sedes: ["sitges"], img: "stg-flowers" },
    { id: "hidratacion", nombre: "Tratamiento de hidratación", desc: "Nutrición profunda para cabellos castigados.", precio: null, min: 45, cat: "pelu", sedes: ["sitges"], img: "balayage-3" },
    { id: "boda", nombre: "Peinados de boda", desc: "Para el día que no se repite. Prueba incluida.", precio: null, min: 90, cat: "pelu", sedes: ["sitges"], img: "stg-flowers-2" },
    { id: "depilacion", nombre: "Depilación facial", desc: "Hilo y cera, rápido y preciso.", precio: null, min: 15, cat: "pelu", sedes: ["sitges"], img: "look-energy" },

    { id: "trenzas", nombre: "Trenzas", desc: "Box braids, cornrows y diseños a medida.", precio: null, min: 120, cat: "trenzas", sedes: ["vilanova", "sitges"], img: "braids-1", top: true },
    { id: "extra", nombre: "Extra · diseño", desc: "Líneas, dibujos y detalles a cuchilla.", precio: 5, min: 10, cat: "trenzas", sedes: ["vilanova", "sitges"], img: "fade-3" },
    { id: "domicilio", nombre: "Servicio a domicilio", desc: "La Chicago va a ti: casa, hotel o backstage.", precio: null, min: 60, cat: "trenzas", sedes: ["vilanova", "sitges"], img: "dalvin-1" }
  ],

  /* Próximos eventos del universo Chicago (se ocultan solos cuando pasa la fecha) */
  eventos: [
    { marca: "Sesión Chicago", fecha: "2026-11-06", texto: "Viernes 06.11 · The Secret Garden BCN" },
    { marca: "Rancho Caballito Méndez", fecha: "2026-12-12", texto: "Sábado 12.12 · Cumpleaños del caballo mayor" }
  ]
};
