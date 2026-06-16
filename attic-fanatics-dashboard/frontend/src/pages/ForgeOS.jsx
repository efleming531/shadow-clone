import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MelvinGreeting, MelvinPeek } from '../components/Melvin';
import MarkdownMessage from '../components/MarkdownMessage';
import api from '../utils/api';

const MODELS = [
  { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6' },
  { id: 'claude-opus-4-8', label: 'Opus 4.8' },
  { id: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5' },
];

const MODES = [
  { id: 'chat', label: 'Chat' },
  { id: 'code', label: 'Code Mode' },
];

const STARTER_CARDS = [
  { icon: '🤖', title: 'Build a new agent', prompt: 'Help me design and build a new AI agent for The Forge.' },
  { icon: '💰', title: 'Update commission tiers', prompt: 'Walk me through updating the commission tier structure for AEVUM Roofing.' },
  { icon: '🗄️', title: 'Write a Prisma migration', prompt: 'Help me write a Prisma migration for a new feature.' },
  { icon: '🛣️', title: 'Design a new route', prompt: 'Help me design a new Express API route for the backend.' },
  { icon: '🐛', title: 'Debug a feature', prompt: 'I have a bug to debug. Let me describe what\'s happening.' },
  { icon: '🔍', title: 'Review the schema', prompt: 'Review the current Prisma schema and suggest improvements or flag any issues.' },
];

const NAV_ITEMS = [
  { id: 'pipeline', label: 'Pipeline', icon: '▣' },
  { id: 'jobs', label: 'Jobs', icon: '⚒' },
  { id: 'reps', label: 'Reps', icon: '👤' },
  { id: 'agents', label: 'Agents', icon: '🎧' },
  { id: 'schema', label: 'Schema', icon: '🗄' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
];

function ThinkingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '4px 0' }}>
      <span className="thinking-dot" />
      <span className="thinking-dot" />
      <span className="thinking-dot" />
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{
      display: 'flex',
      gap: 12,
      flexDirection: isUser ? 'row-reverse' : 'row',
      marginBottom: 20,
      alignItems: 'flex-start',
    }}>
      {/* Avatar */}
      <div style={{ flexShrink: 0, marginTop: 2 }}>
        {isUser ? (
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: '#7c3aed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.75rem', fontWeight: 700, color: '#fff',
          }}>
            E
          </div>
        ) : (
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: '#1e1e2e',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.7rem',
            border: '1px solid #a78bfa33',
          }}>
            M
          </div>
        )}
      </div>

      {/* Bubble */}
      <div style={{
        maxWidth: '75%',
        background: isUser ? '#1e1a2e' : '#161b22',
        border: `1px solid ${isUser ? '#a78bfa33' : '#21262d'}`,
        borderRadius: isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
        padding: '10px 14px',
      }}>
        {msg.thinking ? (
          <ThinkingDots />
        ) : isUser ? (
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#e2e8f0', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {msg.content}
          </p>
        ) : (
          <MarkdownMessage content={msg.content} />
        )}
      </div>
    </div>
  );
}

export default function ForgeOS() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [model, setModel] = useState(MODELS[0].id);
  const [mode, setMode] = useState(MODES[0].id);
  const [sending, setSending] = useState(false);
  const [melvinState, setMelvinState] = useState('idle'); // idle | forge | glitch
  const [tokenLimitHit, setTokenLimitHit] = useState(false);
  const [activeNav, setActiveNav] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    api.get('/dev-studio/conversations')
      .then(r => setConversations(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversation = useCallback((conv) => {
    setActiveConvId(conv.id);
    setMessages((conv.messages || []).map(m => ({
      role: m.role,
      content: m.content,
      id: m.id,
    })));
    setTokenLimitHit(false);
    setMelvinState('idle');
  }, []);

  const newChat = useCallback(() => {
    setActiveConvId(null);
    setMessages([]);
    setTokenLimitHit(false);
    setMelvinState('idle');
    textareaRef.current?.focus();
  }, []);

  const sendMessage = useCallback(async (text) => {
    const content = (text || input).trim();
    if (!content || sending) return;

    // Clear token limit state
    if (tokenLimitHit) setTokenLimitHit(false);

    setInput('');
    const userMsg = { role: 'user', content, id: Date.now() };
    setMessages(prev => [...prev, userMsg, { role: 'assistant', content: '', thinking: true, id: Date.now() + 1 }]);
    setSending(true);
    setMelvinState('forge');

    try {
      let convId = activeConvId;

      // Create conversation if first message
      if (!convId) {
        const title = content.slice(0, 40) + (content.length > 40 ? '…' : '');
        const conv = await api.post('/dev-studio/conversations', { title });
        convId = conv.data.id;
        setActiveConvId(convId);
        setConversations(prev => [conv.data, ...prev]);
      }

      // Build messages array for API (all prior + new user message)
      const allMessages = [
        ...messages.filter(m => !m.thinking).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content },
      ];

      const res = await api.post(`/dev-studio/conversations/${convId}/messages`, {
        messages: allMessages,
        model,
        mode,
      });

      const { content: assistantContent, stop_reason } = res.data;

      setMessages(prev => {
        const without = prev.filter(m => !m.thinking);
        return [...without, { role: 'assistant', content: assistantContent, id: Date.now() + 2 }];
      });

      // Refresh conversation list to update timestamps
      api.get('/dev-studio/conversations').then(r => setConversations(r.data)).catch(() => {});

      if (stop_reason === 'max_tokens') {
        setTokenLimitHit(true);
        setMelvinState('glitch');
      } else {
        setMelvinState('idle');
      }
    } catch (err) {
      setMessages(prev => {
        const without = prev.filter(m => !m.thinking);
        return [...without, {
          role: 'assistant',
          content: `Error: ${err.response?.data?.error || err.message}`,
          id: Date.now() + 3,
        }];
      });
      setMelvinState('idle');
    }

    setSending(false);
  }, [input, sending, activeConvId, messages, model, mode, tokenLimitHit]);

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const hasChat = messages.length > 0;

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0f1113', overflow: 'hidden' }}>

      {/* ── SIDEBAR ── */}
      <div style={{
        width: 216,
        flexShrink: 0,
        background: '#0d1117',
        borderRight: '1px solid #21262d',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Brand */}
        <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid #21262d', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f1f5f9' }}>
            The <span style={{ color: '#a78bfa' }}>Forge</span>
          </span>
        </div>

        {/* New Chat */}
        <div style={{ padding: '10px 10px 8px' }}>
          <button
            onClick={newChat}
            style={{
              width: '100%',
              background: '#7c3aed',
              border: 'none',
              borderRadius: 7,
              color: '#fff',
              padding: '8px 12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left',
              letterSpacing: '0.02em',
            }}
          >
            + New Chat
          </button>
        </div>

        {/* Nav items */}
        <div style={{ padding: '4px 6px' }}>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveNav(activeNav === item.id ? null : item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 8px',
                background: activeNav === item.id ? '#1e1a2e' : 'transparent',
                border: 'none',
                borderRadius: 6,
                color: activeNav === item.id ? '#a78bfa' : '#8b949e',
                fontSize: '0.8rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => { if (activeNav !== item.id) e.currentTarget.style.background = '#161b22'; }}
              onMouseLeave={e => { if (activeNav !== item.id) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ fontSize: '0.75rem', width: 14, textAlign: 'center' }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Projects / Conversations */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 6px 0' }}>
          <div style={{ padding: '4px 8px 6px', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#484f58' }}>
            Projects
          </div>
          <div style={{
            padding: '5px 8px',
            fontSize: '0.75rem',
            color: '#a78bfa',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <span>▾</span>
            <span>AEVUM Roofing</span>
          </div>
          {conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => loadConversation(conv)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '5px 8px 5px 20px',
                background: activeConvId === conv.id ? '#1e1a2e' : 'transparent',
                border: 'none',
                borderRadius: 5,
                color: activeConvId === conv.id ? '#e2e8f0' : '#8b949e',
                fontSize: '0.75rem',
                cursor: 'pointer',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                transition: 'all 0.1s',
              }}
              onMouseEnter={e => { if (activeConvId !== conv.id) e.currentTarget.style.background = '#161b22'; }}
              onMouseLeave={e => { if (activeConvId !== conv.id) e.currentTarget.style.background = 'transparent'; }}
              title={conv.title}
            >
              {conv.title}
            </button>
          ))}
        </div>

        {/* User badge */}
        <div style={{
          padding: '10px 12px',
          borderTop: '1px solid #21262d',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <div style={{
            width: 30, height: 30,
            borderRadius: '50%',
            background: '#7c3aed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8rem', fontWeight: 700, color: '#fff',
            flexShrink: 0,
          }}>
            {user?.name?.[0] || 'E'}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name?.split(' ')[0] || 'Eric'}
            </p>
            <p style={{ margin: 0, fontSize: '0.68rem', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {user?.role || 'Owner'}
            </p>
          </div>
          <button
            onClick={logout}
            style={{ background: 'none', border: 'none', color: '#484f58', cursor: 'pointer', fontSize: '0.75rem', padding: 0 }}
            title="Sign out"
          >
            ⇥
          </button>
        </div>
      </div>

      {/* ── MAIN AREA ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

        {/* Chat area or greeting */}
        <div style={{ flex: 1, overflowY: 'auto', padding: hasChat ? '24px 0' : 0, display: 'flex', flexDirection: 'column' }}>
          {!hasChat ? (
            /* Greeting screen */
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 24px 80px',
            }}>
              <MelvinGreeting style={{ marginBottom: 16 }} />
              <h2 style={{ margin: '0 0 8px', fontSize: '1.6rem', fontWeight: 700, color: '#f1f5f9' }}>
                What are we building?
              </h2>
              <p style={{ margin: '0 0 32px', fontSize: '0.875rem', color: '#6b7280' }}>
                Ask Melvin anything about The Forge.
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 10,
                width: '100%',
                maxWidth: 660,
              }}>
                {STARTER_CARDS.map((card, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(card.prompt)}
                    style={{
                      background: '#161b22',
                      border: '1px solid #21262d',
                      borderRadius: 10,
                      padding: '14px 16px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = '#a78bfa55';
                      e.currentTarget.style.background = '#1e1a2e';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = '#21262d';
                      e.currentTarget.style.background = '#161b22';
                    }}
                  >
                    <div style={{ fontSize: '1.2rem', marginBottom: 6 }}>{card.icon}</div>
                    <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0' }}>{card.title}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Chat thread */
            <div style={{ maxWidth: 780, width: '100%', margin: '0 auto', padding: '0 24px' }}>
              {messages.map(msg => (
                <Message key={msg.id} msg={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ── INPUT BAR ── */}
        <div style={{
          padding: '0 24px 20px',
          position: 'relative',
          zIndex: 2,
        }}>
          {/* Token limit banner */}
          {tokenLimitHit && (
            <div style={{
              background: '#1a0a0a',
              border: '1px solid #ef444455',
              borderRadius: 8,
              padding: '8px 14px',
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.78rem',
              color: '#ef4444',
              maxWidth: 780,
              margin: '0 auto 10px',
            }}>
              <span className="pulse-red" style={{ fontSize: '0.6rem' }}>●</span>
              TOKEN LIMIT HIT — Melvin ran out of context. Start a new chat or continue.
            </div>
          )}

          <div style={{ maxWidth: 780, margin: '0 auto', position: 'relative' }}>
            {/* Melvin peeking over input bar */}
            <div style={{
              position: 'absolute',
              bottom: 'calc(100% - 14px)',
              right: 72,
              zIndex: 1,
              pointerEvents: 'none',
            }}>
              <MelvinPeek animState={melvinState} />
            </div>

            {/* Pill row */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 8, zIndex: 2, position: 'relative' }}>
              {/* Model selector */}
              <div style={{ display: 'flex', gap: 4, background: '#161b22', borderRadius: 20, padding: '3px 4px', border: '1px solid #21262d' }}>
                {MODELS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setModel(m.id)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 16,
                      border: 'none',
                      background: model === m.id ? '#7c3aed' : 'transparent',
                      color: model === m.id ? '#fff' : '#6b7280',
                      fontSize: '0.72rem',
                      fontWeight: model === m.id ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.12s',
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Mode selector */}
              <div style={{ display: 'flex', gap: 4, background: '#161b22', borderRadius: 20, padding: '3px 4px', border: '1px solid #21262d' }}>
                {MODES.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 16,
                      border: 'none',
                      background: mode === m.id ? '#1e3a5f' : 'transparent',
                      color: mode === m.id ? '#60a5fa' : '#6b7280',
                      fontSize: '0.72rem',
                      fontWeight: mode === m.id ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.12s',
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Glitch pill when token limit hit */}
              {tokenLimitHit && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  background: '#1a0a0a',
                  border: '1px solid #ef444455',
                  borderRadius: 20,
                  padding: '4px 10px',
                }}>
                  <span className="pulse-red" style={{ fontSize: '0.5rem', color: '#ef4444' }}>●</span>
                  <span style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 600, letterSpacing: '0.05em' }}>GLITCHED</span>
                </div>
              )}
            </div>

            {/* Textarea */}
            <div style={{
              position: 'relative',
              background: '#161b22',
              border: `1px solid ${tokenLimitHit ? '#ef4444' : '#30363d'}`,
              borderRadius: 12,
              zIndex: 2,
              transition: 'border-color 0.15s',
            }}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Melvin anything…"
                rows={1}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#e2e8f0',
                  padding: '13px 52px 13px 16px',
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                  resize: 'none',
                  fontFamily: 'inherit',
                  minHeight: 50,
                  maxHeight: 220,
                  overflowY: 'auto',
                }}
                onInput={e => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 220) + 'px';
                }}
              />
              {/* Send button */}
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || sending}
                style={{
                  position: 'absolute',
                  right: 10,
                  bottom: 10,
                  width: 34,
                  height: 34,
                  background: input.trim() && !sending ? '#7c3aed' : '#21262d',
                  border: 'none',
                  borderRadius: 8,
                  cursor: input.trim() && !sending ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  color: input.trim() && !sending ? '#fff' : '#484f58',
                  transition: 'all 0.15s',
                }}
              >
                ↑
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
