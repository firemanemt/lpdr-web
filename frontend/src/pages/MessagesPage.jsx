import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { messageApi } from '../services/api';
import { FiMessageSquare, FiChevronRight, FiArrowLeft, FiSend, FiImage, FiClock } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';

const petIcons = { dog: '🐕', cat: '🐈', horse: '🐴', bird: '🦜', rabbit: '🐇', reptile: '🦎', other: '🐾' };

export default function MessagesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  // If a caseId is in URL hash, open that chat directly
  const [activeChat, setActiveChat] = useState(null); // caseId
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat);
    }
  }, [activeChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const res = await messageApi.conversations();
      setConversations(res.data.conversations);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (caseId) => {
    setChatLoading(true);
    try {
      const res = await messageApi.list(caseId);
      setMessages(res.data.messages);
      // Mark as read
      messageApi.markRead(caseId).catch(() => {});
      // Refresh conversations to update unread counts
      loadConversations();
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setChatLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const res = await messageApi.send(activeChat, newMessage.trim());
      setMessages(prev => [...prev, res.data.message]);
      setNewMessage('');
      loadConversations(); // Update last message in list
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const activeConversation = conversations.find(c => c.caseId === activeChat);

  // Chat view
  if (activeChat) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 120px)' }}>
        {/* Chat Header */}
        <div style={{
          background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)',
          padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
          flexShrink: 0,
        }}>
          <button onClick={() => { setActiveChat(null); setMessages([]); }} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '0.25rem' }}>
            <FiArrowLeft size={20} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
              {activeConversation ? `${petIcons[activeConversation.petType] || '🐾'} ${activeConversation.petName}` : 'Chat'}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {activeConversation?.otherPerson
                ? `${activeConversation.otherPerson.firstName} ${activeConversation.otherPerson.lastName} · ${activeConversation.otherPerson.role === 'drone_pilot' ? 'Pilot' : 'Owner'}`
                : 'No pilot assigned yet'
              }
            </div>
          </div>
          <Link to={`/cases/${activeChat}`} style={{ fontSize: '0.7rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
            View Case
          </Link>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflow: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {chatLoading ? (
            <LoadingSpinner text="Loading messages..." />
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', fontSize: '0.85rem' }}>
              <FiMessageSquare size={32} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isMine = msg.sender_id === user.id || msg.sender?.id === user.id;
              const senderName = msg.sender ? `${msg.sender.firstName} ${msg.sender.lastName}` : 'Unknown';
              const showName = !isMine && (i === 0 || messages[i-1]?.sender_id !== msg.sender_id);

              return (
                <div key={msg.id || i}>
                  {showName && (
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: '0.15rem', paddingLeft: isMine ? '2rem' : '0.5rem', paddingRight: isMine ? '0.5rem' : '2rem' }}>
                      {senderName}
                    </div>
                  )}
                  <div style={{
                    display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start',
                  }}>
                    <div style={{
                      maxWidth: '80%', padding: '0.6rem 0.85rem',
                      borderRadius: isMine ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                      background: isMine ? 'var(--primary)' : 'var(--bg-elevated)',
                      color: isMine ? '#fff' : 'var(--text-primary)',
                      fontSize: '0.85rem', lineHeight: 1.5,
                      border: isMine ? 'none' : '1px solid var(--border-default)',
                    }}>
                      {msg.image_url && (
                        <img src={msg.image_url} alt="" style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '8px', marginBottom: msg.text ? '0.4rem' : 0 }} />
                      )}
                      {msg.text && <div>{msg.text}</div>}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.15rem',
                    textAlign: isMine ? 'right' : 'left',
                    paddingLeft: isMine ? 0 : '0.5rem',
                    paddingRight: isMine ? '0.5rem' : 0,
                  }}>
                    {formatTime(msg.created_at)}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} style={{
          display: 'flex', gap: '0.5rem', padding: '0.75rem 1rem',
          background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="form-input"
            style={{ flex: 1, marginBottom: 0 }}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="btn btn-primary"
            style={{ padding: '0.5rem 0.75rem', minWidth: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <FiSend size={18} />
          </button>
        </form>
      </div>
    );
  }

  // Conversations list view
  return (
    <div>
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', padding: '1rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
          MESSAGES
        </h2>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
          Chat with pet owners and pilots about your cases
        </p>
      </div>

      <div style={{ padding: '0.5rem 0' }}>
        {loading ? (
          <LoadingSpinner text="Loading conversations..." />
        ) : conversations.length === 0 ? (
          <div className="card" style={{ margin: '1rem' }}>
            <div className="empty-state">
              <div className="icon">💬</div>
              <h3>No conversations yet</h3>
              <p>When you accept a case or have a case assigned, your chats will appear here.</p>
            </div>
          </div>
        ) : (
          conversations.map(conv => (
            <button
              key={conv.caseId}
              onClick={() => setActiveChat(conv.caseId)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.85rem 1rem', background: 'none', border: 'none',
                borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer',
                color: 'var(--text-primary)', fontFamily: 'var(--font-body)', textAlign: 'left',
              }}
            >
              {/* Avatar */}
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                background: conv.unreadCount > 0 ? 'var(--primary-bg)' : 'var(--bg-secondary)',
                border: `1px solid ${conv.unreadCount > 0 ? 'rgba(4,107,210,0.3)' : 'var(--border-default)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem',
              }}>
                {petIcons[conv.petType] || '🐾'}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem' }}>
                  <div style={{ fontWeight: conv.unreadCount > 0 ? 700 : 600, fontSize: '0.9rem' }}>
                    {conv.petName}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                    {formatTime(conv.lastMessage?.createdAt || conv.lastActivity)}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>
                    {conv.otherPerson
                      ? <span>{conv.otherPerson.firstName} {conv.otherPerson.lastName} · </span>
                      : null
                    }
                    {conv.lastMessage?.text || (conv.lastMessage?.imageUrl ? '📷 Photo' : 'No messages yet')}
                  </div>
                  {conv.unreadCount > 0 && (
                    <div style={{
                      background: 'var(--primary)', color: '#fff', borderRadius: '10px',
                      fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.45rem',
                      minWidth: '18px', textAlign: 'center', flexShrink: 0,
                    }}>
                      {conv.unreadCount}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  <span style={{
                    textTransform: 'capitalize', fontWeight: 600,
                    color: conv.caseStatus === 'searching' ? 'var(--accent)' :
                           conv.caseStatus === 'found' ? 'var(--success)' :
                           conv.caseStatus === 'matched' ? 'var(--primary)' : 'var(--text-muted)',
                  }}>
                    {conv.caseStatus}
                  </span>
                </div>
              </div>

              <FiChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            </button>
          ))
        )}
      </div>
    </div>
  );
}
