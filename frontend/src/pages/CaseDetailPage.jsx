import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { caseApi, messageApi } from '../services/api';
import { connectSocket, joinCaseRoom, leaveCaseRoom, getSocket } from '../services/socket';
import { notifyNewMessage, notifyCaseUpdate, playNotificationSound, requestNotificationPermission } from '../services/notificationService';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { FiSend, FiPhone, FiMapPin, FiClock, FiStar, FiCheckCircle, FiAlertCircle, FiArrowLeft, FiChevronRight, FiMessageSquare } from 'react-icons/fi';

const statusConfig = {
  submitted: { label: 'Submitted', color: 'badge-blue', icon: '📋' },
  notifying: { label: 'Finding Pilot', color: 'badge-yellow', icon: '🔍' },
  matched: { label: 'Pilot Assigned', color: 'badge-green', icon: '✅' },
  searching: { label: 'In Search', color: 'badge-purple', icon: '🛸' },
  found: { label: 'Found!', color: 'badge-green', icon: '🎉' },
  completed: { label: 'Completed', color: 'badge-gray', icon: '📄' },
  reviewed: { label: 'Reviewed', color: 'badge-gray', icon: '⭐' },
  cancelled: { label: 'Cancelled', color: 'badge-red', icon: '❌' },
  escalated: { label: 'Escalated', color: 'badge-red', icon: '🚨' },
};

export default function CaseDetailPage() {
  const { id } = useParams();
  const { user, isPetOwner, isDronePilot } = useAuth();
  const [caseData, setCaseData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatImage, setChatImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [activeTab, setActiveTab] = useState('info');
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadCase();
    const socket = connectSocket();
    socket.on('message:new', (msg) => {
      setMessages(prev => [...prev, msg]);
      // Notify if message is from the other person
      if (msg.sender_id !== user?.id) {
        const senderName = caseData?.pilot && msg.sender_id === caseData.pilot.id 
          ? `${caseData.pilot.firstName}` 
          : caseData?.owner ? `${caseData.owner.firstName}` : 'Someone';
        notifyNewMessage(senderName, msg.text || '📷 Photo');
      }
    });
    socket.on('case:updated', (data) => { 
      if (data.caseId === id) {
        loadCase();
        if (data.status) {
          notifyCaseUpdate(data.status, caseData?.pet_name || 'Pet');
        }
      }
    });
    return () => { leaveCaseRoom(id); };
  }, [id]);

  useEffect(() => { if (caseData) joinCaseRoom(id); requestNotificationPermission(); }, [caseData]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadCase = async () => {
    try {
      const res = await caseApi.getById(id);
      setCaseData(res.data.case);
      setMessages(res.data.case.messages || []);
    } catch (err) {
      toast.error('Failed to load case');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && !chatImage) return;
    const text = newMessage;
    const image = chatImage;
    setNewMessage('');
    setChatImage(null);
    try {
      const res = await messageApi.send(id, text, image);
      const sentMsg = res.data.message;
      setMessages(prev => [...prev, sentMsg]);
      const socket = getSocket();
      if (socket) socket.emit('message:send', { caseId: id, message: sentMsg });
    } catch (err) {
      toast.error('Failed to send message');
      setNewMessage(text);
      setChatImage(image);
    }
  };

  const handleChatImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setChatImage(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const updateStatus = async (status, notes) => {
    try {
      await caseApi.updateStatus(id, status, notes);
      toast.success(`Status updated`);
      loadCase();
      const socket = getSocket();
      if (socket) socket.emit('case:status', { caseId: id, status });
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const submitReview = async () => {
    try {
      await caseApi.review(id, reviewRating, reviewComment);
      toast.success('Review submitted!');
      setShowReview(false);
      loadCase();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit review');
    }
  };

  if (loading) return <LoadingSpinner text="Loading case..." />;
  if (!caseData) return <LoadingSpinner text="Case not found" />;

  const cfg = statusConfig[caseData.status] || statusConfig.submitted;

  return (
    <div>
      {/* Header */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', padding: '0.75rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }}>
            <FiArrowLeft size={20} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {cfg.icon} {caseData.pet_name}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Case #{caseData.id?.slice(0, 8)} · {caseData.pet_breed || caseData.pet_type}
            </div>
          </div>
          <span className={`badge ${cfg.color}`}>{cfg.label}</span>
        </div>
      </div>

      {/* Status Bar */}
      <div style={{ background: 'var(--bg-primary)', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {['submitted', 'notifying', 'matched', 'searching', 'found', 'completed'].map((s, i) => {
            const sc = statusConfig[s];
            const currentIdx = ['submitted', 'notifying', 'matched', 'searching', 'found', 'completed'].indexOf(caseData.status);
            const isActive = i === currentIdx;
            const isDone = i < currentIdx;
            return (
              <div key={s} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{
                  height: '3px', borderRadius: '2px', marginBottom: '0.3rem',
                  background: isDone ? 'var(--success)' : isActive ? 'var(--primary)' : 'var(--border-subtle)',
                  boxShadow: isActive ? '0 0 8px var(--primary-glow)' : 'none',
                }} />
                <div style={{ fontSize: '0.55rem', color: isDone ? 'var(--success)' : isActive ? 'var(--primary)' : 'var(--text-muted)', fontWeight: isActive ? 700 : 400, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {sc.label.split(' ')[0]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: 'var(--bg-primary)', padding: '0 1rem' }}>
        <div style={{ display: 'flex', gap: '0' }}>
          {[
            { id: 'info', label: 'Info', icon: <FiAlertCircle size={14} /> },
            { id: 'chat', label: 'Chat', icon: <FiMessageSquare size={14} /> },
            { id: 'actions', label: 'Actions', icon: <FiStar size={14} /> },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`tab ${activeTab === tab.id ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '1rem' }}>
        {activeTab === 'info' && (
          <div className="fade-in">
            {/* Case Info */}
            <div className="card" style={{ marginBottom: '0.75rem' }}>
              {/* Photos */}
              {caseData.photos && caseData.photos.length > 0 && (
                <div style={{ display: 'flex', gap: '0.4rem', padding: '0.75rem 1rem 0', overflowX: 'auto' }}>
                  {caseData.photos.map((photo, i) => (
                    <div key={photo.id || i} style={{
                      width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden',
                      border: '1px solid var(--border-subtle)', flexShrink: 0, cursor: 'pointer',
                    }} onClick={() => window.open(photo.url, '_blank')}>
                      <img src={photo.url} alt={`Photo ${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              )}
              <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {[
                  { label: 'Pet Name', value: caseData.pet_name },
                  { label: 'Type', value: caseData.pet_type, cap: true },
                  { label: 'Breed', value: caseData.pet_breed },
                  { label: 'Color', value: caseData.pet_color },
                  { label: 'Last Seen', value: caseData.last_seen_address, full: true },
                  { label: 'Date', value: new Date(caseData.last_seen_date).toLocaleString(), full: true },
                ].map((item, i) => (
                  <div key={i} style={{ gridColumn: item.full ? '1 / -1' : 'auto' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: item.cap ? 'capitalize' : 'none' }}>{item.value || '—'}</div>
                  </div>
                ))}
              </div>
            </div>

            {caseData.circumstances && (
              <div className="card" style={{ borderLeft: '3px solid var(--primary)' }}>
                <div style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>Circumstances</div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{caseData.circumstances}</p>
                </div>
              </div>
            )}

            {/* Timeline */}
            {caseData.timeline && caseData.timeline.length > 0 && (
              <div style={{ marginTop: '0.75rem' }}>
                <div className="section-title"><FiClock size={14} /> Timeline</div>
                <div className="timeline">
                  {caseData.timeline.map((event, i) => (
                    <div key={event.id} className={`timeline-item ${i === 0 ? 'active' : 'completed'} fade-in`}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{event.description}</div>
                      <div className="time">{new Date(event.created_at).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="fade-in">
            {(caseData.pilot_id || isPetOwner) ? (
              <div className="chat-container" style={{ height: 'calc(100vh - 320px)' }}>
                <div className="chat-messages">
                  {messages.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', fontSize: '0.85rem' }}>
                      No messages yet. Start the conversation!
                    </div>
                  )}
                  {messages.map((msg, i) => {
                    const sent = msg.sender_id === user?.id;
                    const senderName = sent 
                      ? 'You' 
                      : (caseData.pilot && msg.sender_id === caseData.pilot.id 
                        ? `${caseData.pilot.firstName} ${caseData.pilot.lastName}`
                        : (caseData.owner && msg.sender_id === caseData.owner.id
                          ? `${caseData.owner.firstName} ${caseData.owner.lastName}`
                          : 'Other'));
                    return (
                      <div key={msg.id || i} className={`chat-message ${sent ? 'sent' : 'received'} fade-in`}>
                        {!sent && <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '0.2rem' }}>{senderName}</div>}
                        {msg.image_url && (
                          <div style={{ marginBottom: msg.text ? '0.4rem' : 0 }}>
                            <img src={msg.image_url} alt="Shared image" style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }} />
                          </div>
                        )}
                        {msg.text && <div>{msg.text}</div>}
                        <div className="time">{new Date(msg.created_at).toLocaleTimeString()}</div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
                <div className="chat-input">
                  {chatImage && (
                    <div style={{ position: 'relative', padding: '0.25rem' }}>
                      <img src={chatImage} alt="Upload" style={{ height: '40px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }} />
                      <button onClick={() => setChatImage(null)} style={{
                        position: 'absolute', top: 0, right: 0, width: '18px', height: '18px',
                        borderRadius: '50%', background: 'var(--danger)', color: 'white', border: 'none',
                        fontSize: '0.6rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>✕</button>
                    </div>
                  )}
                  <label style={{ cursor: 'pointer', color: 'var(--text-muted)', padding: '0 0.5rem' }}>
                    <input type="file" accept="image/*" onChange={handleChatImageUpload} style={{ display: 'none' }} />
                    📷
                  </label>
                  <input value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={handleKeyDown} placeholder="Type a message..." disabled={!caseData.pilot_id && isPetOwner} />
                  <button onClick={sendMessage} disabled={!newMessage.trim() && !chatImage}><FiSend size={16} /></button>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="icon">💬</div>
                <h3>Chat unavailable</h3>
                <p>Chat will be available once a pilot is assigned.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Assigned Pilot */}
            <div className="card">
              <div style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
                  {isPetOwner ? 'Assigned Pilot' : 'Pet Owner'}
                </div>
                {caseData.pilot ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--primary-bg)', border: '1px solid rgba(4,107,210,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'var(--font-display)' }}>
                      {caseData.pilot.firstName?.[0]}{caseData.pilot.lastName?.[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{caseData.pilot.firstName} {caseData.pilot.lastName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Drone Pilot</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '0.75rem' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>🔍</div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {caseData.status === 'notifying' ? 'Searching for a pilot...' : 'No pilot assigned yet'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {isDronePilot && caseData.status === 'matched' && (
              <button onClick={() => updateStatus('searching', 'Starting search')} className="btn btn-primary" style={{ width: '100%' }}>
                <FiMapPin size={16} /> Launch Search
              </button>
            )}
            {isDronePilot && caseData.status === 'searching' && (
              <button onClick={() => updateStatus('found', 'Pet found!')} className="btn btn-accent" style={{ width: '100%' }}>
                <FiStar size={16} /> Mark as Found!
              </button>
            )}
            {isDronePilot && caseData.status === 'found' && (
              <button onClick={() => updateStatus('completed')} className="btn btn-primary" style={{ width: '100%' }}>
                <FiCheckCircle size={16} /> Complete Case
              </button>
            )}
            {isPetOwner && caseData.status === 'found' && !showReview && (
              <button onClick={() => setShowReview(true)} className="btn btn-outline" style={{ width: '100%' }}>
                <FiStar size={16} /> Leave Review
              </button>
            )}
            {isPetOwner && ['submitted', 'notifying', 'matched'].includes(caseData.status) && (
              <button onClick={() => updateStatus('cancelled', 'Cancelled by owner')} className="btn btn-ghost" style={{ width: '100%', color: 'var(--danger)' }}>
                Cancel Case
              </button>
            )}

            {/* Review Form */}
            {showReview && (
              <div className="card">
                <div style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Rate your experience</div>
                  <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.75rem' }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} onClick={() => setReviewRating(n)} style={{ fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', filter: n <= reviewRating ? 'none' : 'grayscale(1)', opacity: n <= reviewRating ? 1 : 0.3 }}>⭐</button>
                    ))}
                  </div>
                  <textarea className="form-textarea" value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder="Share your experience..." rows={2} style={{ marginBottom: '0.5rem' }} />
                  <button onClick={submitReview} className="btn btn-primary btn-sm" style={{ width: '100%' }}>Submit Review</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
