'use client';

import { useEffect, useRef } from 'react';
import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuthStore } from '@/stores/authStore';
import type { LiveVoteUpdate, SpinSyncMessage, RouletteUpdateMessage } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

interface UseGroupSocketOptions {
  groupId:           string | null;
  onVoteUpdate?:     (update: LiveVoteUpdate)     => void;
  onSpinSync?:       (msg: SpinSyncMessage)       => void;
  onRouletteUpdate?: (msg: RouletteUpdateMessage) => void;
}

export function useGroupSocket({ groupId, onVoteUpdate, onSpinSync, onRouletteUpdate }: UseGroupSocketOptions) {
  const clientRef    = useRef<Client | null>(null);
  const accessToken  = useAuthStore((s) => s.accessToken);

  // Refs pour toujours appeler la dernière version des callbacks
  // sans avoir à recréer la connexion STOMP à chaque render
  const onVoteUpdateRef     = useRef(onVoteUpdate);
  const onSpinSyncRef       = useRef(onSpinSync);
  const onRouletteUpdateRef = useRef(onRouletteUpdate);

  useEffect(() => { onVoteUpdateRef.current     = onVoteUpdate;     });
  useEffect(() => { onSpinSyncRef.current       = onSpinSync;       });
  useEffect(() => { onRouletteUpdateRef.current = onRouletteUpdate; });

  useEffect(() => {
    if (!groupId || !accessToken) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${BASE_URL}/ws`),
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 5000,

      onConnect: () => {
        // Vote live updates
        client.subscribe(`/topic/group/${groupId}/vote`, (msg: IMessage) => {
          try { onVoteUpdateRef.current?.(JSON.parse(msg.body)); } catch {}
        });

        // Spin synchronisé (tous les membres voient la même animation)
        client.subscribe(`/topic/group/${groupId}/spin`, (msg: IMessage) => {
          try { onSpinSyncRef.current?.(JSON.parse(msg.body)); } catch {}
        });

        // Propositions de roulette + démarrage
        client.subscribe(`/topic/group/${groupId}/roulette`, (msg: IMessage) => {
          try { onRouletteUpdateRef.current?.(JSON.parse(msg.body)); } catch {}
        });
      },

      onStompError: (frame) => {
        console.warn('[STOMP] error', frame.headers['message']);
      },
    });

    clientRef.current = client;
    client.activate();

    return () => {
      if (clientRef.current?.active) clientRef.current.deactivate();
    };
  }, [groupId, accessToken]); // reconnexion uniquement si groupe ou token change
}
