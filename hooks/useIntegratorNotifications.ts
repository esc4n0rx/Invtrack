// hooks/useIntegratorNotifications.ts
"use client"

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabaseClient } from '@/lib/supabase'

export interface IntegratorNotification {
  type: 'new_records' | 'sync_complete' | 'sync_error' | 'config_change'
  title: string
  message: string
  count?: number
  timestamp: Date
  details?: any
}

export function useIntegratorNotifications() {
  const [notifications, setNotifications] = useState<IntegratorNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Subscription para logs de sucesso do integrator
    const subscription = supabaseClient
      .channel('integrator-notifications')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'invtrack_integrator_logs' 
        }, 
        (payload) => {
          const log = payload.new
          
          if (log.type === 'success' && log.processed_count > 0) {
            const notification: IntegratorNotification = {
              type: 'new_records',
              title: 'Novas Contagens Capturadas',
              message: `${log.processed_count} contagens processadas pelo integrator`,
              count: log.processed_count,
              timestamp: new Date(log.created_at),
              details: log.details
            }
            
            setNotifications(prev => [notification, ...prev.slice(0, 49)])
            setUnreadCount(prev => prev + 1)
            
            // Toast para notificação
            toast.success(notification.title, {
              description: notification.message,
              duration: 5000
            })
          }
          
          if (log.type === 'error') {
            const notification: IntegratorNotification = {
              type: 'sync_error',
              title: 'Erro no Integrator',
              message: log.message,
              timestamp: new Date(log.created_at),
              details: log.details
            }
            
            setNotifications(prev => [notification, ...prev.slice(0, 49)])
            setUnreadCount(prev => prev + 1)
            
            // Toast para erro
            toast.error(notification.title, {
              description: notification.message,
              duration: 8000
            })
          }
        }
      )
      .subscribe()

    return () => { subscription.unsubscribe() }
  }, [])

  // Subscription para mudanças na configuração
  useEffect(() => {
    const subscription = supabaseClient
      .channel('integrator-config-changes')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'invtrack_integrator_config' 
        }, 
        (payload) => {
          const oldConfig = payload.old
          const newConfig = payload.new
          
          if (oldConfig.is_active !== newConfig.is_active) {
            const notification: IntegratorNotification = {
              type: 'config_change',
              title: 'Status do Integrator Alterado',
              message: `Monitor ${newConfig.is_active ? 'ativado' : 'desativado'}`,
              timestamp: new Date(newConfig.updated_at),
              details: { oldActive: oldConfig.is_active, newActive: newConfig.is_active }
            }
            
            setNotifications(prev => [notification, ...prev.slice(0, 49)])
            setUnreadCount(prev => prev + 1)
          }
        }
      )
      .subscribe()

    return () => { subscription.unsubscribe() }
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