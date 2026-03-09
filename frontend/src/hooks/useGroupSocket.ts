'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuthStore } from '@/stores/authStore';
import type { LiveVoteUpdate, SpinSyncMessage, RouletteUpdateMessage } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

interface UseGroupSocketOptions {
  groupId: string | null;
  onVoteUpdate?:     (update: LiveVoteUpdate)          => void;
  onSpinSync?:       (msg: SpinSyncMessage)            => void;
  onRouletteUpdate?: (msg: RouletteUpdateMessage)      => void;
}

export function useGroupSocket({ groupId, onVoteUpdate, onSpinSync, onRouletteUpdate }: UseGroupSocketOptions) {
  const clientRef    = useRef<Client | null>(null);
  const connectedRef = useRef(false);
  const accessToken  = useAuthStore((s) => s.accessToken);

  const disconnect = useCallback(() => {
    if (clientRef.current?.active) {
      clientRef.current.deactivate();
    }
    connectedRef.current = false;
  }, []);

  useEffect(() => {
    if (!groupId || !accessToken) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${BASE_URL}/ws`),
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
      reconnectDelay: 5000,

      onConnect: () => {
        connectedRef.current = true;

        // Subscribe vote updates
        client.subscribe(`/topic/group/${groupId}/vote`, (msg: IMessage) => {
          try {
            const data: LiveVoteUpdate = JSON.parse(msg.body);
            onVoteUpdate?.(data);
          } catch { /* ignore malformed */ }
        });

        // Subscribe spin sync
        client.subscribe(`/topic/group/${groupId}/spin`, (msg: IMessage) => {
          try {
            const data: SpinSyncMessage = JSON.parse(msg.body);
            onSpinSync?.(data);
          } catch { /* ignore malformed */ }
        });

        // Subscribe roulette updates (propositions, démarrage)
        client.subscribe(`/topic/group/${groupId}/roulette`, (msg: IMessage) => {
          try {
            const data: RouletteUpdateMessage = JSON.parse(msg.body);
            onRouletteUpdate?.(data);
          } catch { /* ignore malformed */ }
        });
      },

      onDisconnect: () => {
        connectedRef.current = false;
      },

      onStompError: (frame) => {
        console.warn('[STOMP] error', frame.headers['message']);
      },
    });

    clientRef.current = client;
    client.activate();

    return () => {
      disconnect();
    };
  }, [groupId, accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  return { disconnect };
}
