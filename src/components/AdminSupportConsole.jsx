import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Headphones,
  Search,
  RefreshCw,
  Loader2,
  Send,
  UserCheck,
  UserMinus,
  Clock,
  Check,
  CheckCheck,
  Lock,
  Globe,
  Tag,
  X,
  Eye,
  ChevronLeft,
  Wifi,
  WifiOff,
  ShieldCheck,
  Building2,
  User,
} from 'lucide-react';

import {
  getSupportTicketsApi,
  getSupportTicketMessagesApi,
  sendSupportMessageApi,
  markSupportTicketReadApi,
  updateSupportTicketStatusApi,
  assignSupportTicketApi,
  updateSupportTicketTagsApi,
} from '../api/support';
import { useSupportSocket, createClientMessageId } from '../api/useSupportSocket';
import { useAuth } from '../context/AuthContext';

const QUEUE_VIEWS = [
  { id: 'UNASSIGNED', label: 'Unassigned' },
  { id: 'MINE', label: 'My Tickets' },
  { id: 'ALL_ACTIVE', label: 'All Active' },
  { id: 'RESOLVED', label: 'Resolved' },
];

const CATEGORY_OPTIONS = [
  { id: 'ALL', label: 'All Categories' },
  { id: 'SHORTLET_CHECKIN', label: 'Shortlet Check-in' },
  { id: 'CAUTION_FEE_REFUND', label: 'Caution Fee & Refunds' },
  { id: 'HOST_PAYOUT', label: 'Host Payouts & Escrow' },
  { id: 'CAR_RENTAL_HANDOVER', label: 'Car Rental Handover' },
  { id: 'HOTEL_RESERVATION', label: 'Hotel Reservations' },
  { id: 'VIP_VENUE_EVENT', label: 'VIP Venue & Events' },
  { id: 'ACCOUNT_KYC', label: 'Account & KYC' },
  { id: 'DISPUTE_ESCALATION', label: 'Dispute Escalation' },
  { id: 'GENERAL_INQUIRY', label: 'General Inquiry' },
];

const STATUS_OPTIONS = [
  { value: 'OPEN', label: 'Open' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'WAITING_ON_USER', label: 'Waiting on User' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
];

const STATUS_STYLES = {
  OPEN: 'bg-blue-50 text-blue-700 border-blue-200',
  ASSIGNED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  WAITING_ON_USER: 'bg-amber-50 text-amber-800 border-amber-200',
  RESOLVED: 'bg-gray-100 text-gray-700 border-gray-200',
  CLOSED: 'bg-gray-100 text-gray-500 border-gray-200',
};

const PRIORITY_STYLES = {
  URGENT: 'bg-red-50 text-red-700 border-red-200',
  HIGH: 'bg-amber-50 text-amber-700 border-amber-200',
  MEDIUM: 'bg-gray-100 text-gray-600 border-gray-200',
  LOW: 'bg-gray-50 text-gray-500 border-gray-200',
};

function normalizeTicket(ticket) {
  if (!ticket) return null;
  const resolvedId = ticket._id || ticket.id;
  if (!resolvedId) return null;
  return {
    ...ticket,
    _id: String(resolvedId),
    id: String(resolvedId),
  };
}

function normalizeMessage(msg) {
  if (!msg) return null;
  const resolvedId = msg._id || msg.id;
  return resolvedId
    ? { ...msg, _id: String(resolvedId), id: String(resolvedId) }
    : msg;
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

function formatMessageTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getRequesterInfo(ticket) {
  const req = ticket?.requesterId;
  if (req && typeof req === 'object') {
    const fullName =
      `${req.firstName || ''} ${req.lastName || ''}`.trim() ||
      req.email ||
      'Platform User';
    return {
      _id: req._id || req.id,
      fullName,
      email: req.email || '',
      phoneNumber: req.phoneNumber || '',
      role: req.role || ticket.requesterRole || 'USER',
      profilePicture: req.profilePicture || null,
      rawUser: req,
    };
  }
  return {
    _id: req || null,
    fullName: ticket?.requesterName || 'Platform User',
    email: '',
    phoneNumber: '',
    role: ticket?.requesterRole || 'USER',
    profilePicture: null,
    rawUser: req ? { _id: req, role: ticket?.requesterRole || 'USER' } : null,
  };
}

function getAssignedAgentInfo(ticket, currentUserId) {
  const agent = ticket?.assignedAgentId;
  if (!agent) return null;
  if (typeof agent === 'object') {
    const id = agent._id || agent.id;
    const isMe = String(id) === String(currentUserId);
    const name =
      `${agent.firstName || ''} ${agent.lastName || ''}`.trim() ||
      agent.email ||
      'Support Agent';
    return { id, isMe, label: isMe ? 'You' : name };
  }
  const isMe = String(agent) === String(currentUserId);
  return { id: agent, isMe, label: isMe ? 'You' : 'Assigned Agent' };
}

function mergeMessages(existing, incoming) {
  const byKey = new Map();

  for (const raw of existing) {
    const msg = normalizeMessage(raw);
    const key = msg?._id || msg?.clientMessageId;
    if (key) byKey.set(key, msg);
  }

  for (const raw of incoming) {
    const msg = normalizeMessage(raw);
    if (!msg) continue;
    if (msg.clientMessageId) {
      for (const [k, v] of byKey.entries()) {
        if (v.clientMessageId === msg.clientMessageId && k !== msg._id) {
          byKey.delete(k);
        }
      }
    }
    const key = msg._id || msg.clientMessageId;
    if (key) {
      byKey.set(key, { ...byKey.get(key), ...msg, _optimisticStatus: undefined });
    }
  }

  return Array.from(byKey.values()).sort(
    (a, b) => new Date(a.createdAt || Date.now()) - new Date(b.createdAt || Date.now())
  );
}

function upsertTicket(list, rawTicket) {
  const ticket = normalizeTicket(rawTicket);
  if (!ticket?._id) return list;
  const idx = list.findIndex((t) => String(t._id || t.id) === ticket._id);
  const next = [...list];
  if (idx >= 0) {
    next[idx] = { ...next[idx], ...ticket };
  } else {
    next.unshift(ticket);
  }
  return next.sort(
    (a, b) =>
      new Date(b.lastMessageAt || b.updatedAt || b.createdAt) -
      new Date(a.lastMessageAt || a.updatedAt || a.createdAt)
  );
}

function extractMessagesPayload(res) {
  const payload = res?.data?.data || res?.data || res || {};
  const list = Array.isArray(payload)
    ? payload
    : payload.messages ||
      payload.items ||
      payload.results ||
      res?.messages ||
      res?.items ||
      [];
  const nextCursor =
    payload.nextCursor ?? payload.cursor ?? res?.nextCursor ?? null;
  return { list, nextCursor };
}

export default function AdminSupportConsole({
  onAttentionCountChange,
  onInspectUser,
}) {
  const { user } = useAuth();
  const currentUserId = user?._id || user?.id;

  // Queue & Filter State
  const [queueView, setQueueView] = useState('ALL_ACTIVE');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);

  // Active Ticket & Thread State
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingOlder, setLoadingOlder] = useState(false);

  // Composer & Actions State
  const [composerMode, setComposerMode] = useState('PUBLIC'); // 'PUBLIC' | 'INTERNAL_NOTE'
  const [draftBody, setDraftBody] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [tagSaving, setTagSaving] = useState(false);

  const messagesEndRef = useRef(null);

  // Notify parent AdminDashboard sidebar of open/unread ticket count
  useEffect(() => {
    const attentionCount = tickets.filter(
      (t) => Number(t.unreadByStaff || 0) > 0 || t.status === 'OPEN'
    ).length;
    onAttentionCountChange?.(attentionCount);
  }, [tickets, onAttentionCountChange]);

  // Fetch tickets according to active queue tab, category, and search query
 // Fetch tickets according to active queue tab, category, and search query
  const loadQueue = useCallback(async () => {
    setTicketsLoading(true);
    try {
      const params = { limit: 50 };
      if (queueView === 'UNASSIGNED') params.unassignedOnly = true;
      if (queueView === 'MINE') params.assignedToMe = true;
      if (queueView === 'RESOLVED') params.status = 'RESOLVED';
      if (categoryFilter !== 'ALL') params.category = categoryFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await getSupportTicketsApi(params);
      console.log('[AdminSupportConsole:DEBUG] GET /support/tickets response:', res);

      const rawTickets = Array.isArray(res?.data)
        ? res.data
        : res?.data?.tickets ||
          res?.data?.items ||
          res?.tickets ||
          res?.items ||
          [];

      let fetched = rawTickets.map(normalizeTicket).filter(Boolean);

      // Keep ALL_ACTIVE focused on unresolved tickets unless searching
      if (queueView === 'ALL_ACTIVE' && !searchQuery.trim()) {
        fetched = fetched.filter(
          (t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED'
        );
      }

      setTickets(fetched);
    } catch (err) {
      console.error(
        '[AdminSupportConsole:DEBUG] Failed to load queue:',
        err?.response?.status,
        err?.response?.data || err?.message
      );
    } finally {
      setTicketsLoading(false);
    }
  }, [queueView, categoryFilter, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadQueue();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadQueue]);

  const lastConfirmedMessageId = [...messages]
    .reverse()
    .find((m) => m._id && !String(m._id).startsWith('temp-'))?._id;

  // Real-time Socket.IO connection
  const {
    isConnected,
    onlineAgentsCount,
    counterpartyOnline,
    typingState,
    sendMessage: emitSocketMessage,
    emitTyping,
    markTicketRead: emitSocketMarkRead,
  } = useSupportSocket({
    enabled: Boolean(user),
    activeTicketId: activeTicket?._id || null,
    lastKnownMessageId: lastConfirmedMessageId || null,
    onQueueNewTicket: ({ ticket }) => {
      const normalized = normalizeTicket(ticket);
      if (!normalized) return;
      if (queueView === 'RESOLVED' || queueView === 'MINE') return;
      setTickets((prev) => upsertTicket(prev, normalized));
    },
    onQueueTicketUpdated: ({ ticket }) => {
      const normalized = normalizeTicket(ticket);
      if (!normalized) return;
      setTickets((prev) => {
        if (queueView === 'UNASSIGNED' && normalized.assignedAgentId) {
          return prev.filter((t) => t._id !== normalized._id);
        }
        return upsertTicket(prev, normalized);
      });
      if (activeTicket?._id === normalized._id) {
        setActiveTicket((prev) => ({ ...prev, ...normalized }));
      }
    },
    onNewMessage: ({ ticketId, message }) => {
      const normalizedMsg = normalizeMessage(message);
      if (!normalizedMsg) return;
      const targetTicketId = String(ticketId || normalizedMsg.ticketId || '');
      const isViewingThis = Boolean(
        activeTicket?._id && activeTicket._id === targetTicketId
      );

      setTickets((prev) =>
        prev.map((t) => {
          if (t._id !== targetTicketId) return t;
          return {
            ...t,
            lastMessagePreview: normalizedMsg.body || 'Attachment',
            lastMessageAt: normalizedMsg.createdAt || new Date().toISOString(),
            unreadByStaff:
              isViewingThis || normalizedMsg.senderRole === 'ADMIN'
                ? 0
                : Number(t.unreadByStaff || 0) + 1,
          };
        })
      );

      if (isViewingThis) {
        setMessages((prev) => mergeMessages(prev, [normalizedMsg]));
        if (normalizedMsg.senderRole !== 'ADMIN') {
          emitSocketMarkRead(targetTicketId).catch(() => {});
          markSupportTicketReadApi(targetTicketId).catch(() => {});
        }
      }
    },
    onInternalNote: ({ ticketId, message }) => {
      const normalizedMsg = normalizeMessage(message);
      if (!normalizedMsg) return;
      const targetTicketId = String(ticketId || normalizedMsg.ticketId || '');
      if (activeTicket?._id === targetTicketId) {
        setMessages((prev) => mergeMessages(prev, [normalizedMsg]));
      }
    },
    onTicketStateChanged: ({ ticket }) => {
      const normalized = normalizeTicket(ticket);
      if (!normalized) return;
      setTickets((prev) => upsertTicket(prev, normalized));
      if (activeTicket?._id === normalized._id) {
        setActiveTicket((prev) => ({ ...prev, ...normalized }));
      }
    },
    onRead: ({ ticketId, readByRole, readAt }) => {
      if (activeTicket?._id === String(ticketId) && readByRole !== 'ADMIN') {
        setMessages((prev) =>
          prev.map((m) =>
            m.senderRole === 'ADMIN' &&
            m.visibility !== 'INTERNAL_NOTE' &&
            !m.readAt
              ? { ...m, readAt: readAt || new Date().toISOString() }
              : m
          )
        );
      }
    },
    onSyncRecovered: ({ ticket, messages: recovered }) => {
      const normalized = normalizeTicket(ticket);
      if (normalized) {
        setActiveTicket((prev) => ({ ...prev, ...normalized }));
        setTickets((prev) => upsertTicket(prev, normalized));
      }
      if (Array.isArray(recovered) && recovered.length > 0) {
        setMessages((prev) => mergeMessages(prev, recovered));
      }
    },
  });

  useEffect(() => {
    if (activeTicket?._id) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, typingState, activeTicket?._id]);

  // Select and open a ticket thread
 const handleSelectTicket = async (rawTicket) => {
    const ticket = normalizeTicket(rawTicket);
    if (!ticket) return;

    setActiveTicket(ticket);
    setMessages([]);
    setNextCursor(null);
    setMessagesLoading(true);
    setComposerMode('PUBLIC');

    setTickets((prev) =>
      prev.map((t) => (t._id === ticket._id ? { ...t, unreadByStaff: 0 } : t))
    );

    try {
      const res = await getSupportTicketMessagesApi(ticket._id, { limit: 40 });
      const { list: fetchedMessages, nextCursor: cursor } =
        extractMessagesPayload(res);

      setMessages(mergeMessages([], fetchedMessages));
      setNextCursor(cursor);

      emitSocketMarkRead(ticket._id).catch(() => {});
      markSupportTicketReadApi(ticket._id).catch(() => {});
    } catch (err) {
      console.error('[AdminSupportConsole] Failed to load messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleLoadOlder = async () => {
    if (!activeTicket?._id || !nextCursor || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const res = await getSupportTicketMessagesApi(activeTicket._id, {
        cursor: nextCursor,
        limit: 40,
      });
      const { list: older, nextCursor: cursor } = extractMessagesPayload(res);
      setMessages((prev) => mergeMessages(prev, older));
      setNextCursor(cursor);
    } catch (err) {
      console.error('[AdminSupportConsole] Failed to load older messages:', err);
    } finally {
      setLoadingOlder(false);
    }
  };

  // Claim, take over, or unassign ticket
  const handleAssignTicket = async (targetAgentId) => {
    if (!activeTicket?._id || assignLoading) return;
    setAssignLoading(true);
    try {
      const res = await assignSupportTicketApi(activeTicket._id, targetAgentId);
      const updated = normalizeTicket(
        res?.data?.ticket ||
          res?.ticket || {
            ...activeTicket,
            assignedAgentId: targetAgentId,
            status: targetAgentId ? 'ASSIGNED' : 'OPEN',
          }
      );
      setActiveTicket((prev) => ({ ...prev, ...updated }));
      setTickets((prev) => upsertTicket(prev, updated));
    } catch (err) {
      console.error('[AdminSupportConsole] Assignment failed:', err);
    } finally {
      setAssignLoading(false);
    }
  };

  // Change ticket status
  const handleStatusChange = async (nextStatus) => {
    if (!activeTicket?._id || statusLoading || nextStatus === activeTicket.status) return;
    setStatusLoading(true);
    try {
      const res = await updateSupportTicketStatusApi(activeTicket._id, nextStatus);
      const updated = normalizeTicket(
        res?.data?.ticket ||
          res?.ticket || {
            ...activeTicket,
            status: nextStatus,
          }
      );
      setActiveTicket((prev) => ({ ...prev, ...updated }));
      setTickets((prev) => upsertTicket(prev, updated));
    } catch (err) {
      console.error('[AdminSupportConsole] Status update failed:', err);
    } finally {
      setStatusLoading(false);
    }
  };

  // Add or remove internal staff tags
  const handleAddTag = async (e) => {
    e.preventDefault();
    const cleanTag = newTagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (!cleanTag || !activeTicket?._id || tagSaving) return;

    const currentTags = Array.isArray(activeTicket.internalTags)
      ? activeTicket.internalTags
      : [];
    if (currentTags.includes(cleanTag)) {
      setNewTagInput('');
      return;
    }

    const updatedTags = [...currentTags, cleanTag];
    setTagSaving(true);
    try {
      const res = await updateSupportTicketTagsApi(activeTicket._id, updatedTags);
      const updated = normalizeTicket(
        res?.data?.ticket ||
          res?.ticket || {
            ...activeTicket,
            internalTags: updatedTags,
          }
      );
      setActiveTicket((prev) => ({ ...prev, ...updated }));
      setTickets((prev) => upsertTicket(prev, updated));
      setNewTagInput('');
    } catch (err) {
      console.error('[AdminSupportConsole] Failed to add tag:', err);
    } finally {
      setTagSaving(false);
    }
  };

  const handleRemoveTag = async (tagToRemove) => {
    if (!activeTicket?._id || tagSaving) return;
    const currentTags = Array.isArray(activeTicket.internalTags)
      ? activeTicket.internalTags
      : [];
    const updatedTags = currentTags.filter((t) => t !== tagToRemove);

    setTagSaving(true);
    try {
      const res = await updateSupportTicketTagsApi(activeTicket._id, updatedTags);
      const updated = normalizeTicket(
        res?.data?.ticket ||
          res?.ticket || {
            ...activeTicket,
            internalTags: updatedTags,
          }
      );
      setActiveTicket((prev) => ({ ...prev, ...updated }));
      setTickets((prev) => upsertTicket(prev, updated));
    } catch (err) {
      console.error('[AdminSupportConsole] Failed to remove tag:', err);
    } finally {
      setTagSaving(false);
    }
  };

  // Send Public Reply or Internal Staff Note
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const trimmed = draftBody.trim();
    if (!trimmed || !activeTicket?._id) return;

    const clientMessageId = createClientMessageId();
    const visibility = composerMode;

    const optimisticMsg = {
      _id: `temp-${clientMessageId}`,
      ticketId: activeTicket._id,
      clientMessageId,
      senderId: currentUserId,
      senderRole: 'ADMIN',
      senderDisplayName: `${user?.firstName || 'Support'} ${user?.lastName || 'Agent'}`.trim(),
      visibility,
      body: trimmed,
      createdAt: new Date().toISOString(),
      _optimisticStatus: 'sending',
    };

    setDraftBody('');
    setMessages((prev) => mergeMessages(prev, [optimisticMsg]));

    try {
      let confirmedMsg = null;

      if (isConnected) {
        const ackData = await emitSocketMessage({
          ticketId: activeTicket._id,
          body: trimmed,
          visibility,
          clientMessageId,
        });
        confirmedMsg = ackData?.message || ackData;
      } else {
        const restRes = await sendSupportMessageApi(activeTicket._id, {
          body: trimmed,
          visibility,
          clientMessageId,
        });
        confirmedMsg = restRes?.data?.message || restRes?.message;
      }

      if (confirmedMsg?._id || confirmedMsg?.id) {
        setMessages((prev) => mergeMessages(prev, [confirmedMsg]));
      }
    } catch {
      try {
        const restRes = await sendSupportMessageApi(activeTicket._id, {
          body: trimmed,
          visibility,
          clientMessageId,
        });
        const confirmedMsg = restRes?.data?.message || restRes?.message;
        if (confirmedMsg?._id || confirmedMsg?.id) {
          setMessages((prev) => mergeMessages(prev, [confirmedMsg]));
          return;
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.clientMessageId === clientMessageId
              ? { ...m, _optimisticStatus: 'failed' }
              : m
          )
        );
      }
    }
  };

  const requester = activeTicket ? getRequesterInfo(activeTicket) : null;
  const assignedAgent = activeTicket
    ? getAssignedAgentInfo(activeTicket, currentUserId)
    : null;

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Top Status & Filter Strip */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Queue View Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {QUEUE_VIEWS.map((tab) => {
            const active = queueView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setQueueView(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  active
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Live Desk Presence + Refresh */}
        <div className="flex items-center justify-between lg:justify-end gap-3">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${
              isConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {isConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5" />
                <span>
                  Live Desk ({Math.max(1, onlineAgentsCount)} agent
                  {onlineAgentsCount === 1 ? '' : 's'} online)
                </span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span>Reconnecting...</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={loadQueue}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 hover:border-gray-400 text-xs font-bold text-gray-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${ticketsLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Split-Pane Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ================= LEFT PANE: TICKET QUEUE ================= */}
        <div
          className={`lg:col-span-5 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-15rem)] min-h-[540px] ${
            activeTicket ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Search & Category Filter */}
          <div className="p-3.5 border-b border-gray-100 space-y-2.5 bg-gray-50/50 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ticket code, subject, user..."
                className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 placeholder:text-gray-400 focus:border-gray-900 outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:border-gray-900 outline-none"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Ticket List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {ticketsLoading && tickets.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8">
                <Loader2 className="w-7 h-7 animate-spin mb-2" />
                <span className="text-xs font-bold">Loading support queue...</span>
              </div>
            ) : tickets.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <Headphones className="w-9 h-9 text-gray-300 mb-3" />
                <p className="text-sm font-bold text-gray-700">No tickets in this view</p>
                <p className="text-xs text-gray-400 mt-1">
                  New guest and host requests will appear here automatically.
                </p>
              </div>
            ) : (
              tickets.map((ticket) => {
                const isSelected = activeTicket?._id === ticket._id;
                const reqInfo = getRequesterInfo(ticket);
                const agentInfo = getAssignedAgentInfo(ticket, currentUserId);
                const unread = Number(ticket.unreadByStaff || 0);
                const statusBadge =
                  STATUS_STYLES[ticket.status] || STATUS_STYLES.OPEN;
                const isHost = reqInfo.role === 'LANDLORD';

                return (
                  <button
                    key={ticket._id}
                    type="button"
                    onClick={() => handleSelectTicket(ticket)}
                    className={`w-full text-left p-4 transition-colors block ${
                      isSelected
                        ? 'bg-gray-900 text-white'
                        : unread > 0
                        ? 'bg-blue-50/40 hover:bg-blue-50/70'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider ${
                            isSelected ? 'text-gray-300' : 'text-gray-400'
                          }`}
                        >
                          {ticket.ticketCode}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            isHost
                              ? isSelected
                                ? 'bg-amber-400 text-gray-900'
                                : 'bg-amber-100 text-amber-800'
                              : isSelected
                              ? 'bg-white/15 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {isHost ? 'Host' : 'Guest'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {unread > 0 && !isSelected && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black">
                            {unread}
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            isSelected
                              ? 'bg-white/10 text-white border-white/20'
                              : statusBadge
                          }`}
                        >
                          {ticket.status?.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`text-sm font-bold truncate ${
                        isSelected ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {ticket.subject}
                    </div>

                    <div
                      className={`text-xs truncate mt-0.5 ${
                        isSelected ? 'text-gray-300' : 'text-gray-500'
                      }`}
                    >
                      {ticket.lastMessagePreview || 'No messages yet'}
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-current/10 text-[11px]">
                      <span
                        className={`font-semibold truncate ${
                          isSelected ? 'text-gray-300' : 'text-gray-600'
                        }`}
                      >
                        {reqInfo.fullName}
                      </span>

                      <div className="flex items-center gap-2 shrink-0">
                        {agentInfo && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              isSelected
                                ? 'bg-white/15 text-white'
                                : agentInfo.isMe
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {agentInfo.label}
                          </span>
                        )}
                        <span className="text-gray-400">
                          {formatRelativeTime(
                            ticket.lastMessageAt || ticket.createdAt
                          )}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ================= RIGHT PANE: CONVERSATION WORKSPACE ================= */}
        <div
          className={`lg:col-span-7 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-15rem)] min-h-[540px] ${
            activeTicket ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {!activeTicket ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-gray-50/40">
              <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 shadow-xs flex items-center justify-center mb-4">
                <ShieldCheck className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-extrabold text-gray-900">
                Select a Ticket to Respond
              </h3>
              <p className="text-xs font-medium text-gray-500 max-w-sm mt-1.5 leading-relaxed">
                Claim incoming guest or host conversations, post internal staff
                notes for teammates, and inspect user compliance dossiers in real
                time.
              </p>
            </div>
          ) : (
            <>
              {/* Ticket Header & Multi-Agent Controls */}
              <div className="p-4 border-b border-gray-200 bg-gray-50/70 space-y-3 shrink-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => setActiveTicket(null)}
                      className="lg:hidden p-1.5 -ml-1 rounded-lg bg-white border border-gray-200 text-gray-700"
                      aria-label="Back to ticket queue"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black text-gray-500">
                          {activeTicket.ticketCode}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            requester?.role === 'LANDLORD'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {requester?.role === 'LANDLORD' ? (
                            <Building2 className="w-3 h-3" />
                          ) : (
                            <User className="w-3 h-3" />
                          )}
                          {requester?.role === 'LANDLORD' ? 'Host' : 'Guest'}
                        </span>
                        {activeTicket.priority && (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                              PRIORITY_STYLES[activeTicket.priority] ||
                              PRIORITY_STYLES.MEDIUM
                            }`}
                          >
                            {activeTicket.priority}
                          </span>
                        )}
                        {counterpartyOnline && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Online
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-extrabold text-gray-900 truncate mt-1">
                        {activeTicket.subject}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-0.5">
                        <span className="font-bold text-gray-700">
                          {requester?.fullName}
                        </span>
                        {requester?.email && <span>{requester.email}</span>}
                        {activeTicket.contextType &&
                          activeTicket.contextType !== 'NONE' && (
                            <span className="text-[11px] font-bold text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded">
                              Ref: {activeTicket.contextType}
                            </span>
                          )}
                      </div>
                    </div>
                  </div>

                  {/* Inspect User Dossier Button */}
                  {requester?.rawUser && onInspectUser && (
                    <button
                      type="button"
                      onClick={() => onInspectUser(requester.rawUser)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 hover:border-gray-900 text-xs font-bold text-gray-900 shadow-2xs shrink-0 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Inspect Dossier</span>
                    </button>
                  )}
                </div>

                {/* Action Bar: Claim/Release, Status Selector, Internal Tags */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-200/80">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Ownership Controls */}
                    {!assignedAgent ? (
                      <button
                        type="button"
                        onClick={() => handleAssignTicket(currentUserId)}
                        disabled={assignLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-black text-white text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        {assignLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <UserCheck className="w-3.5 h-3.5" />
                        )}
                        <span>Claim Ticket</span>
                      </button>
                    ) : assignedAgent.isMe ? (
                      <button
                        type="button"
                        onClick={() => handleAssignTicket(null)}
                        disabled={assignLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                        <span>Assigned to You (Release)</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAssignTicket(currentUserId)}
                        disabled={assignLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Owned by {assignedAgent.label} • Take Over</span>
                      </button>
                    )}

                    {/* Status Dropdown */}
                    <select
                      value={activeTicket.status || 'OPEN'}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      disabled={statusLoading}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-800 outline-none focus:border-gray-900"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          Status: {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Internal Staff Tags */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(activeTicket.internalTags || []).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-200/80 text-gray-700 text-[10px] font-bold"
                      >
                        <Tag className="w-2.5 h-2.5" />
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-red-600"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}

                    <form onSubmit={handleAddTag} className="inline-flex items-center">
                      <input
                        type="text"
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        placeholder="+ tag"
                        className="w-20 focus:w-28 transition-all px-2 py-0.5 text-[11px] font-medium bg-white border border-gray-200 rounded-md outline-none focus:border-gray-900"
                      />
                    </form>
                  </div>
                </div>
              </div>

              {/* Conversation Messages Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8F9FA]">
                {nextCursor && (
                  <div className="text-center pb-2">
                    <button
                      type="button"
                      onClick={handleLoadOlder}
                      disabled={loadingOlder}
                      className="px-3 py-1 rounded-full bg-white border border-gray-200 text-[11px] font-bold text-gray-600 hover:text-gray-900"
                    >
                      {loadingOlder ? 'Loading...' : 'Load earlier messages'}
                    </button>
                  </div>
                )}

                {messagesLoading ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mb-2" />
                    <span className="text-xs font-bold">Loading conversation...</span>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const key = msg._id || msg.clientMessageId;

                    if (msg.senderRole === 'SYSTEM') {
                      return (
                        <div key={key} className="flex justify-center my-2">
                          <span className="px-3 py-1 rounded-full bg-gray-200/70 text-gray-600 text-[11px] font-semibold">
                            {msg.body}
                          </span>
                        </div>
                      );
                    }

                    // Staff-Only Internal Note
                    if (msg.visibility === 'INTERNAL_NOTE') {
                      return (
                        <div
                          key={key}
                          className="mx-auto max-w-[92%] bg-amber-50 border border-amber-200 rounded-2xl p-3.5 shadow-2xs"
                        >
                          <div className="flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-wider text-amber-800 mb-1">
                            <span className="inline-flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              Internal Staff Note • {msg.senderDisplayName || 'Admin'}
                            </span>
                            <span className="font-semibold text-amber-700">
                              {formatMessageTime(msg.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-amber-950 whitespace-pre-wrap break-words leading-relaxed">
                            {msg.body}
                          </p>
                        </div>
                      );
                    }

                    const isStaff = msg.senderRole === 'ADMIN';
                    const isSending = msg._optimisticStatus === 'sending';
                    const isFailed = msg._optimisticStatus === 'failed';

                    return (
                      <div
                        key={key}
                        className={`flex flex-col ${
                          isStaff ? 'items-end' : 'items-start'
                        }`}
                      >
                        <span className="text-[10px] font-bold text-gray-400 px-1 mb-1">
                          {isStaff
                            ? msg.senderDisplayName || 'Support Specialist'
                            : `${requester?.fullName || 'User'} (${
                                msg.senderRole === 'LANDLORD' ? 'Host' : 'Guest'
                              })`}
                        </span>

                        <div
                          className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-2xs ${
                            isStaff
                              ? 'bg-gray-900 text-white rounded-br-sm'
                              : 'bg-white text-gray-900 border border-gray-200/80 rounded-bl-sm'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                        </div>

                        <div className="flex items-center gap-1.5 mt-1 px-1">
                          <span className="text-[10px] font-medium text-gray-400">
                            {formatMessageTime(msg.createdAt)}
                          </span>
                          {isStaff && (
                            <>
                              {isSending ? (
                                <Clock className="w-3 h-3 text-gray-400" />
                              ) : isFailed ? (
                                <span className="text-[10px] font-bold text-red-600">
                                  Failed to send
                                </span>
                              ) : msg.readAt ? (
                                <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-gray-400" />
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {/* User Typing Indicator */}
                {typingState && typingState.ticketId === activeTicket._id && (
                  <div className="flex items-start">
                    <div className="bg-white border border-gray-200 px-3.5 py-2 rounded-2xl rounded-bl-sm flex items-center gap-2 text-xs text-gray-500 font-medium">
                      <span>{requester?.fullName || 'User'} is typing</span>
                      <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                      </span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Dual-Mode Composer (Public Reply vs Internal Staff Note) */}
              <div
                className={`p-3 border-t transition-colors shrink-0 ${
                  composerMode === 'INTERNAL_NOTE'
                    ? 'bg-amber-50/70 border-amber-200'
                    : 'bg-white border-gray-200'
                }`}
              >
                {/* Mode Toggle */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="inline-flex rounded-xl bg-gray-100 p-0.5 border border-gray-200/80">
                    <button
                      type="button"
                      onClick={() => setComposerMode('PUBLIC')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-extrabold transition-all ${
                        composerMode === 'PUBLIC'
                          ? 'bg-white text-gray-900 shadow-2xs'
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      <Globe className="w-3 h-3" />
                      <span>Public Reply</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setComposerMode('INTERNAL_NOTE')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-extrabold transition-all ${
                        composerMode === 'INTERNAL_NOTE'
                          ? 'bg-amber-500 text-white shadow-2xs'
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      <Lock className="w-3 h-3" />
                      <span>Internal Staff Note</span>
                    </button>
                  </div>

                  {composerMode === 'INTERNAL_NOTE' && (
                    <span className="text-[11px] font-bold text-amber-800">
                      Visible only to Admins
                    </span>
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                  <textarea
                    rows={2}
                    value={draftBody}
                    onChange={(e) => {
                      setDraftBody(e.target.value);
                      if (composerMode === 'PUBLIC') {
                        emitTyping(
                          e.target.value.trim().length > 0,
                          activeTicket._id
                        );
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    placeholder={
                      composerMode === 'INTERNAL_NOTE'
                        ? 'Add a private note for other support agents...'
                        : `Reply publicly to ${requester?.fullName || 'user'}...`
                    }
                    className={`flex-1 max-h-32 px-3.5 py-2.5 rounded-xl text-sm font-medium outline-none resize-none border ${
                      composerMode === 'INTERNAL_NOTE'
                        ? 'bg-white border-amber-300 text-amber-950 placeholder:text-amber-500 focus:border-amber-600'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-gray-900'
                    }`}
                  />

                  <button
                    type="submit"
                    disabled={!draftBody.trim()}
                    className={`px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white flex items-center gap-1.5 transition-all disabled:opacity-40 shrink-0 shadow-xs ${
                      composerMode === 'INTERNAL_NOTE'
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : 'bg-gray-900 hover:bg-black'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {composerMode === 'INTERNAL_NOTE' ? 'Add Note' : 'Send'}
                    </span>
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}