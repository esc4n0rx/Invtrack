// components/integrator/IntegratorNotifications.tsx
"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { Bell, CheckCircle, AlertCircle, Info, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { IntegratorNotification } from '@/lib/integrator-notifications'

interface IntegratorNotificationsProps {
  notifications: IntegratorNotification[]
}

export function IntegratorNotifications({ notifications }: IntegratorNotificationsProps) {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_records':
        return <Info className="h-4 w-4 text-blue-400" />
      case 'sync_complete':
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'sync_error':
        return <AlertCircle className="h-4 w-4 text-red-400" />
      default:
        return <Bell className="h-4 w-4 text-gray-400" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'new_records':
        return 'border-blue-700 bg-blue-900/20'
      case 'sync_complete':
        return 'border-green-700 bg-green-900/20'
      case 'sync_error':
        return 'border-red-700 bg-red-900/20'
      default:
        return 'border-gray-700 bg-gray-900/20'
    }
  }

  if (notifications.length === 0) {
    return null
  }

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-gray-100 flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações do Integrador
          </CardTitle>
          <Badge variant="secondary">
            {notifications.length} notificação(ões)
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-3">
            <AnimatePresence>
              {notifications.slice(0, 10).map((notification, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-3 rounded-lg border ${getNotificationColor(notification.type)}`}
                >
                  <div className="flex items-start gap-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-200">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {notification.timestamp.toLocaleTimeString('pt-BR')}
                        </span>
                        {notification.count && (
                          <Badge variant="outline" className="text-xs">
                            {notification.count} itens
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}