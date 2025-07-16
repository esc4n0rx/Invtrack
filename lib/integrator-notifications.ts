// lib/integrator-notifications.ts
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

  // Notificações específicas para diferentes eventos
  notifyNewRecords(count: number, details?: any) {
    const notification: IntegratorNotification = {
      type: 'new_records',
      title: 'Novas Contagens Capturadas',
      message: `${count} contagens processadas pelo integrator`,
      count,
      timestamp: new Date(),
      details
    }
    
    this.notify(notification)
  }

  notifySyncComplete(processed: number, failed: number, duration: number) {
    const notification: IntegratorNotification = {
      type: 'sync_complete',
      title: 'Verificação Concluída',
      message: `${processed} processadas, ${failed} falhas em ${duration}ms`,
      count: processed,
      timestamp: new Date(),
      details: { processed, failed, duration }
    }
    
    this.notify(notification)
  }

  notifySyncError(error: string, details?: any) {
    const notification: IntegratorNotification = {
      type: 'sync_error',
      title: 'Erro no Integrator',
      message: error,
      timestamp: new Date(),
      details
    }
    
    this.notify(notification)
  }

  notifyConfigChange(isActive: boolean) {
    const notification: IntegratorNotification = {
      type: 'config_change',
      title: 'Status do Integrator Alterado',
      message: `Monitor ${isActive ? 'ativado' : 'desativado'}`,
      timestamp: new Date(),
      details: { isActive }
    }
    
    this.notify(notification)
  }

  // Configurar listeners para eventos do banco (apenas no cliente)
  setupRealtimeListeners() {
    if (!this.isClient) return

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
          const log = payload.new
          
          if (log.processed_count > 0) {
            this.notifyNewRecords(log.processed_count, log.details)
          }
        }
      )
      .subscribe()

    // Listener para erros
    supabaseClient
      .channel('integrator-error-logs')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'invtrack_integrator_logs',
          filter: 'type=eq.error'
        }, 
        (payload) => {
          const log = payload.new
          this.notifySyncError(log.message, log.details)
        }
      )
      .subscribe()

    // Listener para mudanças na configuração
    supabaseClient
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
            this.notifyConfigChange(newConfig.is_active)
          }
        }
      )
      .subscribe()
  }
}

// Instância singleton
export const notificationService = IntegratorNotificationService.getInstance()