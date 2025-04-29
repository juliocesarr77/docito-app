// Notification.js
import React, { useState, useEffect } from 'react';
import './Notification.css';

const Notification = ({ message, type, duration = 3000 }) => {
    const [isVisible, setIsVisible] = useState(false); // Inicialmente invisível

    useEffect(() => {
        if (message) {
            setIsVisible(true);
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, duration);
            return () => clearTimeout(timer); // Limpa o timer se o componente for desmontado
        } else {
            setIsVisible(false);
        }
    }, [message, duration]);

    useEffect(() => {
        if (message) {
            setIsVisible(true);
        }
    }, [message]);

    return isVisible && message ? (
        <div className={`notification-container show ${type}`}> {/* Adicione a classe 'show' aqui */}
            {message}
        </div>
    ) : null;
};

export default Notification;