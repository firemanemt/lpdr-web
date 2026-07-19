import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { caseApi, messageApi } from '../services/api';
import { connectSocket, joinCaseRoom, leaveCaseRoom, getSocket } from '../services/socket';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { FiSend, FiPhone, FiMapPin, FiClock, FiStar, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

const statusConfig = {
  submitted: { label: 'Submitted', color: 'badge-blue', icon: '📋' },
  notifying: { label: 'Finding a Pilot', color: 'badge-yellow', icon: '🔍' },
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
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadCase();
    const socket = connectSocket();
    
    socket.on('message:new', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('case:updated', (data) => {
      if (data.caseId === id) loadCase();
    });

    return () => {
      leaveCaseRoom(id);
    };
  }, [id]);

  useEffect(() => {
    if (caseData) {
      joinCaseRoom(id);
    }
  }, [caseData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    if (!newMessage.trim()) return;
    const text = newMessage;
    setNewMessage('');
    try {
      const res = await messageApi.send(id, text);
      const sentMsg = res.data.message;
      setMessages(prev => [...prev, sentMsg]);
      
      // Emit via WebSocket
      const socket = getSocket();
      if (socket) {
        socket.emit('message:send', { caseId: id, message: sentMsg });
      }
    } catch (err) {
      toast.error('Failed to send message');
      setNewMessage(text);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const updateStatus = async (status, notes) => {
    try {
      await caseApi.updateStatus(id, status, notes);
      toast.success(`Status updated to ${status}`);
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
      toast.success('Review submitted! Thank you.');
      setShowReview(false);
      loadCase();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit review');
    }
  };

  if (loading) return <LoadingSpinner text="Loading case details..." />;
  if (!caseData) return <LoadingSpinner text="Case not found" />;

  const cfg = statusConfig[caseData.status] || statusConfig.submitted;

  return (
    <div>
      <section className="page-header" style={{ padding: '1.5rem 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '0.25rem' }}>
                Case #{caseData.id?.slice(0, 8)}
              </div>
              <h1 style={{ fontSize: '1.8rem' }}>
                {cfg.icon} {caseData.pet_name}
              </h1>
              <p>
                {caseData.pet_breed} · {caseData.pet_type}
              </p>
            </div>
            <span className={`badge ${cfg.color}`} style={{ fontSize: '0.9rem', padding: '0.4rem 1rem' }}>
              {cfg.label}
            </span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="dashboard-grid">
            {/* Main Content */}
            <div>
              {/* Case Info Card */}
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-header">Case Information</div>
                <div className="card-body">
                  <div className="grid-2" style={{ marginBottom: 0 }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Pet Name</div>
                      <div style={{ fontWeight: 600 }}>{caseData.pet_name}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Type</div>
                      <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{caseData.pet_type}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Breed</div>
                      <div style={{ fontWeight: 600 }}>{caseData.pet_breed || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Color</div>
                      <div style={{ fontWeight: 600 }}>{caseData.pet_color || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Last Seen</div>
                      <div style={{ fontWeight: 600 }}>{caseData.last_seen_address}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Date</div>
                      <div style={{ fontWeight: 600 }}>{new Date(caseData.last_seen_date).toLocaleString()}</div>
                    </div>
                  </div>
                  
                  {caseData.circumstances && (
                    <div style={{ marginTop: '1rem' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Circumstances</div>
                      <div>{caseData.circumstances}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-header">Timeline</div>
                <div className="card-body">
                  <div className="timeline">
                    {(caseData.timeline || []).map((event, i) => (
                      <div key={event.id} className={`timeline-item ${i === 0 ? 'active' : 'completed'} fade-in`}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{event.description}</div>
                        <div className="time">{new Date(event.created_at).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chat */}
              {(caseData.pilot_id || isPetOwner) && (
                <div className="card">
                  <div className="card-header">
                    Chat
                    {caseData.pilot && (
                      <span style={{ fontWeight: 'normal', color: 'var(--gray-500)', fontSize: '0.85rem', marginLeft: '0.5rem' }}>
                        with {caseData.pilot.firstName} {caseData.pilot.lastName}
                      </span>
                    )}
                  </div>
                  <div className="chat-container" style={{ border: 'none', borderRadius: 0, borderTop: '1px solid var(--gray-200)', height: '400px' }}>
                    <div className="chat-messages">
                      {messages.length === 0 && (
                        <div style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '2rem' }}>
                          No messages yet. Start the conversation!
                        </div>
                      )}
                      {messages.map((msg, i) => {
                        const sent = msg.sender_id === user?.id;
                        const senderName = msg.sender?.firstName || (sent ? 'You' : 'Pilot');
                        return (
                          <div key={msg.id || i} className={`chat-message ${sent ? 'sent' : 'received'} fade-in`}>
                            {!sent && <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.2rem', opacity: 0.8 }}>{senderName}</div>}
                            <div>{msg.text}</div>
                            <div className="time">{new Date(msg.created_at).toLocaleTimeString()}</div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                    <div className="chat-input">
                      <input
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        disabled={!caseData.pilot_id && isPetOwner}
                      />
                      <button onClick={sendMessage} disabled={!newMessage.trim()}>
                        <FiSend size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div>
              {/* Owner / Pilot Info */}
              <div className="card" style={{ marginBottom: '1rem' }}>
                <div className="card-header">
                  {isPetOwner ? 'Your Pilot' : 'Pet Owner'}
                </div>
                <div className="card-body">
                  {caseData.pilot ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div className="user-avatar" style={{ width: '48px', height: '48px', fontSize: '1.1rem' }}>
                          {caseData.pilot.firstName?.[0]}{caseData.pilot.lastName?.[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{caseData.pilot.firstName} {caseData.pilot.lastName}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Drone Pilot</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--gray-600)' }}>
                        <FiPhone size={14} /> {caseData.pilot.phone || 'Not shared'}
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '1rem' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--gray-500)' }}>
                        {caseData.status === 'notifying' 
                          ? 'Looking for a pilot...' 
                          : 'No pilot assigned yet'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="card">
                <div className="card-header">Actions</div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {isPetOwner && caseData.status === 'searching' && (
                    <button onClick={() => navigate(`/map?caseId=${id}`)} className="btn btn-outline btn-sm" style={{ justifyContent: 'flex-start' }}>
                      <FiMapPin size={14} /> View on Map
                    </button>
                  )}

                  {isDronePilot && caseData.status === 'matched' && (
                    <button onClick={() => updateStatus('searching', 'Starting search now')} className="btn btn-primary btn-sm" style={{ justifyContent: 'flex-start' }}>
                      <FiMapPin size={14} /> Start Search
                    </button>
                  )}

                  {isDronePilot && caseData.status === 'searching' && (
                    <button onClick={() => updateStatus('found', 'Pet found via drone search!')} className="btn btn-accent btn-sm" style={{ justifyContent: 'flex-start' }}>
                      <FiStar size={14} /> Mark as Found!
                    </button>
                  )}

                  {isDronePilot && caseData.status === 'found' && (
                    <button onClick={() => updateStatus('completed')} className="btn btn-primary btn-sm" style={{ justifyContent: 'flex-start' }}>
                      <FiCheckCircle size={14} /> Complete Case
                    </button>
                  )}

                  {isPetOwner && caseData.status === 'found' && !showReview && (
                    <button onClick={() => setShowReview(true)} className="btn btn-outline btn-sm" style={{ justifyContent: 'flex-start' }}>
                      <FiStar size={14} /> Leave Review
                    </button>
                  )}

                  {isPetOwner && ['submitted', 'notifying', 'matched'].includes(caseData.status) && (
                    <button onClick={() => updateStatus('cancelled', 'Cancelled by owner')} className="btn btn-danger btn-sm" style={{ justifyContent: 'flex-start' }}>
                      Cancel Case
                    </button>
                  )}

                  {/* Review Form */}
                  {showReview && (
                    <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '1rem' }}>
                      <h4 style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}>Rate your experience</h4>
                      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.75rem' }}>
                        {[1, 2, 3, 4, 5].map(n => (
                          <button
                            key={n}
                            onClick={() => setReviewRating(n)}
                            style={{
                              fontSize: '1.5rem',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              filter: n <= reviewRating ? 'none' : 'grayscale(1)',
                              opacity: n <= reviewRating ? 1 : 0.3,
                            }}
                          >
                            ⭐
                          </button>
                        ))}
                      </div>
                      <textarea
                        className="form-textarea"
                        value={reviewComment}
                        onChange={e => setReviewComment(e.target.value)}
                        placeholder="Share your experience..."
                        rows={2}
                        style={{ marginBottom: '0.5rem' }}
                      />
                      <button onClick={submitReview} className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                        Submit Review
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
