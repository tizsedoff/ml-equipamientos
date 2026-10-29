// ===== CONFIG: reemplazar por el WhatsApp real del negocio =====
const WA = "543755301413";

const ICONS = {
 estribos:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"><path d="M3 14h18M6 14l1-3h10l1 3M7 18v-4M17 18v-4"/></svg>',
 defensas:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"><path d="M3 9h18v6H3zM6 15v3M18 15v3"/></svg>',
 tapas:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"><path d="M2 10h20l-2 8H4zM2 10l3-5h14l3 5"/></svg>',
 luces:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/><circle cx="12" cy="12" r="3"/></svg>',
 llantas:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v6M12 15v6M3 12h6M15 12h6" stroke-linecap="round"/></svg>',
 otros:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"><path d="M4 4h16v16H4zM4 12h16M12 4v16"/></svg>'
};

const CATS = {todos:"Todo",tapas:"Tapas de caja",estribos:"Estribos",defensas:"Defensas y barras",luces:"Iluminación",llantas:"Llantas",otros:"Complementos"};

// Para sumar fotos reales: agregar img:"img/archivo.jpg" a cada producto
const PRODUCTS = [
 {n:"Tapa retráctil Roll Pro",c:"tapas",d:"Aluminio enrollable. Se abre y cierra en segundos.",b:"Destacado"},
 {n:"Tapa rígida",c:"tapas",d:"Cobertura sólida y hermética, a medida de tu pick-up."},
 {n:"Cubre caja de poliuretano",c:"otros",d:"Protección contra golpes y rayones.",b:"Novedad"},
 {n:"Cobertor de caja",c:"tapas",d:"Protege tu carga del clima y las miradas."},
 {n:"Steel Tiger",c:"defensas",d:"Línea de máxima robustez para uso exigente."},
 {n:"Estribos",c:"estribos",d:"Acceso cómodo y protección lateral."},
 {n:"Defensas",c:"defensas",d:"Delanteras y traseras para todas las marcas."},
 {n:"Barras",c:"defensas",d:"Barras y portaequipajes con terminación superior."},
 {n:"Faros LED",c:"luces",d:"Mayor visibilidad con estética moderna."},
 {n:"Llantas",c:"llantas",d:"Diseños deportivos y todo terreno."},
 {n:"Enganches",c:"otros",d:"Resistentes y seguros para remolque."},
 {n:"Lonas marítimas",c:"otros",d:"Cobertura resistente para la caja."},
 {n:"Polarizados",c:"otros",d:"Privacidad, confort y estilo en tus vidrios."}
];
