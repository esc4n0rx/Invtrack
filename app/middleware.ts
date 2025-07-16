// middleware.ts (criar se não existir)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Permitir acesso aos arquivos de upload
  if (request.nextUrl.pathname.startsWith('/uploads/')) {
    return NextResponse.next()
  }
}

export const config = {
  matcher: '/uploads/:path*'
}