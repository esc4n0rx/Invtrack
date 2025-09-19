// app/api/lojas/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase"
import { LojaRegional, LojaRegionalPayload } from "@/types/loja"

const TABLE_NAME = "invtrack_lojas_regionais"

function mapRowToLoja(row: any): LojaRegional {
  return {
    id: row.id,
    nome: row.nome_loja,
    responsavel: row.responsavel,
    created_at: row.created_at ?? null,
    updated_at: row.updated_at ?? null,
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { nome, responsavel }: Partial<LojaRegionalPayload> = await request.json()

    if (!id) {
      return NextResponse.json({
        success: false,
        error: "Identificador da loja é obrigatório",
      }, { status: 400 })
    }

    if (!nome?.trim() && !responsavel?.trim()) {
      return NextResponse.json({
        success: false,
        error: "Informe ao menos um campo para atualização",
      }, { status: 400 })
    }

    const updates: Record<string, string> = {}

    if (nome?.trim()) {
      updates.nome_loja = nome.trim()
    }

    if (responsavel?.trim()) {
      updates.responsavel = responsavel.trim()
    }

    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabaseServer
      .from(TABLE_NAME)
      .update(updates)
      .eq("id", id)
      .select("id, nome_loja, responsavel, created_at, updated_at")
      .single()

    if (error) {
      console.error("Erro ao atualizar loja:", error)
      return NextResponse.json({
        success: false,
        error: error.message || "Erro ao atualizar loja",
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: mapRowToLoja(data),
    })
  } catch (error) {
    console.error("Erro interno ao atualizar loja:", error)
    return NextResponse.json({
      success: false,
      error: "Erro interno do servidor",
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({
        success: false,
        error: "Identificador da loja é obrigatório",
      }, { status: 400 })
    }

    const { data, error } = await supabaseServer
      .from(TABLE_NAME)
      .delete()
      .eq("id", id)
      .select("id")
      .single()

    if (error) {
      console.error("Erro ao remover loja:", error)
      return NextResponse.json({
        success: false,
        error: error.message || "Erro ao remover loja",
      }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({
        success: false,
        error: "Loja não encontrada",
      }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro interno ao remover loja:", error)
    return NextResponse.json({
      success: false,
      error: "Erro interno do servidor",
    }, { status: 500 })
  }
}
