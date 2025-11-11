// src/pages/PaginaVentasMenores.jsx

import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  Timestamp, 
  runTransaction 
} from 'firebase/firestore';
import { useCaja } from '../context/CajaContext';
import './PaginaVentasMenores.css';
import { generarTextoTicketVentaMenor } from '../utils/generarTickets'; 

const formatConsecutivo = (num, prefix) => {
  return `${prefix}${String(num).padStart(5, '0')}`;
};

const descargarTxt = (contenido, nombreArchivo) => {
  const element = document.createElement("a");
  const file = new Blob([contenido], {type: 'text/plain;charset=utf-8'});
  element.href = URL.createObjectURL(file);
  element.download = `${nombreArchivo}.txt`;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

function PaginaVentasMenores() {
  
  // 1. ¡EL ARREGLO! Traemos 'setBase' en lugar de 'sumarALaBase'
  const { userProfile, base, setBase } = useCaja(); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- (Estados del formulario y de la venta, sin cambios) ---
  const [nombreCliente, setNombreCliente] = useState('');
  const [itemDescripcion, setItemDescripcion] = useState('');
  const [itemCantidad, setItemCantidad] = useState('');
  const [itemPrecio, setItemPrecio] = useState('');
  const [itemsVenta, setItemsVenta] = useState([]);
  const [totalVenta, setTotalVenta] = useState(0);
  const [ventaReciente, setVentaReciente] = useState(null); 

  useEffect(() => {
    const nuevoTotal = itemsVenta.reduce((acc, item) => acc + item.subtotal, 0);
    setTotalVenta(nuevoTotal);
  }, [itemsVenta]);
  
  const handleAddItem = () => {
    const cantNum = Number(itemCantidad);
    const precioNum = Number(itemPrecio);

    if (!itemDescripcion || cantNum <= 0 || precioNum <= 0) {
      alert("Complete Material, Cantidad y Precio.");
      return;
    }
    const subtotal = cantNum * precioNum;

    setItemsVenta(prevState => [
      ...prevState,
      {
        id: new Date().getTime(),
        descripcion: itemDescripcion.toUpperCase(),
        cantidad: cantNum,
        precio: precioNum,
        subtotal: subtotal
      }
    ]);
    setItemDescripcion('');
    setItemCantidad('');
    setItemPrecio('');
  };

  // 2. ¡LÓGICA DE GUARDADO CORREGIDA!
  const handleSaveVenta = async () => {
    if (itemsVenta.length === 0) {
      alert("No hay artículos en la venta.");
      return;
    }
    setIsSubmitting(true);

    let ventaDataParaTicket = null;
    let nuevoConsecutivoStr = "";
    let nuevaBaseParaEstado = 0; // Para actualizar el estado local

    try {
      const nuevaVentaRef = doc(collection(db, "ventasMenores"));

      await runTransaction(db, async (transaction) => {
        // --- 1. LEER TODO ---
        const consecRef = doc(db, "configuracion", "consecutivos");
        const cajaRef = doc(db, "configuracion", "caja");
        const [consecDoc, cajaDoc] = await Promise.all([
          transaction.get(consecRef),
          transaction.get(cajaRef)
        ]);
        if (!consecDoc.exists()) throw new Error("Consecutivos no encontrados");
        if (!cajaDoc.exists()) throw new Error("Caja no encontrada");

        // --- 2. CALCULAR ---
        const ultimoNum = consecDoc.data().ventasMenores;
        const nuevoNum = ultimoNum + 1;
        nuevoConsecutivoStr = formatConsecutivo(nuevoNum, "FAVMI");
        
        const baseActual = cajaDoc.data().baseActual;
        const nuevaBase = baseActual + totalVenta; // ¡SUMAMOS A LA BASE!
        nuevaBaseParaEstado = nuevaBase; // Guardamos para React
        
        const ventaData = {
          consecutivo: nuevoConsecutivoStr,
          cliente: nombreCliente.toUpperCase() || 'PARTICULAR',
          items: itemsVenta,
          total: totalVenta,
          fecha: Timestamp.now(),
          usuario: userProfile?.nombre || 'SISTEMA'
        };
        ventaDataParaTicket = ventaData;

        // --- 3. ESCRIBIR TODO ---
        transaction.set(nuevaVentaRef, ventaData);
        transaction.update(consecRef, { ventasMenores: nuevoNum });
        transaction.update(cajaRef, { baseActual: nuevaBase }); // ¡SOLO SE SUMA AQUÍ!
      });

      // --- 4. TRANSACCIÓN EXITOSA ---
      
      // 3. ¡EL ARREGLO!
      //    Ya no llamamos a 'sumarALaBase'.
      //    Actualizamos el estado local de React con 'setBase'.
      setBase(nuevaBaseParaEstado);

      setVentaReciente(ventaDataParaTicket);
      setNombreCliente('');

    } catch (error) {
      console.error("Error al guardar la venta: ", error);
      alert(`Error al guardar: ${error.message}`);
    }
    setIsSubmitting(false);
  };

  // --- Lógica de Impresión/Descarga (sin cambios) ---
  const handleImprimir = () => {
    if (!ventaReciente) return;
    const textoTicket = generarTextoTicketVentaMenor(ventaReciente, userProfile);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>Ticket ${ventaReciente.consecutivo}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; font-size: 10px; width: 80mm; }
            @page { margin: 2mm; size: 80mm auto; }
          </style>
        </head>
        <body>
          <pre>${textoTicket}</pre>
          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => window.close();
              window.onfocus = () => setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();

    const checkWindowClosed = setInterval(() => {
      if (printWindow.closed) {
        clearInterval(checkWindowClosed);
        handleDescargarYLlimpiar();
      }
    }, 500);
  };
  
  const handleRegistrarNuevaVenta = () => {
    if (!ventaReciente) return;
    handleDescargarYLlimpiar();
  };

  const handleDescargarYLlimpiar = () => {
    if (!ventaReciente) return;
    
    const textoTicket = generarTextoTicketVentaMenor(ventaReciente, userProfile);
    descargarTxt(textoTicket, ventaReciente.consecutivo);
    
    setItemsVenta([]);
    setTotalVenta(0);
    setNombreCliente('');
    setVentaReciente(null);
  };
  
  // --- RENDERIZADO (Sin cambios) ---
  return (
    <div className="pagina-ventas-menores">
      <h1>Registro de Venta Menor (a Particular)</h1>
      <div style={{textAlign: 'center', fontSize: '18px', marginBottom: '10px'}}>
        Base actual: <strong>${base.toLocaleString('es-CO')}</strong>
      </div>
      
      <div className="layout-ventas-menores">
        
        {/* --- FORMULARIO --- */}
        <div className="formulario-venta-menor">
          <h2>Datos de la Venta</h2>
          <div className="form-grupo">
            <label htmlFor="cliente">Nombre Cliente (Opcional):</label>
            <input 
              id="cliente" 
              type="text"
              value={nombreCliente}
              onChange={(e) => setNombreCliente(e.target.value.toUpperCase())}
              disabled={ventaReciente}
            />
          </div>
          <hr />
          <h3>Material</h3>
          <div className="form-grupo">
            <label htmlFor="itemDescripcion">Descripción:</label>
            <input 
              id="itemDescripcion" 
              type="text"
              value={itemDescripcion}
              onChange={(e) => setItemDescripcion(e.target.value.toUpperCase())}
              disabled={ventaReciente}
            />
          </div>
          <div className="form-manual-item">
            <div className="form-grupo">
              <label htmlFor="itemCantidad">Cantidad:</label>
              <input 
                id="itemCantidad" 
                type="number"
                value={itemCantidad}
                onChange={(e) => setItemCantidad(e.target.value)}
                disabled={ventaReciente}
              />
            </div>
            <div className="form-grupo">
              <label htmlFor="itemPrecio">Precio x (Und o Kg):</label>
              <input 
                id="itemPrecio" 
                type="number"
                value={itemPrecio}
                onChange={(e) => setItemPrecio(e.target.value)}
                disabled={ventaReciente}
              />
            </div>
          </div>
          <button 
            type="button" 
            onClick={handleAddItem} 
            className="btn-anadir-item-menor"
            disabled={ventaReciente}
          >
            + Añadir Item
          </button>
        </div>

        {/* --- PRE-FACTURA --- */}
        <div className="pre-factura">
          <h2>Items de la Venta</h2>
          <table className="pre-factura-tabla">
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Cant.</th>
                <th>Precio</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {(ventaReciente ? ventaReciente.items : itemsVenta).length === 0 ? (
                <tr>
                  <td colSpan="4" style={{textAlign: 'center'}}>Añade artículos manuales...</td>
                </tr>
              ) : (
                (ventaReciente ? ventaReciente.items : itemsVenta).map((item) => (
                  <tr key={item.id}>
                    <td>{item.descripcion}</td>
                    <td>{item.cantidad}</td>
                    <td>${item.precio}</td>
                    <td>${item.subtotal.toLocaleString('es-CO')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="total-venta-menor">
            Total: ${(ventaReciente ? ventaReciente.total : totalVenta).toLocaleString('es-CO')}
          </div>

          <div className="botones-accion">
            {ventaReciente ? (
              // --- VISTA POST-GUARDADO ---
              <>
                <p className="venta-exitosa">¡Venta {ventaReciente.consecutivo} guardada!</p>
                <button type="button" onClick={handleImprimir} className="btn-imprimir-ticket">
                  Imprimir Ticket
                </button>
                <button type="button" onClick={handleRegistrarNuevaVenta} className="btn-nueva-venta">
                  Registrar Nueva Venta (y Descargar TXT)
                </button>
              </>
            ) : (
              // --- VISTA ANTES DE GUARDAR ---
              <button 
                type="button" 
                onClick={handleSaveVenta} 
                className="btn-guardar-venta-menor"
                disabled={isSubmitting || itemsVenta.length === 0}
              >
                {isSubmitting ? "Guardando..." : "Guardar Venta"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaginaVentasMenores;