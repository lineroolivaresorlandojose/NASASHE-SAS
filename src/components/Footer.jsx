// src/components/Footer.jsx

import React from 'react';
import './Footer.css';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useCaja } from '../context/CajaContext'; 

function Footer() {
  
  // 1. Traemos el nuevo 'userProfile'
  const { base, userProfile } = useCaja();
  
  const fechaActual = new Date().toLocaleDateString();

  const handleLogout = async () => {
    if (window.confirm("¿Estás seguro de que deseas cerrar sesión?")) {
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Error al cerrar sesión: ", error);
        alert("Error al cerrar sesión.");
      }
    }
  };

  // 2. Verificamos si el perfil ya cargó
  const nombreUsuario = userProfile ? userProfile.nombre : 'Cargando...';

  return (
    <footer className="footer-principal">
      
      <div>
        {/* 3. Mostramos el 'nombre' del perfil */}
        Usuario: **{nombreUsuario}** | 
        <a 
          href="#" 
          onClick={handleLogout} 
          style={{color: 'black', marginLeft: '40px', textDecoration: 'underline', cursor: 'pointer'}}
        >
          Salir
        </a>
      </div>

      <div style={{color: '#000000ff', fontWeight: 'bold'}}>
        Base en Caja: ${base.toLocaleString('es-CO')}
      </div>
      
      <div>
        {fechaActual}
      </div>

    </footer>
  );
}

export default Footer;