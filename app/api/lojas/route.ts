// app/api/lojas/route.ts
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

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from(TABLE_NAME)
      .select("id, nome_loja, responsavel, created_at, updated_at")
      .order("responsavel", { ascending: true })
      .order("nome_loja", { ascending: true })

    if (error) {
      console.error("Erro ao buscar lojas cadastradas:", error)
      return NextResponse.json({
        success: false,
        error: "Erro ao buscar lojas cadastradas",
      }, { status: 500 })
    }

    const lojas: LojaRegional[] = (data ?? []).map(mapRowToLoja)

    return NextResponse.json({
      success: true,
      data: lojas,
    })
  } catch (error) {
    console.error("Erro interno ao listar lojas:", error)
    return NextResponse.json({
      success: false,
      error: "Erro interno do servidor",
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { nome, responsavel }: LojaRegionalPayload = await request.json()

    if (!nome?.trim() || !responsavel?.trim()) {
      return NextResponse.json({
        success: false,
        error: "Nome da loja e responsável são obrigatórios",
      }, { status: 400 })
    }

    const payload = {
      nome_loja: nome.trim(),
      responsavel: responsavel.trim(),
    }

    const { data, error } = await supabaseServer
      .from(TABLE_NAME)
      .insert(payload)
      .select("id, nome_loja, responsavel, created_at, updated_at")
      .single()

    if (error) {
      console.error("Erro ao criar loja:", error)
      return NextResponse.json({
        success: false,
        error: error.message || "Erro ao criar loja",
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: mapRowToLoja(data),
    }, { status: 201 })
  } catch (error) {
    console.error("Erro interno ao criar loja:", error)
    return NextResponse.json({
      success: false,
      error: "Erro interno do servidor",
    }, { status: 500 })
  }
}
