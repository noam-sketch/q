import React, { useEffect, useState, useRef } from 'react';
import { UnifiedFBCService } from '../lib/browser_fbc';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  senderId: string;
  sender: string;
  avatar: string;
  timestamp: string;
  content: string;
  isUser: boolean;
}

const fbc = new UnifiedFBCService();

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const parseFbc = async () => {
    try {
      const size = await fbc.getSize();
      if (size === 0) return;
      
      const { content } = await fbc.read(0);
      const rawMessages = content.split('ץ');
      
      const parsed: ChatMessage[] = [];
      
      rawMessages.forEach((raw, index) => {
        const trimmed = raw.trim();
        if (!trimmed) return;
        
        const headerRegex = /^>\s*(@\d+)#([^#]+)#([^#]+)\s+#(\d+)\s+\[([^\]]+)\]/;
        const match = trimmed.match(headerRegex);
        
        if (match) {
            const senderId = match[1];
            const avatar = match[2];
            const timestampMs = parseInt(match[4], 10);
            const name = match[5];
            
            const headerEndIndex = trimmed.indexOf('\n');
            let messageContent = headerEndIndex !== -1 ? trimmed.substring(headerEndIndex + 1).trim() : '';
            
            // Clean up coloring codes for the UI display
            messageContent = messageContent.replace(/\x1b\[[0-9;]*m/g, '');

            if (messageContent) {
                parsed.push({
                    id: timestampMs.toString() + '-' + index.toString(),
                    senderId,
                    sender: name,
                    avatar,
                    timestamp: new Date(timestampMs).toLocaleTimeString(),
                    content: messageContent,
                    isUser: senderId === '@3'
                });
            }
        }
      });
      
      setMessages(parsed);
    } catch (e) {
      console.error('Error reading FBC:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      parseFbc();
      const interval = setInterval(parseFbc, 2000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  useEffect(() => {
      if (isOpen && messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
  }, [messages, isOpen]);

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      
      <div className={`sidebar-container ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>FBC Chat Log</h3>
          <button className="sidebar-close" onClick={onClose}>&times;</button>
        </div>
        
        <div className="sidebar-content">
          {messages.length === 0 ? (
              <div className="sidebar-empty">No FBC history found.</div>
          ) : (
              messages.map(msg => (
                <div key={msg.id} className={`chat-message ${msg.isUser ? 'user' : 'ai'}`}>
                  <div className="chat-header">
                    <span className="chat-avatar">{msg.avatar}</span>
                    <span className="chat-sender">{msg.sender}</span>
                    <span className="chat-time">{msg.timestamp}</span>
                  </div>
                  <div className="chat-body">
                    {msg.content.split('\n').map((line, i) => (
                        <p key={i}>{line}</p>
                    ))}
                  </div>
                </div>
              ))
          )}
          <div ref={messagesEndRef} style={{ height: '20px' }}></div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
