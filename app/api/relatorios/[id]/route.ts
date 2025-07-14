// app/api/relatorios/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function DELETE(
 request: NextRequest,
 { params }: { params: { id: string } }
) {
 try {
   const { id } = params

   if (!id) {
     return NextResponse.json({
       success: false,
       error: 'ID do relatório é obrigatório'
     }, { status: 400 })
   }

   // Verificar se o relatório existe
   const { data: relatorio, error: errorBusca } = await supabaseServer
     .from('invtrack_relatorios')
     .select('id, nome')
     .eq('id', id)
     .single()

   if (errorBusca || !relatorio) {
     return NextResponse.json({
       success: false,
       error: 'Relatório não encontrado'
     }, { status: 404 })
   }

   // Excluir relatório
   const { error: errorExclusao } = await supabaseServer
     .from('invtrack_relatorios')
     .delete()
     .eq('id', id)

   if (errorExclusao) {
     console.error('Erro ao excluir relatório:', errorExclusao)
     return NextResponse.json({
       success: false,
       error: 'Erro ao excluir relatório'
     }, { status: 500 })
   }

   return NextResponse.json({
     success: true,
     message: `Relatório "${relatorio.nome}" excluído com sucesso`
   })

 } catch (error) {
   console.error('Erro interno:', error)
   return NextResponse.json({
     success: false,
     error: 'Erro interno do servidor'
   }, { status: 500 })
 }
}

export async function GET(
 request: NextRequest,
 { params }: { params: { id: string } }
) {
 try {
   const { id } = params

   if (!id) {
     return NextResponse.json({
       success: false,
       error: 'ID do relatório é obrigatório'
     }, { status: 400 })
   }

   const { data: relatorio, error } = await supabaseServer
     .from('invtrack_relatorios')
     .select('*')
     .eq('id', id)
     .single()

   if (error || !relatorio) {
     return NextResponse.json({
       success: false,
       error: 'Relatório não encontrado'
     }, { status: 404 })
   }

   return NextResponse.json({
     success: true,
     data: relatorio
   })

 } catch (error) {
   console.error('Erro interno:', error)
   return NextResponse.json({
     success: false,
     error: 'Erro interno do servidor'
   }, { status: 500 })
 }
}