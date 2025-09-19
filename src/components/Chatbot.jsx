import React, { useState, useEffect, useRef } from 'react';
import './Chatbot.css';
import { MessageCircle, X, Send, Clock, User, Bot } from 'lucide-react';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef(null);

  const API_URL = 'http://localhost:3001/api';
  const token = localStorage.getItem('authToken');

  useEffect(() => {
    if (isOpen) {
      loadChatHistory();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/chatbot/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.history.length > 0) {
          // Convertir historial a formato de mensajes
          const historyMessages = [];
          data.history.forEach(item => {
            historyMessages.push({
              id: `user-${item.id}`,
              type: 'user',
              content: item.message,
              timestamp: item.timestamp
            });
            historyMessages.push({
              id: `bot-${item.id}`,
              type: 'bot',
              content: item.response,
              timestamp: item.timestamp
            });
          });
          setMessages(historyMessages.reverse());
        }
      }
    } catch (error) {
      // Error cargando historial
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Agregar mensaje del usuario
    const newUserMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newUserMessage]);

    try {
      // Preparar historial de conversación para la IA
      const recentHistory = conversationHistory.slice(-10); // Últimas 10 interacciones
      
      const response = await fetch(`${API_URL}/chatbot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMessage,
          conversation_history: recentHistory
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          // Agregar respuesta del bot
          const botMessage = {
            id: `bot-${Date.now()}`,
            type: 'bot',
            content: data.response,
            timestamp: data.timestamp
          };

          setMessages(prev => [...prev, botMessage]);

          // Actualizar historial de conversación
          setConversationHistory(prev => [
            ...prev,
            { role: 'user', content: userMessage },
            { role: 'assistant', content: data.response }
          ]);

          // Guardar conversación en el historial
          await saveConversation(userMessage, data.response);
        } else {
          throw new Error(data.message || 'Error en la respuesta del chatbot');
        }
      } else {
        throw new Error('Error en la petición al chatbot');
      }
    } catch (error) {
      // Mostrar mensaje de error
      const errorMessage = {
        id: `error-${Date.now()}`,
        type: 'bot',
        content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta nuevamente.',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConversation = async (message, response) => {
    try {
      await fetch(`${API_URL}/chatbot/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message,
          response
        })
      });
    } catch (error) {
      // Error guardando conversación
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleChatbot = () => {
    if (isOpen) {
      // Cerrar con animación
      setIsClosing(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsClosing(false);
        setShowHistory(false);
      }, 300);
    } else {
      // Abrir
      setIsOpen(true);
    }
  };

  const clearHistory = () => {
    setMessages([]);
    setConversationHistory([]);
  };

  return (
    <>
      {/* Botón flotante del chatbot */}
      <button
        className={`chatbot-toggle ${isOpen ? 'open' : ''}`}
        onClick={toggleChatbot}
        title="Asistente Médico - Enfermedades Comunes"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Ventana del chatbot */}
      {isOpen && (
        <div className={`chatbot-container ${isClosing ? 'closing' : ''}`}>
          <div className="chatbot-header">
            <div className="chatbot-title">
              <Bot size={20} />
              <span>Asistente Médico</span>
            </div>
            <div className="chatbot-controls">
              <button
                className="chatbot-btn"
                onClick={() => setShowHistory(!showHistory)}
                title="Ver historial"
              >
                <Clock size={16} />
              </button>
              <button
                className="chatbot-btn"
                onClick={clearHistory}
                title="Limpiar chat"
              >
                🗑️
              </button>
            </div>
          </div>

          {showHistory ? (
            <div className="chatbot-history">
              <h4>Historial de Conversaciones</h4>
              <div className="history-list">
                {messages.length > 0 ? (
                  messages.map((message, index) => (
                    <div key={message.id} className={`history-item ${message.type}`}>
                      <div className="history-content">
                        <strong>{message.type === 'user' ? 'Tú' : 'Asistente'}:</strong>
                        <p>{message.content}</p>
                        <small>{formatTime(message.timestamp)}</small>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-history">No hay conversaciones anteriores</p>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="chatbot-messages">
                {messages.length === 0 && (
                  <div className="welcome-message">
                    <Bot size={32} />
                    <h4>¡Hola! 👋</h4>
                    <p>Soy tu asistente médico especializado en enfermedades comunes. Puedo ayudarte con:</p>
                    <ul>
                      <li>Información sobre enfermedades comunes</li>
                      <li>Síntomas y causas</li>
                      <li>Tratamientos básicos</li>
                      <li>Medidas preventivas</li>
                      <li>Cuándo consultar a un médico</li>
                    </ul>
                    <p className="medical-disclaimer">
                      ⚠️ <strong>Importante:</strong> Esta información es solo educativa y no reemplaza la consulta médica profesional.
                    </p>
                  </div>
                )}

                {messages.map((message) => (
                  <div key={message.id} className={`message ${message.type}`}>
                    <div className="message-avatar">
                      {message.type === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className="message-content">
                      <div className="message-text">{message.content}</div>
                      <div className="message-time">{formatTime(message.timestamp)}</div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="message bot">
                    <div className="message-avatar">
                      <Bot size={16} />
                    </div>
                    <div className="message-content">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <div className="chatbot-input">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe tu mensaje..."
                  disabled={isLoading}
                  rows={1}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="send-button"
                >
                  <Send size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default Chatbot;
