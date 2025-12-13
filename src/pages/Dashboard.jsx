// src/pages/Dashboard.jsx

import React from 'react';
import './Dashboard.css';
import ModuleButton from '../components/ModuleButton';
import { useCaja } from '../context/CajaContext';
import assetPath from '../utils/assetPath';

function Dashboard() {

  const { userProfile } = useCaja();
  const esAdmin = userProfile?.rol === 'admin';

  return (
    <div className="dashboard-container">
      
      <h1 className="dashboard-title">
        Bienvenido(a) a NASASHE. ¡Haz clic en algún módulo para empezar!
      </h1>
      
      <div className="dashboard-grid">
        
        {/* --- 3. BOTONES SOLO PARA ADMIN --- */}
        {esAdmin && (
          <>
            <ModuleButton 
              titulo="Artículos"
              descripcion="Gestionar inventario, precios y categorías."
              icono={assetPath('icons/Artículos.png')}
              to="/articulos" // <-- VERIFICA ESTA LÍNEA
            />
            
            <ModuleButton 
              titulo="Proveedores"
              descripcion="Administrar lista de proveedores y cuentas."
              icono={assetPath('icons/Proveedores.png')}
              to="/proveedores"
            />

            <ModuleButton
              titulo="Ventas"
              descripcion="Crear facturas de venta a proveedores."
              icono={assetPath('icons/Ventas (F2).png')}
              to="/ventas"
            />

            <ModuleButton
              titulo="Remisiones"
              descripcion="Emitir remisiones y generar PDF firmado."
              icono={assetPath('icons/Remisiones.png')}
              to="/remisiones"
            />

            <ModuleButton
              titulo="Usuarios"
              descripcion="Gestionar cuentas de empleados."
              icono={assetPath('icons/usuarios.png')}
              to="/usuarios"
            />

            <ModuleButton
              titulo="Configuración"
              descripcion="Restablecer consecutivos y ajustes generales."
              icono={assetPath('icons/CONFIG.png')}
              to="/configuracion"
            />
          </>
        )}
        
        {/* --- 4. BOTONES PARA TODOS --- */}
        <ModuleButton 
          titulo="Reportes"
          descripcion="Ver resúmenes de ventas, caja e inventario."
          icono={assetPath('icons/Reportes.png')}
          to="/reportes"
        />
        <ModuleButton 
          titulo="Compras"
          descripcion="Registrar compras a recicladores."
          icono={assetPath('icons/Compras.png')}
          to="/compras"
        />
        <ModuleButton 
          titulo="Gastos"
          descripcion="Registrar salidas de efectivo (ej. comida)."
          icono={assetPath('icons/gastos.png')}
          to="/gastos"
        />
        <ModuleButton 
          titulo="Venta Menor"
          descripcion="Registrar ventas a particulares (ej. tubos)."
          icono={assetPath('icons/ventas-menores.png')}
          to="/ventas-menores"
        />

      </div>
    </div>
  );
}


export default Dashboard;

