// app/api/inventarios/download/[filename]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params
    
    // Validar nome do arquivo
    if (!filename.match(/^inventario_[A-Za-z0-9_-]+_\d{4}-\d{2}-\d{2}\.xlsx$/)) {
      return NextResponse.json({
        success: false,
        error: 'Nome de arquivo inválido'
      }, { status: 400 })
    }

    // Caminho do arquivo
    const caminhoArquivo = join(process.cwd(), 'public', 'uploads', 'inventarios', filename)
    
    // Verificar se arquivo existe
    if (!existsSync(caminhoArquivo)) {
      return NextResponse.json({
        success: false,
        error: 'Arquivo não encontrado'
      }, { status: 404 })
    }

    // Ler arquivo
    const buffer = await readFile(caminhoArquivo)

    // Retornar arquivo para download
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=86400', // Cache por 24 horas
        'Content-Length': buffer.length.toString()
      }
    })

  } catch (error) {
    console.error('Erro no download:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}