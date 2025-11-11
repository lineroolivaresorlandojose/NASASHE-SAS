// src/components/GraficaBarras.jsx

import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// 1. Registramos los "módulos" de Chart.js que vamos a usar
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function GraficaBarras({ chartData, titulo }) {
  
  // 2. Opciones de la gráfica
  const options = {
    responsive: true,
    maintainAspectRatio: false, // Permite que se ajuste al contenedor
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: titulo, // Título que le pasaremos
        font: {
          size: 18
        }
      },
    },
  };

  return <Bar options={options} data={chartData} />;
}

export default GraficaBarras;