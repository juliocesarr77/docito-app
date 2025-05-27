// src/DepoimentosHome.js
import React, { useState, useEffect, useRef } from 'react';
import './DepoimentosHome.css';

const DepoimentosHome = () => {
  const [depoimentos, setDepoimentos] = useState([]);
  const containerRef = useRef(null);
  const carouselRef = useRef(null);
  const animationFrameRef = useRef(null);
  const currentPositionRef = useRef(0);
  const speed = 1;

  useEffect(() => {
    const buscarDepoimentosAprovados = async () => {
      try {
        const response = await fetch('/api/depoimentos/aprovados');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // Duplicamos os depoimentos para criar a ilusão de loop infinito
        setDepoimentos([...data, ...data]);
      } catch (e) {
        console.error("Erro ao buscar depoimentos:", e);
      }
    };

    buscarDepoimentosAprovados();
  }, []);

  useEffect(() => {
    const animateCarousel = () => {
      if (carouselRef.current && containerRef.current && depoimentos.length > 0) {
        const containerWidth = containerRef.current.offsetWidth;
        const carouselWidth = carouselRef.current.offsetWidth;
        const singleDepoimentWidth = 320; // Largura mínima + margem

        if (carouselWidth > containerWidth) {
          const step = () => {
            currentPositionRef.current += speed;
            // Quando chegar ao final da primeira "metade" dos depoimentos duplicados,
            // volta instantaneamente para o início da segunda "metade" (que é visualmente igual)
            if (currentPositionRef.current > depoimentos.length / 2 * singleDepoimentWidth) {
              currentPositionRef.current = 0;
            }
            carouselRef.current.style.transform = `translateX(-${currentPositionRef.current}px)`;
            animationFrameRef.current = requestAnimationFrame(step);
          };

          animationFrameRef.current = requestAnimationFrame(step);
        }
      }
    };

    const timeoutId = setTimeout(animateCarousel, 100);

    return () => {
      clearTimeout(timeoutId);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [depoimentos]);

  return (
    <div className="depoimentos-home" ref={containerRef} style={{ overflow: 'hidden' }}>
      <h2>O que nossos clientes dizem:</h2>
      <div className="depoimentos-carousel-container" ref={carouselRef} style={{ width: '10000px' }}>
        {depoimentos.map((depoimento) => (
          <div key={depoimento.id} className="depoimento-item">
            <p className="nome-publico">{depoimento.nome_publico} disse:</p>
            <p className="texto-depoimento">"{depoimento.depoimento}"</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DepoimentosHome;