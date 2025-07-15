// hooks/useIntegratorNotifications.ts (atualizado)
"use client"

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { IntegratorNotification, notificationService } from '@/lib/integrator-notifications'

export function useIntegratorNotifications() {
  const [notifications, setNotifications] = useState<IntegratorNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Configurar listeners em tempo real
    notificationService.setupRealtimeListeners()

    // Subscription para novas notificações
    const unsubscribe = notificationService.subscribe((notification) => {
      setNotifications(prev => [notification, ...prev.slice(0, 49)]) // Manter últimas 50
      setUnreadCount(prev => prev + 1)

      // Mostrar toast baseado no tipo
      switch (notification.type) {
        case 'new_records':
          toast.info(notification.title, {
            description: notification.message,
            duration: 5000
          })
          break
        case 'sync_complete':
          if (notification.details?.failed === 0) {
            toast.success(notification.title, {
              description: notification.message,
              duration: 4000
            })
          } else {
            toast(notification.title, {
              description: notification.message,
              duration: 6000
            })
          }
          break
        case 'sync_error':
          toast.error(notification.title, {
            description: notification.message,
            duration: 8000
          })
          break
        default:
          toast(notification.title, {
            description: notification.message,
            duration: 4000
          })
      }
    })

    return unsubscribe
  }, [])

  const markAsRead = () => {
    setUnreadCount(0)
  }

  const clearNotifications = () => {
    setNotifications([])
    setUnreadCount(0)
  }

  return {
    notifications,
    unreadCount,
    markAsRead,
    clearNotifications
  }
}