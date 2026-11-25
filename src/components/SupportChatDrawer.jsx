import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Headphones,
  X,
  Plus,
  ChevronLeft,
  Send,
  Loader2,
  CheckCircle,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  WifiOff,
} from 'lucide-react';

import {
  createSupportTicketApi,
  getSupportTicketsApi,
  getSupportTicketMessagesApi,
  sendSupportMessageApi,
  markSupportTicketReadApi,
  updateSupportTicketStatusApi,
} from '../api/support';
import { useSupportSocket, createClientMessageId } from '../api/useSupportSocket';
import { useAuth } from '../context/AuthContext';

const GUEST_SUPPORT_CATEGORIES = [
  {
    id: 'SHORTLET_CHECKIN',
    label: 'Shortlet Check-in & Access',
    description: 'Access codes, host arrival, or stay schedule changes',
  },
  {
    id: 'CAUTION_FEE_REFUND',
    label: 'Caution Fee & Refunds',
    description: 'Deposit release, caution fee, or billing help',
  },
  {
    id: 'CAR_RENTAL_HANDOVER',
    label: 'Car Rental & Handover',
    description: 'Chauffeur arrival, pickup timing, or vehicle details',
  },
  {
    id: 'HOTEL_RESERVATION',
    label: 'Hotel Reservation',
    description: 'Room check-in, booking confirmation, or hotel changes',
  },
  {
    id: 'VIP_VENUE_EVENT',
    label: 'VIP Venue & Table Booking',
    description: 'Nightlife table access, guestlist, or concierge arrival',
  },
  {
    id: 'DISPUTE_ESCALATION',
    label: 'Property or Vehicle Dispute',
    description: 'Condition mismatch, amenities, or safety concern',
  },
  {
    id: 'ACCOUNT_KYC',
    label: 'Account & KYC Verification',
    description: 'ID verification, bank details, or profile updates',
  },
  {
    id: 'GENERAL_INQUIRY',
    label: 'General Concierge Inquiry',
    description: 'Questions about Rentals Africa services',
  },
];

const HOST_SUPPORT_CATEGORIES = [
  {
    id: 'HOST_PAYOUT',
    label: 'Payouts & Escrow Release',
    description: 'Bank settlement, delayed release, or fee breakdown',
  },
  {
    id: 'SHORTLET_CHECKIN',
    label: 'Guest Check-in & Schedule',
    description: 'Guest arrival confirmation, handover, or cancellation',
  },
  {
    id: 'CAR_RENTAL_HANDOVER',
    label: 'Vehicle Handover & Fleet Support',
    description: 'Driver dispatch, pickup schedule, or trip extensions',
  },
  {
    id: 'DISPUTE_ESCALATION',
    label: 'Property or Guest Dispute',
    description: 'Damages, house rules, or vehicle handover issue',
  },
  {
    id: 'ACCOUNT_KYC',
    label: 'Listing & KYC Verification',
    description: 'Asset approval, payout bank setup, or profile updates',
  },
  {
    id: 'GENERAL_INQUIRY',
    label: 'Partner Concierge Inquiry',
    description: 'General questions about hosting on Rentals Africa',
  },
];

const STATUS_BADGES = {
  OPEN: {
    label: 'Open',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  ASSIGNED: {
    label: 'Agent Assigned',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  WAITING_ON_USER: {
    label: 'Reply Needed',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  RESOLVED: {
    label: 'Resolved',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  CLOSED: {
    label: 'Closed',
    className: 'bg-gray-100 text-gray-500 border-gray-200',
  },
};

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

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

function formatMessageTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
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

function formatContextOption(item) {
  if (!item) return { label: 'Booking', meta: '' };

  if (item.isRawAsset) {
    return {
      label: item.asset?.title || `${item.type} Listing`,
      meta: 'Portfolio Listing',
    };
  }

  const label =
    item.asset?.title ||
    (item.type === 'CAR'
      ? `${item.carId?.make || ''} ${item.carId?.carModel || 'Car Rental'}`.trim()
      : item.propertyId?.title || `${item.type} Booking`);

  if (
    item.dates &&
    item.dates !== 'No active bookings' &&
    item.dates !== 'No active reservations'
  ) {
    return { label, meta: item.dates };
  }

  const rawDate = item.startDate || item.pickupTime || item.checkInDate || item.createdAt;
  const dateStr = rawDate
    ? new Date(rawDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    : '';

  return { label, meta: dateStr };
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

export default function SupportChatDrawer({
  isOpen,
  onClose,
  portalType = 'GUEST', // 'GUEST' | 'HOST'
  bookings = [],
  prefillBooking = null,
  onClearPrefill,
  onUnreadCountChange,
}) {
  const { user } = useAuth();
  const currentUserId = user?._id || user?.id;
  const isHostPortal = portalType === 'HOST';
  const categories = isHostPortal ? HOST_SUPPORT_CATEGORIES : GUEST_SUPPORT_CATEGORIES;
  const defaultCategory = isHostPortal ? 'HOST_PAYOUT' : 'SHORTLET_CHECKIN';

  // Navigation view inside the drawer: 'LIST' | 'NEW' | 'CHAT'
  const [view, setView] = useState('LIST');

  // Tickets state
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);

  // Active thread messages state
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingOlder, setLoadingOlder] = useState(false);

  // Composer state
  const [draftBody, setDraftBody] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // New Ticket form state
  const [category, setCategory] = useState(defaultCategory);
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [subject, setSubject] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [formError, setFormError] = useState('');

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Compute total unread across all user tickets
  useEffect(() => {
    const totalUnread = tickets.reduce(
      (sum, t) => sum + Number(t.unreadByRequester || 0),
      0
    );
    onUnreadCountChange?.(totalUnread);
  }, [tickets, onUnreadCountChange]);

  const loadTickets = useCallback(async () => {
    if (!user) return;
    setTicketsLoading(true);
    try {
      const res = await getSupportTicketsApi({ limit: 30 });
      const rawFetched = Array.isArray(res?.data)
        ? res.data
        : res?.data?.tickets || res?.data?.items || res?.tickets || [];
      setTickets(rawFetched.map(normalizeTicket).filter(Boolean));
    } catch (err) {
      console.error('[SupportDrawer] Failed to fetch tickets:', err);
    } finally {
      setTicketsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    if (isOpen) {
      loadTickets();
    }
  }, [isOpen, loadTickets]);

  // Handle contextual "Need help?" launch from a specific BookingCard or Ledger/Asset Card
  useEffect(() => {
    if (!isOpen || !prefillBooking) return;

    const inferredCategory =
      prefillBooking.defaultCategory ||
      (prefillBooking.isRawAsset
        ? 'ACCOUNT_KYC'
        : isHostPortal
        ? 'HOST_PAYOUT'
        : prefillBooking.type === 'CAR'
        ? 'CAR_RENTAL_HANDOVER'
        : prefillBooking.type === 'HOTEL'
        ? 'HOTEL_RESERVATION'
        : prefillBooking.type === 'VIP'
        ? 'VIP_VENUE_EVENT'
        : 'SHORTLET_CHECKIN');

    setCategory(inferredCategory);
    setSelectedBookingId(
      OBJECT_ID_REGEX.test(String(prefillBooking.id || '')) ? prefillBooking.id : ''
    );
    setSubject(
      prefillBooking.subject ||
        `Help with ${prefillBooking.title || (isHostPortal ? 'my listing' : 'my booking')}`
    );
    setInitialMessage('');
    setFormError('');
    setView('NEW');
    onClearPrefill?.();
  }, [isOpen, prefillBooking, onClearPrefill, isHostPortal]);

  const lastConfirmedMessageId = [...messages]
    .reverse()
    .find((m) => m._id && !String(m._id).startsWith('temp-'))?._id;

  const {
    isConnected,
    connectionError,
    agentsOnline,
    counterpartyOnline,
    typingState,
    sendMessage: emitSocketMessage,
    emitTyping,
    markTicketRead: emitSocketMarkRead,
  } = useSupportSocket({
    enabled: Boolean(user),
    activeTicketId: isOpen && view === 'CHAT' ? activeTicket?._id : null,
    lastKnownMessageId: lastConfirmedMessageId || null,
    onNewMessage: ({ ticketId, message }) => {
      const normalizedMsg = normalizeMessage(message);
      if (!normalizedMsg) return;
      const targetTicketId = String(ticketId || normalizedMsg.ticketId || '');

      setTickets((prev) =>
        prev.map((t) => {
          if (t._id !== targetTicketId) return t;
          const isViewingThisThread =
            isOpen && view === 'CHAT' && activeTicket?._id === targetTicketId;
          const isFromStaff = normalizedMsg.senderRole === 'ADMIN';
          return {
            ...t,
            lastMessagePreview: normalizedMsg.body || 'Attachment',
            lastMessageAt: normalizedMsg.createdAt || new Date().toISOString(),
            unreadByRequester:
              isViewingThisThread || !isFromStaff
                ? 0
                : Number(t.unreadByRequester || 0) + 1,
          };
        })
      );

      if (activeTicket?._id === targetTicketId) {
        setMessages((prev) => mergeMessages(prev, [normalizedMsg]));
        if (isOpen && view === 'CHAT' && normalizedMsg.senderRole === 'ADMIN') {
          emitSocketMarkRead(targetTicketId).catch(() => {});
          markSupportTicketReadApi(targetTicketId).catch(() => {});
        }
      }
    },
    onTicketCreated: ({ ticket }) => {
      const normalized = normalizeTicket(ticket);
      if (normalized) setTickets((prev) => upsertTicket(prev, normalized));
    },
    onTicketUpdated: ({ ticket }) => {
      const normalized = normalizeTicket(ticket);
      if (!normalized) return;
      setTickets((prev) => upsertTicket(prev, normalized));
      if (activeTicket?._id === normalized._id) {
        setActiveTicket((prev) => ({ ...prev, ...normalized }));
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
      if (activeTicket?._id === String(ticketId) && readByRole === 'ADMIN') {
        setMessages((prev) =>
          prev.map((m) =>
            m.senderRole !== 'ADMIN' && !m.readAt
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
    if (view === 'CHAT' && isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, typingState, view, isOpen]);

  const handleOpenTicket = async (rawTicket) => {
    const ticket = normalizeTicket(rawTicket);
    if (!ticket) return;

    setActiveTicket(ticket);
    setView('CHAT');
    setMessages([]);
    setNextCursor(null);
    setMessagesLoading(true);

    setTickets((prev) =>
      prev.map((t) => (t._id === ticket._id ? { ...t, unreadByRequester: 0 } : t))
    );

    try {
      const res = await getSupportTicketMessagesApi(ticket._id, { limit: 30 });
      const { list: fetchedMessages, nextCursor: cursor } =
        extractMessagesPayload(res);

      setMessages(mergeMessages([], fetchedMessages));
      setNextCursor(cursor);

      emitSocketMarkRead(ticket._id).catch(() => {});
      markSupportTicketReadApi(ticket._id).catch(() => {});
    } catch (err) {
      console.error('[SupportDrawer] Failed to load messages:', err);
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
        limit: 30,
      });
      const { list: older, nextCursor: cursor } = extractMessagesPayload(res);
      setMessages((prev) => mergeMessages(prev, older));
      setNextCursor(cursor);
    } catch (err) {
      console.error('[SupportDrawer] Failed to load older messages:', err);
    } finally {
      setLoadingOlder(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setFormError('');

    const trimmedSubject = subject.trim();
    const trimmedMessage = initialMessage.trim();

    if (trimmedSubject.length < 3) {
      setFormError('Please enter a brief subject (at least 3 characters).');
      return;
    }
    if (!trimmedMessage) {
      setFormError('Please describe how our team can help you.');
      return;
    }

    const chosenItem = bookings.find(
      (b) => String(b._id || b.id) === selectedBookingId
    );
    const rawContextId = chosenItem
      ? chosenItem.isRawAsset
        ? chosenItem.assetId || chosenItem._id || chosenItem.id
        : chosenItem._id || chosenItem.id
      : null;

    const hasValidContextId =
      typeof rawContextId === 'string' && OBJECT_ID_REGEX.test(rawContextId);

    let contextType = 'NONE';
    if (chosenItem && hasValidContextId) {
      if (chosenItem.isRawAsset) {
        contextType = chosenItem.type === 'CAR' ? 'CAR' : 'PROPERTY';
      } else {
        contextType = chosenItem.type === 'CAR' ? 'CAR_RESERVATION' : 'RESERVATION';
      }
    }

    setCreatingTicket(true);
    try {
      const payload = {
        category,
        subject: trimmedSubject,
        initialMessage: trimmedMessage,
        clientMessageId: createClientMessageId(),
        contextType,
        ...(hasValidContextId ? { contextId: rawContextId } : {}),
      };

      const res = await createSupportTicketApi(payload);
      const createdTicket = normalizeTicket(res?.data?.ticket || res?.ticket);
      const firstMsg = normalizeMessage(
        res?.data?.initialMessage || res?.initialMessage
      );

      if (createdTicket) {
        setTickets((prev) => upsertTicket(prev, createdTicket));
        setActiveTicket(createdTicket);
        setMessages(firstMsg ? [firstMsg] : []);
        setNextCursor(null);
        setSubject('');
        setInitialMessage('');
        setSelectedBookingId('');
        setView('CHAT');
      }
    } catch (err) {
      const apiData = err?.response?.data;
      const detailText = Array.isArray(apiData?.details)
        ? apiData.details.map((d) => `${d.field}: ${d.message}`).join(' • ')
        : '';
      setFormError(
        detailText ||
          apiData?.message ||
          'Unable to start support chat. Please try again.'
      );
    } finally {
      setCreatingTicket(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const trimmed = draftBody.trim();
    if (!trimmed || !activeTicket?._id) return;

    const clientMessageId = createClientMessageId();
    const optimisticMsg = {
      _id: `temp-${clientMessageId}`,
      ticketId: activeTicket._id,
      clientMessageId,
      senderId: currentUserId,
      senderRole: String(user?.role || (isHostPortal ? 'LANDLORD' : 'USER')).toUpperCase(),
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
          clientMessageId,
        });
        confirmedMsg = ackData?.message || ackData;
      } else {
        const restRes = await sendSupportMessageApi(activeTicket._id, {
          body: trimmed,
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

  const handleRetryMessage = async (failedMsg) => {
    if (!activeTicket?._id) return;
    setMessages((prev) =>
      prev.map((m) =>
        m.clientMessageId === failedMsg.clientMessageId
          ? { ...m, _optimisticStatus: 'sending' }
          : m
      )
    );

    try {
      const restRes = await sendSupportMessageApi(activeTicket._id, {
        body: failedMsg.body,
        clientMessageId: failedMsg.clientMessageId,
      });
      const confirmedMsg = restRes?.data?.message || restRes?.message;
      if (confirmedMsg?._id || confirmedMsg?.id) {
        setMessages((prev) => mergeMessages(prev, [confirmedMsg]));
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.clientMessageId === failedMsg.clientMessageId
            ? { ...m, _optimisticStatus: 'failed' }
            : m
        )
      );
    }
  };

  const handleChangeTicketStatus = async (nextStatus) => {
    if (!activeTicket?._id || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      const res = await updateSupportTicketStatusApi(activeTicket._id, nextStatus);
      const updated = normalizeTicket(
        res?.data?.ticket || res?.ticket || { ...activeTicket, status: nextStatus }
      );
      setActiveTicket((prev) => ({ ...prev, ...updated }));
      setTickets((prev) => upsertTicket(prev, updated));
    } catch (err) {
      console.error('[SupportDrawer] Failed to update status:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (!isOpen) return null;

  const isTicketClosed = activeTicket?.status === 'CLOSED';
  const isTicketResolved = activeTicket?.status === 'RESOLVED';
  const activeStatusBadge = STATUS_BADGES[activeTicket?.status] || STATUS_BADGES.OPEN;
  const validContextBookings = bookings.filter((b) =>
    OBJECT_ID_REGEX.test(
      String(b.isRawAsset ? b.assetId || b._id || b.id : b._id || b.id || '')
    )
  );

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-end justify-end sm:p-6 pointer-events-none">
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs sm:hidden pointer-events-auto"
        onClick={onClose}
      />

      {/* Main Drawer Window */}
      <div className="pointer-events-auto relative w-full h-[92vh] sm:w-[430px] sm:h-[640px] sm:max-h-[calc(100vh-3rem)] bg-white sm:rounded-3xl rounded-t-3xl shadow-[0_20px_60px_rgba(10,37,64,0.22)] border border-gray-200/80 flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200">
        {/* ================= HEADER ================= */}
        <div className="bg-[#0A2540] text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {view !== 'LIST' && (
              <button
                onClick={() => {
                  setView('LIST');
                  setActiveTicket(null);
                  setFormError('');
                }}
                className="p-1.5 -ml-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Back to conversations"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0 relative">
              <Headphones className="w-5 h-5 text-white" />
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0A2540] ${
                  agentsOnline ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
            </div>

            <div className="min-w-0">
              <h2 className="text-sm font-black tracking-tight truncate">
                {view === 'NEW'
                  ? isHostPortal
                    ? 'New Partner Support Request'
                    : 'New Support Request'
                  : view === 'CHAT'
                  ? activeTicket?.subject || 'Support Chat'
                  : isHostPortal
                  ? 'Rentals Africa Host Desk'
                  : 'Rentals Africa Concierge'}
              </h2>
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-white/75 mt-0.5">
                {!isConnected ? (
                  <>
                    <WifiOff className="w-3 h-3 text-amber-300" />
                    <span>{connectionError || 'Reconnecting...'}</span>
                  </>
                ) : view === 'CHAT' && counterpartyOnline ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Specialist in chat</span>
                  </>
                ) : agentsOnline ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Specialists online • Live reply</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3 text-amber-300" />
                    <span>24/7 Desk • Avg. reply under 5m</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close support drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= VIEW 1: CONVERSATION LIST ================= */}
        {view === 'LIST' && (
          <div className="flex-1 overflow-y-auto bg-[#F8F9FA] p-5 space-y-5">
            {/* Concierge Hero Banner */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
              <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-[#0A2540] mb-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  {isHostPortal
                    ? 'Host & Payout Operations'
                    : 'Escrow & Trip Protection'}
                </span>
              </div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">
                Hi {user?.firstName || (isHostPortal ? 'Partner' : 'there')}, how can we help?
              </h3>
              <p className="text-xs font-medium text-gray-500 mt-1 leading-relaxed">
                {isHostPortal
                  ? 'Chat live with our partner operations team for escrow releases, listing verification, or guest check-in support.'
                  : 'Chat live with our Lagos support desk for check-in help, escrow releases, or booking changes.'}
              </p>
              <button
                onClick={() => {
                  setCategory(defaultCategory);
                  setSelectedBookingId('');
                  setSubject('');
                  setInitialMessage('');
                  setFormError('');
                  setView('NEW');
                }}
                className="mt-4 w-full py-3 px-4 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99]"
              >
                <Plus className="w-4 h-4" />
                <span>Start New Conversation</span>
              </button>
            </div>

            {/* Active & Past Tickets */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-extrabold uppercase tracking-widest text-gray-400">
                  Your Conversations ({tickets.length})
                </span>
                <button
                  onClick={loadTickets}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-900 flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${ticketsLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {ticketsLoading && tickets.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mb-2 text-[#0A2540]" />
                  <span className="text-xs font-medium">Loading conversations...</span>
                </div>
              ) : tickets.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-2">
                  <p className="text-xs font-bold text-gray-700 mb-3">Quick Topics</p>
                  {categories.slice(0, 4).map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setCategory(cat.id);
                        setSubject(cat.label);
                        setView('NEW');
                      }}
                      className="w-full p-3 rounded-xl border border-gray-100 hover:border-gray-300 hover:bg-gray-50/70 transition-all flex items-center justify-between text-left group"
                    >
                      <div>
                        <div className="text-xs font-bold text-gray-900">{cat.label}</div>
                        <div className="text-[11px] text-gray-500 mt-0.5">{cat.description}</div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-900 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {tickets.map((ticket) => {
                    const badge = STATUS_BADGES[ticket.status] || STATUS_BADGES.OPEN;
                    const unread = Number(ticket.unreadByRequester || 0);

                    return (
                      <button
                        key={ticket._id}
                        onClick={() => handleOpenTicket(ticket)}
                        className={`w-full text-left bg-white p-4 rounded-2xl border transition-all hover:shadow-md ${
                          unread > 0
                            ? 'border-blue-300 bg-blue-50/20'
                            : 'border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                            {ticket.ticketCode || 'TICKET'}
                          </span>
                          <div className="flex items-center gap-2">
                            {unread > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-extrabold">
                                {unread} new
                              </span>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                          </div>
                        </div>

                        <div className="text-sm font-bold text-gray-900 truncate">
                          {ticket.subject}
                        </div>

                        <div className="flex items-center justify-between gap-3 mt-1.5">
                          <p className="text-xs text-gray-500 truncate">
                            {ticket.lastMessagePreview || 'Open conversation'}
                          </p>
                          <span className="text-[11px] font-medium text-gray-400 shrink-0">
                            {formatRelativeTime(ticket.lastMessageAt || ticket.createdAt)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= VIEW 2: NEW TICKET FORM ================= */}
        {view === 'NEW' && (
          <form
            onSubmit={handleCreateTicket}
            className="flex-1 overflow-y-auto bg-[#F8F9FA] p-5 flex flex-col justify-between gap-4"
          >
            <div className="space-y-4">
              {/* Topic Selector */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-2">
                  What do you need help with?
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {categories.map((cat) => {
                    const active = category === cat.id;
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          active
                            ? 'bg-gray-900 text-white border-gray-900 shadow-xs'
                            : 'bg-white text-gray-900 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-xs font-bold">{cat.label}</div>
                        <div
                          className={`text-[11px] mt-0.5 ${
                            active ? 'text-gray-300' : 'text-gray-500'
                          }`}
                        >
                          {cat.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Booking / Asset Linker */}
              {validContextBookings.length > 0 && (
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-1.5">
                    {isHostPortal
                      ? 'Related Booking or Asset (Optional)'
                      : 'Related Reservation (Optional)'}
                  </label>
                  <select
                    value={selectedBookingId}
                    onChange={(e) => setSelectedBookingId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-gray-900"
                  >
                    <option value="">
                      {isHostPortal
                        ? 'General inquiry (no specific booking or asset)'
                        : 'General inquiry (no specific booking)'}
                    </option>
                    {validContextBookings.map((b) => {
                      const itemId = String(b._id || b.id);
                      const { label, meta } = formatContextOption(b);
                      return (
                        <option key={itemId} value={itemId}>
                          {meta ? `${label} (${meta})` : label}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Subject */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-1.5">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={
                    isHostPortal
                      ? 'e.g., Escrow release for completed weekend stay'
                      : 'e.g., Need gate access code for Lekki apartment'
                  }
                  maxLength={140}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900"
                />
              </div>

              {/* Initial Message */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-1.5">
                  Message
                </label>
                <textarea
                  rows={4}
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                  placeholder="Share any helpful details so we can resolve this quickly..."
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 resize-none"
                />
              </div>
            </div>

            <div className="space-y-3">
              {formError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={creatingTicket}
                className="w-full py-3.5 px-4 bg-gray-900 hover:bg-black text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-60"
              >
                {creatingTicket ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting to Desk...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Start Live Chat</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ================= VIEW 3: ACTIVE CHAT THREAD ================= */}
        {view === 'CHAT' && activeTicket && (
          <>
            {/* Ticket Meta & Status Bar */}
            <div className="bg-gray-50 border-b border-gray-200/80 px-4 py-2.5 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[11px] font-extrabold text-gray-500">
                  {activeTicket.ticketCode}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${activeStatusBadge.className}`}
                >
                  {activeStatusBadge.label}
                </span>
              </div>

              {!isTicketClosed && !isTicketResolved && (
                <button
                  onClick={() => handleChangeTicketStatus('RESOLVED')}
                  disabled={isUpdatingStatus}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                >
                  <CheckCircle className="w-3 h-3" />
                  <span>Mark Resolved</span>
                </button>
              )}

              {isTicketResolved && (
                <button
                  onClick={() => handleChangeTicketStatus('OPEN')}
                  disabled={isUpdatingStatus}
                  className="text-[11px] font-bold text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg transition-colors"
                >
                  Reopen
                </button>
              )}
            </div>

            {/* Messages Feed */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto bg-[#F8F9FA] p-4 space-y-3"
            >
              {nextCursor && (
                <div className="text-center pb-2">
                  <button
                    onClick={handleLoadOlder}
                    disabled={loadingOlder}
                    className="px-3 py-1 rounded-full bg-white border border-gray-200 text-[11px] font-bold text-gray-600 hover:text-gray-900 shadow-2xs"
                  >
                    {loadingOlder ? 'Loading...' : 'Load earlier messages'}
                  </button>
                </div>
              )}

              {messagesLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mb-2 text-[#0A2540]" />
                  <span className="text-xs font-medium">Loading messages...</span>
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

                  const isMine = msg.senderRole !== 'ADMIN';
                  const isFailed = msg._optimisticStatus === 'failed';
                  const isSending = msg._optimisticStatus === 'sending';

                  return (
                    <div
                      key={key}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      {!isMine && (
                        <span className="text-[10px] font-bold text-gray-400 ml-1 mb-1">
                          {msg.senderDisplayName || 'Rentals Africa Support'}
                        </span>
                      )}

                      <div
                        className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-2xs ${
                          isMine
                            ? 'bg-[#0A2540] text-white rounded-br-sm'
                            : 'bg-white text-gray-900 border border-gray-100 rounded-bl-sm'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                      </div>

                      <div className="flex items-center gap-1.5 mt-1 px-1">
                        <span className="text-[10px] font-medium text-gray-400">
                          {formatMessageTime(msg.createdAt)}
                        </span>

                        {isMine && (
                          <>
                            {isSending ? (
                              <Clock className="w-3 h-3 text-gray-400" />
                            ) : isFailed ? (
                              <button
                                onClick={() => handleRetryMessage(msg)}
                                className="text-[10px] font-bold text-red-600 hover:underline"
                              >
                                Failed • Tap to retry
                              </button>
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

              {/* Live Typing Bubble */}
              {typingState && typingState.ticketId === activeTicket._id && (
                <div className="flex items-start">
                  <div className="bg-white border border-gray-100 px-3.5 py-2.5 rounded-2xl rounded-bl-sm shadow-2xs flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Composer or Closed Banner */}
            {isTicketClosed ? (
              <div className="p-4 bg-white border-t border-gray-200 text-center shrink-0">
                <p className="text-xs font-semibold text-gray-500 mb-2">
                  This support ticket has been closed.
                </p>
                <button
                  onClick={() => {
                    setSelectedBookingId('');
                    setSubject('');
                    setInitialMessage('');
                    setView('NEW');
                  }}
                  className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold"
                >
                  Start a New Request
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSendMessage}
                className="p-3 bg-white border-t border-gray-200/80 flex items-end gap-2 shrink-0"
              >
                <textarea
                  rows={1}
                  value={draftBody}
                  onChange={(e) => {
                    setDraftBody(e.target.value);
                    emitTyping(e.target.value.trim().length > 0, activeTicket._id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder="Write a message..."
                  className="flex-1 max-h-28 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-gray-900 resize-none"
                />
                <button
                  type="submit"
                  disabled={!draftBody.trim()}
                  className="p-3 rounded-2xl bg-[#0A2540] hover:bg-black text-white disabled:opacity-40 transition-all shrink-0 shadow-xs active:scale-95"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}