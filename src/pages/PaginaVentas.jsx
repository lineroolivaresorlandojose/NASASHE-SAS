// src/pages/PaginaVentas.jsx

import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  getDocs, 
  writeBatch, 
  doc,
  Timestamp,
  runTransaction 
} from 'firebase/firestore';
import { useCaja } from '../context/CajaContext';
import './PaginaVentas.css'; // ¡CSS de Ventas!
// ¡Importamos la NUEVA función de ticket!
import { generarTextoTicketVenta } from '../utils/generarTickets'; 

const formatConsecutivo = (num, prefix) => {
  return `${prefix}${String(num).padStart(5, '0')}`;
};

// Función de Descarga
const descargarTxt = (contenido, nombreArchivo) => {
  const element = document.createElement("a");
  const file = new Blob([contenido], {type: 'text/plain;charset=utf-8'});
  element.href = URL.createObjectURL(file);
  element.download = `${nombreArchivo}.txt`;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

function PaginaVentas() {
  const { userProfile, base } = useCaja(); // Traemos la base (solo para verla)
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proveedores, setProveedores] = useState([]);
  const [articulos, setArticulos] = useState([]);

  // --- Estados del formulario ---
  const [proveedorSeleccionadoId, setProveedorSeleccionadoId] = useState('');
  const [articuloSeleccionadoId, setArticuloSeleccionadoId] = useState('');
  const [cantidad, setCantidad] = useState('');
  
  // --- Estados de la Venta ---
  const [itemsVenta, setItemsVenta] = useState([]);
  const [totalVenta, setTotalVenta] = useState(0);
  
  // --- Estado Post-Guardado ---
  const [ventaReciente, setVentaReciente] = useState(null); 

  // --- Cargar Proveedores y Artículos ---
  const fetchDatosMaestros = async () => {
    setLoading(true);
    try {
      const proveedoresSnap = await getDocs(collection(db, "proveedores"));
      const proveedoresLista = proveedoresSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProveedores(proveedoresLista);

      const articulosSnap = await getDocs(collection(db, "articulos"));
      const articulosLista = articulosSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setArticulos(articulosLista);
    } catch (error) {
      console.error("Error al cargar datos: ", error);
    }
    setLoading(false);
  };
  
  useEffect(() => {
    fetchDatosMaestros();
  }, []);

  // --- Calcular Total ---
  useEffect(() => {
    let nuevoTotal = 0;
    itemsVenta.forEach(item => {
      nuevoTotal += item.subtotal;
    });
    setTotalVenta(nuevoTotal);
  }, [itemsVenta]);

  
  // --- Añadir Item (con validación de stock) ---
  const handleAddItem = () => {
    if (!articuloSeleccionadoId || !cantidad || Number(cantidad) <= 0) {
      alert("Seleccione un artículo y una cantidad (peso) válida.");
      return;
    }
    const articulo = articulos.find(a => a.id === articuloSeleccionadoId);
    if (!articulo) {
      alert("Error: Artículo no encontrado.");
      return;
    }
    const cantNum = Number(cantidad);
    const stockActual = articulo.stock || 0;
    
    const itemExistente = itemsVenta.find(item => item.articuloId === articulo.id);
    const cantidadEnLista = itemExistente ? itemExistente.cantidad : 0;

    // ¡Validación de Stock!
    if ((cantNum + cantidadEnLista) > stockActual) {
      alert(`¡No hay stock suficiente! Stock actual: ${stockActual}, Quieres vender: ${cantNum + cantidadEnLista}`);
      return;
    }
    
    const subtotal = cantNum * articulo.precioVenta; // ¡Usamos precioVenta!
    
    if (itemExistente) {
      setItemsVenta(prevState => 
        prevState.map(item => 
          item.articuloId === articulo.id
            ? { ...item, cantidad: item.cantidad + cantNum, subtotal: item.subtotal + subtotal }
            : item
        )
      );
    } else {
      setItemsVenta(prevState => [
        ...prevState,
        {
          articuloId: articulo.id,
          nombre: articulo.nombre,
          cantidad: cantNum,
          precioVenta: articulo.precioVenta, // ¡precioVenta!
          subtotal: subtotal
        }
      ]);
    }
    setArticuloSeleccionadoId('');
    setCantidad('');
  };

  // --- Guardar Venta (¡Lógica Transaccional!) ---
  const handleSaveVenta = async () => {
    if (itemsVenta.length === 0) {
      alert("No hay artículos en la venta.");
      return;
    }
    if (!proveedorSeleccionadoId) {
      alert("Debe seleccionar un Proveedor (Cliente de Venta).");
      return;
    }
    setIsSubmitting(true);

    let ventaDataParaTicket = null;
    let nuevoConsecutivoStr = "";

    try {
      const nuevaVentaRef = doc(collection(db, "ventas"));
      const proveedorObj = proveedores.find(p => p.id === proveedorSeleccionadoId);

      await runTransaction(db, async (transaction) => {
        // --- 1. LEER TODO ---
        const consecRef = doc(db, "configuracion", "consecutivos");
        const consecDoc = await transaction.get(consecRef);
        if (!consecDoc.exists()) throw new Error("Consecutivos no encontrados");
        
        const articulosRefs = itemsVenta.map(item => doc(db, "articulos", item.articuloId));
        const articulosDocs = await Promise.all(articulosRefs.map(ref => transaction.get(ref)));

        // --- 2. CALCULAR ---
        const ultimoNum = consecDoc.data().ventas; // <-- Consecutivo de VENTAS
        const nuevoNum = ultimoNum + 1;
        nuevoConsecutivoStr = formatConsecutivo(nuevoNum, "FAV"); // <-- Prefijo FAV
        
        const ventaData = {
          consecutivo: nuevoConsecutivoStr,
          proveedor: { // Guardamos los datos del cliente
            id: proveedorObj.id,
            nombre: proveedorObj.nombre,
            nit: proveedorObj.nit
          },
          items: itemsVenta,
          total: totalVenta,
          fecha: Timestamp.now(),
          usuario: userProfile?.nombre || 'SISTEMA'
        };
        ventaDataParaTicket = ventaData;

        // --- 3. ESCRIBIR TODO ---
        transaction.set(nuevaVentaRef, ventaData);
        transaction.update(consecRef, { ventas: nuevoNum }); // <-- Actualiza 'ventas'

        // ¡RESTAR el stock!
        articulosDocs.forEach((artDoc, index) => {
          if (!artDoc.exists()) throw new Error(`Artículo ${itemsVenta[index].nombre} no encontrado`);
          
          const stockActual = artDoc.data().stock || 0;
          const nuevoStock = stockActual - itemsVenta[index].cantidad;
          if (nuevoStock < 0) throw new Error(`Stock insuficiente para ${itemsVenta[index].nombre}`);
          
          transaction.update(artDoc.ref, { stock: nuevoStock });
        });
      });

      // --- 4. TRANSACCIÓN EXITOSA ---
      await fetchDatosMaestros(); // Refresca el stock en los dropdowns

      setVentaReciente(ventaDataParaTicket); 
      setProveedorSeleccionadoId('');
      // ¡No limpiamos itemsVenta aún!

    } catch (error) {
      console.error("Error al guardar la venta: ", error);
      alert(`Error al guardar: ${error.message}`);
    }
    setIsSubmitting(false);
  };

  // --- Lógica de Impresión/Descarga ---
  const handleImprimir = () => {
    if (!ventaReciente) return;
    const textoTicket = generarTextoTicketVenta(ventaReciente, userProfile);
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
    
    const textoTicket = generarTextoTicketVenta(ventaReciente, userProfile);
    descargarTxt(textoTicket, ventaReciente.consecutivo);
    
    setItemsVenta([]);
    setTotalVenta(0);
    setProveedorSeleccionadoId('');
    setVentaReciente(null);
  };
  

  if (loading) {
    return <p>Cargando datos maestros...</p>;
  }


  return (
    <div className="pagina-ventas">
      <h1>Registrar Nueva Venta (a Proveedor)</h1>
      <div style={{textAlign: 'center', fontSize: '18px', marginBottom: '10px'}}>
        Base actual: <strong>${base.toLocaleString('es-CO')}</strong>
      </div>
      
      <div className="layout-ventas">
        
        {/* --- FORMULARIO --- */}
        <div className="formulario-venta">
          <h2>Datos de la Venta</h2>
          <div className="form-grupo">
            <label htmlFor="proveedor">Cliente (Proveedor al que Vendes):</label>
            <select 
              id="proveedor" 
              value={proveedorSeleccionadoId}
              onChange={(e) => setProveedorSeleccionadoId(e.target.value)}
              disabled={ventaReciente}
            >
              <option value="">-- Seleccione un Cliente --</option>
              {proveedores.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} ({p.nit})</option>
              ))}
            </select>
          </div>
          <hr />
          <h3>Añadir Artículos</h3>
          <div className="form-grupo">
            <label htmlFor="articulo">Artículo:</label>
            <select 
              id="articulo" 
              value={articuloSeleccionadoId}
              onChange={(e) => setArticuloSeleccionadoId(e.target.value)}
              disabled={ventaReciente}
            >
              <option value="">-- Seleccione un Artículo --</option>
              {articulos.map(a => (
                <option key={a.id} value={a.id}>
                  {a.nombre} (${a.precioVenta}/kg) - Stock: {a.stock || 0}
                </option>
              ))}
            </select>
          </div>
          <div className="form-grupo">
            <label htmlFor="cantidad">Cantidad (Peso):</label>
            <input 
              id="cantidad" 
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              disabled={ventaReciente}
            />
          </div>
          <button 
            type="button" 
            onClick={handleAddItem} 
            className="btn-anadir-item-venta" // Botón verde
            disabled={ventaReciente}
          >
            Añadir Item a la Venta
          </button>
        </div>

        {/* --- PRE-FACTURA --- */}
        <div className="pre-factura">
          <h2>Items de la Venta</h2>
          <table className="pre-factura-tabla">
            <thead>
              <tr>
                <th>Artículo</th>
                <th>Cant.</th>
                <th>Precio Venta</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {(ventaReciente ? ventaReciente.items : itemsVenta).length === 0 ? (
                <tr>
                  <td colSpan="4" style={{textAlign: 'center'}}>Añade artículos...</td>
                </tr>
              ) : (
                (ventaReciente ? ventaReciente.items : itemsVenta).map((item, index) => (
                  <tr key={index}>
                    <td>{item.nombre}</td>
                    <td>{item.cantidad}</td>
                    <td>${item.precioVenta}</td>
                    <td>${item.subtotal.toLocaleString('es-CO')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="total-venta">
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
                  Registrar Nueva Venta
                </button>
              </>
            ) : (
              // --- VISTA ANTES DE GUARDAR ---
              <button 
                type="button" 
                onClick={handleSaveVenta} 
                className="btn-guardar-venta"
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

export default PaginaVentas;