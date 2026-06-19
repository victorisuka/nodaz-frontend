import { useEffect, useEffectEvent, useMemo, useState } from 'react'

import { getRealtimeUrl, supportsRealtime } from '../lib/api.js'

const MAX_NOTIFICATIONS = 10
const CONNECT_DELAY_MS = 0

function normalizeNotification(event) {
  return {
    id: event.id ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: event.type ?? 'system.info',
    title: event.title ?? 'Marketplace update',
    message: event.message ?? 'A new live update is available.',
    createdAt: event.createdAt ?? new Date().toISOString(),
    entity: event.entity ?? null,
    read: false,
  }
}

export function useRealtimeNotifications({ enabled = true, onEvent, shouldDisplayEvent }) {
  const [items, setItems] = useState([])
  const [status, setStatus] = useState(enabled && supportsRealtime ? 'connecting' : 'idle')

  const shouldDisplay = useEffectEvent((event) => {
    if (!shouldDisplayEvent) {
      return true
    }

    return shouldDisplayEvent(event)
  })

  const handleEvent = useEffectEvent((event) => {
    if (!event) {
      return
    }

    if (!shouldDisplay(event)) {
      return
    }

    if (event.type === 'system.ready') {
      setStatus('connected')
      return
    }

    const notification = normalizeNotification(event)

    setItems((current) => [notification, ...current].slice(0, MAX_NOTIFICATIONS))
    onEvent?.(notification)
  })

  useEffect(() => {
    if (!enabled || !supportsRealtime) {
      setStatus('idle')
      return undefined
    }

    const realtimeUrl = getRealtimeUrl()

    if (!realtimeUrl) {
      setStatus('idle')
      return undefined
    }

    setStatus('connecting')

    let socket = null
    const connectTimer = window.setTimeout(() => {
      socket = new WebSocket(realtimeUrl)

      socket.addEventListener('open', () => {
        setStatus('connected')
      })

      socket.addEventListener('message', (message) => {
        try {
          handleEvent(JSON.parse(message.data))
        } catch {
          setStatus('connected')
        }
      })

      socket.addEventListener('close', () => {
        setStatus('disconnected')
      })

      socket.addEventListener('error', () => {
        setStatus('disconnected')
      })
    }, CONNECT_DELAY_MS)

    return () => {
      window.clearTimeout(connectTimer)
      socket?.close()
    }
  }, [enabled])

  const unreadCount = useMemo(
    () => items.reduce((count, item) => count + (item.read ? 0 : 1), 0),
    [items],
  )

  function dismiss(id) {
    setItems((current) => current.filter((item) => item.id !== id))
  }

  function markAllRead() {
    setItems((current) => current.map((item) => ({ ...item, read: true })))
  }

  return {
    items,
    status,
    unreadCount,
    dismiss,
    markAllRead,
  }
}