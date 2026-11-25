import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { apiClient } from '../api/client';

export const createClientMessageId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

const resolveSocketOrigin = () => {
  const envUrl =
    import.meta?.env?.VITE_SOCKET_URL || import.meta?.env?.VITE_API_URL;
  const rawBase = envUrl || apiClient?.defaults?.baseURL || '';

  if (rawBase && /^https?:\/\//i.test(rawBase)) {
    return rawBase.replace(/\/api(\/v\d+)?\/?$/i, '').replace(/\/+$/, '');
  }

  return 'http://localhost:8000';
};

const resolveAuthToken = () => {
  const candidateKeys = [
    'rentals_token',
    'token',
    'accessToken',
    'authToken',
    'jwt',
  ];

  for (const key of candidateKeys) {
    const val = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (typeof val === 'string' && val.trim() && val !== 'undefined' && val !== 'null') {
      return {
        token: val.replace(/^Bearer\s+/i, '').trim(),
        source: `storage:${key}`,
      };
    }
  }

  // Check if user object in storage embeds a token field
  try {
    const rawUser = localStorage.getItem('user') || localStorage.getItem('rentals_user');
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      const nestedToken = parsed?.token || parsed?.accessToken;
      if (typeof nestedToken === 'string' && nestedToken.trim()) {
        return {
          token: nestedToken.replace(/^Bearer\s+/i, '').trim(),
          source: 'storage:user.token',
        };
      }
    }
  } catch {
    // Ignore JSON parse errors
  }

  const headerAuth = apiClient?.defaults?.headers?.common?.Authorization;
  if (typeof headerAuth === 'string' && headerAuth.trim()) {
    return {
      token: headerAuth.replace(/^Bearer\s+/i, '').trim(),
      source: 'axios:defaults.Authorization',
    };
  }

  return { token: null, source: 'none' };
};

export function useSupportSocket({
  enabled = true,
  activeTicketId = null,
  lastKnownMessageId = null,
  onNewMessage,
  onTicketCreated,
  onTicketUpdated,
  onTicketStateChanged,
  onInternalNote,
  onQueueNewTicket,
  onQueueTicketUpdated,
  onRead,
  onSyncRecovered,
} = {}) {
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [agentsOnline, setAgentsOnline] = useState(false);
  const [onlineAgentsCount, setOnlineAgentsCount] = useState(0);
  const [counterpartyOnline, setCounterpartyOnline] = useState(false);
  const [typingState, setTypingState] = useState(null);

  const callbacksRef = useRef({
    onNewMessage,
    onTicketCreated,
    onTicketUpdated,
    onTicketStateChanged,
    onInternalNote,
    onQueueNewTicket,
    onQueueTicketUpdated,
    onRead,
    onSyncRecovered,
  });

  useEffect(() => {
    callbacksRef.current = {
      onNewMessage,
      onTicketCreated,
      onTicketUpdated,
      onTicketStateChanged,
      onInternalNote,
      onQueueNewTicket,
      onQueueTicketUpdated,
      onRead,
      onSyncRecovered,
    };
  });

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const { token, source: tokenSource } = resolveAuthToken();
    const socketOrigin = resolveSocketOrigin();
    const namespaceUrl = `${socketOrigin}/support`;

    


    const socket = io(namespaceUrl, {
      auth: token ? { token } : {},
      withCredentials: true,
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.info('[SupportSocket:DEBUG] Connected!', {
        socketId: socket.id,
        transport: socket.io.engine?.transport?.name,
      });
      setIsConnected(true);
      setConnectionError(null);
    });

    socket.io.engine?.on('upgrade', (transport) => {
      console.debug('[SupportSocket:DEBUG] Upgraded transport to:', transport?.name);
    });

    socket.on('disconnect', (reason, details) => {
      console.warn('[SupportSocket:DEBUG] Disconnected:', { reason, details });
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('[SupportSocket:DEBUG] Connection error:', {
        message: err?.message,
        data: err?.data,
        description: err?.description,
        context: err?.context,
      });
      setIsConnected(false);
      setConnectionError(err?.data?.message || err?.message || 'Unable to connect');
    });

    socket.on('support:connected', (payload) => {
      console.debug('[SupportSocket:DEBUG] Server handshake confirmed:', payload);
      setIsConnected(true);
      setConnectionError(null);
      setAgentsOnline(Boolean(payload?.agentsOnline));
      setOnlineAgentsCount(Number(payload?.onlineAgentsCount || 0));
    });

    socket.on('support:message:new', (payload) => {
      setTypingState((prev) =>
        prev && prev.ticketId === payload?.ticketId ? null : prev
      );
      callbacksRef.current.onNewMessage?.(payload);
    });

    socket.on('support:internal_note:new', (payload) => {
      callbacksRef.current.onInternalNote?.(payload);
    });

    socket.on('support:ticket:created', (payload) => {
      callbacksRef.current.onTicketCreated?.(payload);
    });

    socket.on('support:ticket:updated', (payload) => {
      callbacksRef.current.onTicketUpdated?.(payload);
    });

    socket.on('support:ticket:state_changed', (payload) => {
      callbacksRef.current.onTicketStateChanged?.(payload);
    });

    socket.on('support:queue:new_ticket', (payload) => {
      callbacksRef.current.onQueueNewTicket?.(payload);
    });

    socket.on('support:queue:ticket_updated', (payload) => {
      callbacksRef.current.onQueueTicketUpdated?.(payload);
    });

    socket.on('support:read', (payload) => {
      callbacksRef.current.onRead?.(payload);
    });

    socket.on('support:presence:update', (payload) => {
      if (payload?.ticketId === activeTicketId) {
        setCounterpartyOnline(Boolean(payload?.isOnline));
      }
    });

    socket.on('support:typing', (payload) => {
      if (!payload?.ticketId) return;
      if (payload.isTyping) {
        setTypingState({
          ticketId: payload.ticketId,
          senderRole: payload.senderRole,
          senderDisplayName: payload.senderDisplayName,
        });
      } else {
        setTypingState((prev) =>
          prev && prev.ticketId === payload.ticketId ? null : prev
        );
      }
    });

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [enabled]);

  // Join active ticket room & sync any missed messages upon connect/switch
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !isConnected || !activeTicketId) {
      setCounterpartyOnline(false);
      return undefined;
    }

    socket.emit('support:join_ticket', { ticketId: activeTicketId }, (ack) => {
      console.debug('[SupportSocket:DEBUG] join_ticket ack:', ack);
      if (ack?.success) {
        setCounterpartyOnline(Boolean(ack.data?.counterpartyOnline));
      }
    });

    if (lastKnownMessageId) {
      socket.emit(
        'support:sync',
        { ticketId: activeTicketId, afterMessageId: lastKnownMessageId },
        (ack) => {
          if (ack?.success) {
            callbacksRef.current.onSyncRecovered?.(ack.data);
          }
        }
      );
    }

    return () => {
      if (socket.connected) {
        socket.emit('support:leave_ticket', { ticketId: activeTicketId });
      }
    };
  }, [isConnected, activeTicketId, lastKnownMessageId]);

  const sendMessage = useCallback(
    ({ ticketId, body, visibility = 'PUBLIC', clientMessageId }) =>
      new Promise((resolve, reject) => {
        const socket = socketRef.current;
        if (!socket || !socket.connected) {
          reject(new Error('Socket disconnected'));
          return;
        }

        socket.emit(
          'support:message:send',
          {
            ticketId,
            body,
            visibility,
            clientMessageId: clientMessageId || createClientMessageId(),
          },
          (ack) => {
            if (ack?.success) {
              resolve(ack.data);
            } else {
              reject(new Error(ack?.message || 'Failed to send message'));
            }
          }
        );
      }),
    []
  );

  const emitTyping = useCallback((isTyping, ticketId) => {
    const socket = socketRef.current;
    if (!socket || !socket.connected || !ticketId) return;

    if (isTyping) {
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        socket.emit('support:typing', { ticketId, isTyping: true });
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        socket.emit('support:typing', { ticketId, isTyping: false });
      }, 2000);
    } else {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTypingRef.current) {
        isTypingRef.current = false;
        socket.emit('support:typing', { ticketId, isTyping: false });
      }
    }
  }, []);

  const markTicketRead = useCallback(
    (ticketId) =>
      new Promise((resolve, reject) => {
        const socket = socketRef.current;
        if (!socket || !socket.connected || !ticketId) {
          reject(new Error('Socket disconnected'));
          return;
        }
        socket.emit('support:mark_read', { ticketId }, (ack) => {
          if (ack?.success) resolve(ack.data);
          else reject(new Error(ack?.message || 'Failed to mark read'));
        });
      }),
    []
  );

  return {
    isConnected,
    connectionError,
    agentsOnline,
    onlineAgentsCount,
    counterpartyOnline,
    typingState,
    sendMessage,
    emitTyping,
    markTicketRead,
  };
}