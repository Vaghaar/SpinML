'use client';

import { useEffect, useRef } from 'react';
import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuthStore } from '@/stores/authStore';
import type { SpinSyncMessage } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

interface UseRouletteSocketOptions {
  rouletteId: string | null;
  onSpinSync?: (msg: SpinSyncMessage) => void;
}

/**
 * Abonnement WebSocket au topic /topic/roulette/{rouletteId}/spin.
 * Utilise l'ID de la roulette directement (disponible dès l'URL),
 * sans attendre le chargement des données de la roulette.
 */
export function useRouletteSocket({ rouletteId, onSpinSync }: UseRouletteSocketOptions) {
  const clientRef   = useRef<Client | null>(null);
  const accessToken = useAuthStore((s) => s.accessToken);
  const onSpinRef   = useRef(onSpinSync);

  useEffect(() => { onSpinRef.current = onSpinSync; });

  useEffect(() => {
    if (!rouletteId || !accessToken) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${BASE_URL}/ws`),
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 5000,

      onConnect: () => {
        client.subscribe(`/topic/roulette/${rouletteId}/spin`, (msg: IMessage) => {
          try { onSpinRef.current?.(JSON.parse(msg.body)); } catch {}
        });
      },

      onStompError: (frame) => {
        console.warn('[STOMP] roulette error', frame.headers['message']);
      },
    });

    clientRef.current = client;
    client.activate();

    return () => {
      if (clientRef.current?.active) clientRef.current.deactivate();
    };
  }, [rouletteId, accessToken]);
}
