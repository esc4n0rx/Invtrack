// lib/integrator-notifications.ts (corrigido)
import { supabaseClient } from '@/lib/supabase'

export interface IntegratorNotification {
  type: 'new_records' | 'sync_complete' | 'sync_error' | 'config_change'
  title: string
  message: string
  count?: number
  timestamp: Date
  details?: any
}

export class IntegratorNotificationService {
  private static instance: IntegratorNotificationService
  private subscribers: ((notification: IntegratorNotification) => void)[] = []
  private isClient: boolean

  constructor() {
    this.isClient = typeof window !== 'undefined'
  }

  static getInstance(): IntegratorNotificationService {
    if (!IntegratorNotificationService.instance) {
      IntegratorNotificationService.instance = new IntegratorNotificationService()
    }
    return IntegratorNotificationService.instance
  }

  subscribe(callback: (notification: IntegratorNotification) => void) {
    this.subscribers.push(callback)
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback)
    }
  }

  private notify(notification: IntegratorNotification) {
    this.subscribers.forEach(callback => callback(notification))
  }

  // Notificações específicas para diferentes eventos (apenas notifica subscribers)
  notifyNewRecords(count: number, tableName: string) {
    const notification: IntegratorNotification = {
      type: 'new_records',
      title: 'Novas Contagens Detectadas',
      message: `${count} nova(s) contagem(ns) encontrada(s) em ${tableName}`,
      count,
      timestamp: new Date()
    }
    
    this.notify(notification)
  }

  notifySyncComplete(processed: number, failed: number, duration: number) {
    const notification: IntegratorNotification = {
      type: 'sync_complete',
      title: 'Sincronização Concluída',
      message: `${processed} processados, ${failed} falhas em ${duration}ms`,
      count: processed,
      timestamp: new Date(),
      details: { processed, failed, duration }
    }
    
    this.notify(notification)
  }

  notifySyncError(error: string) {
    const notification: IntegratorNotification = {
      type: 'sync_error',
      title: 'Erro na Sincronização',
      message: error,
      timestamp: new Date()
    }
    
    this.notify(notification)
  }

  // Configurar listeners para eventos do banco (apenas no cliente)
  setupRealtimeListeners() {
    if (!this.isClient) return

    // Listener para eventos de integração
    supabaseClient
      .channel('integrator-events')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'invtrack_integrator_events' 
        }, 
        (payload) => {
          const { event_type, processed_count, details } = payload.new
          
          if (event_type === 'new_integration' && processed_count > 0) {
            this.notifyNewRecords(processed_count, details?.table_name || 'externa')
          }
        }
      )
      .subscribe()

    // Listener para logs de sucesso
    supabaseClient
      .channel('integrator-success-logs')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'invtrack_integrator_logs',
          filter: 'type=eq.success'
        }, 
        (payload) => {
          const { message, details, processed_count } = payload.new
          
          if (message.includes('Sincronização concluída') && processed_count > 0) {
            this.notifySyncComplete(
              processed_count, 
              details?.errors || 0,
              details?.duration || 0
            )
          }
        }
      )
      .subscribe()
  }
}

// Instância singleton
export const notificationService = IntegratorNotificationService.getInstance()