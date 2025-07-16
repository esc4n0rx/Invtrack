// lib/inventory-finalizer.ts
import { supabaseServer } from '@/lib/supabase'
import { DadosFinalizacao } from '@/types/inventory-finalization'

export async function processarDadosInventario(codigoInventario: string): Promise<DadosFinalizacao> {
  // Buscar dados do inventário
  const { data: inventario, error: errorInventario } = await supabaseServer
    .from('invtrack_inventarios')
    .select('*')
    .eq('codigo', codigoInventario)
    .single()

  if (errorInventario || !inventario) {
    throw new Error('Inventário não encontrado')
  }

  // Buscar todas as contagens do inventário
  const { data: contagens, error: errorContagens } = await supabaseServer
    .from('invtrack_contagens')
    .select('*')
    .eq('codigo_inventario', codigoInventario)

  if (errorContagens) {
    throw new Error('Erro ao buscar contagens')
  }

  const todasContagens = contagens || []

  // Processar dados HB
  const dadosHB = await processarInventarioHB(todasContagens)
  
  // Processar dados HNT
  const dadosHNT = await processarInventarioHNT(todasContagens)

  return {
    inventario: {
      codigo: inventario.codigo,
      responsavel: inventario.responsavel,
      data_criacao: inventario.created_at,
      data_finalizacao: new Date().toISOString()
    },
    inventario_hb: dadosHB,
    inventario_hnt: dadosHNT
  }
}

async function processarInventarioHB(contagens: any[]) {
  const ativosHB = ['HB 618', 'HB 623']
  const contagensHB = contagens.filter(c => ativosHB.includes(c.ativo))

  // Processar lojas (excluir CD ES e CD SP)
  const lojas = processarLojas(contagensHB, ['CD ES', 'CD SP'])

  // Processar CD Espírito Santo
  const cdES = processarCDEspiritoSanto(contagensHB)

  // Processar CD São Paulo
  const cdSP = processarCDSaoPaulo(contagensHB)

  // Processar CD Rio
  const cdRio = processarCDRio(contagensHB)

  // Calcular totais gerais
  const totaisGerais = calcularTotaisGerais(lojas, cdES, cdSP, cdRio)

  return {
    lojas,
    cd_espirito_santo: cdES,
    cd_sao_paulo: cdSP,
    cd_rio: cdRio,
    totais_gerais: totaisGerais
  }
}

async function processarInventarioHNT(contagens: any[]) {
  const ativosHNT = ['HNT G', 'HNT P']
  const contagensHNT = contagens.filter(c => ativosHNT.includes(c.ativo))

  // Mesma lógica do HB mas com ativos HNT
  const lojas = processarLojasHNT(contagensHNT, ['CD ES', 'CD SP'])
  const cdES = processarCDEspiritoSantoHNT(contagensHNT)
  const cdSP = processarCDSaoPauloHNT(contagensHNT)
  const cdRio = processarCDRioHNT(contagensHNT)
  const totaisGerais = calcularTotaisGeraisHNT(lojas, cdES, cdSP, cdRio)

  return {
    lojas,
    cd_espirito_santo: cdES,
    cd_sao_paulo: cdSP,
    cd_rio: cdRio,
    totais_gerais: totaisGerais
  }
}

function processarLojas(contagens: any[], excluirLojas: string[] = []) {
  const contagensLojas = contagens.filter(c => 
    c.tipo === 'loja' && 
    c.loja && 
    !excluirLojas.includes(c.loja)
  )

  const lojasPorNome = contagensLojas.reduce((acc, c) => {
    if (!acc[c.loja]) {
      acc[c.loja] = { total_618: 0, total_623: 0 }
    }
    
    if (c.ativo === 'HB 618') {
      acc[c.loja].total_618 += c.quantidade || 0
    } else if (c.ativo === 'HB 623') {
      acc[c.loja].total_623 += c.quantidade || 0
    }
    
    return acc
  }, {} as Record<string, any>)

  return Object.entries(lojasPorNome).map(([nome, dados]) => {
    const d = dados as { total_618: number; total_623: number };
    return {
      nome,
      total_618: d.total_618,
      total_623: d.total_623,
      total_geral: d.total_618 + d.total_623
    }
  })
}

function processarLojasHNT(contagens: any[], excluirLojas: string[] = []) {
  const contagensLojas = contagens.filter(c => 
    c.tipo === 'loja' && 
    c.loja && 
    !excluirLojas.includes(c.loja)
  )

  const lojasPorNome = contagensLojas.reduce((acc, c) => {
    if (!acc[c.loja]) {
      acc[c.loja] = { total_g: 0, total_p: 0 }
    }
    
    if (c.ativo === 'HNT G') {
      acc[c.loja].total_g += c.quantidade || 0
    } else if (c.ativo === 'HNT P') {
      acc[c.loja].total_p += c.quantidade || 0
    }
    
    return acc
  }, {} as Record<string, any>)

  return Object.entries(lojasPorNome).map(([nome, dados]) => {
    const d = dados as { total_g: number; total_p: number };
    return {
      nome,
      total_g: d.total_g,
      total_p: d.total_p,
      total_geral: d.total_g + d.total_p
    }
  })
}

function processarCDEspiritoSanto(contagens: any[]) {
  // 1. Estoque (tipo=loja, loja=CD ES)
  const estoque = contagens
    .filter(c => c.tipo === 'loja' && c.loja === 'CD ES')
    .reduce((acc, c) => {
      if (c.ativo === 'HB 618') acc.total_618 += c.quantidade || 0
      if (c.ativo === 'HB 623') acc.total_623 += c.quantidade || 0
      return acc
    }, { total_618: 0, total_623: 0 })
  
  estoque.total_geral = estoque.total_618 + estoque.total_623

  // 2. Fornecedor (tipo=fornecedor, fornecedor=FORNECEDOR ES)
  const fornecedor = contagens
    .filter(c => c.tipo === 'fornecedor' && c.fornecedor === 'FORNECEDOR ES')
    .reduce((acc, c) => {
      if (c.ativo === 'HB 618') acc.total_618 += c.quantidade || 0
      if (c.ativo === 'HB 623') acc.total_623 += c.quantidade || 0
      return acc
    }, { total_618: 0, total_623: 0 })
  
  fornecedor.total_geral = fornecedor.total_618 + fornecedor.total_623

  // 3. Trânsito (tipo=transito, cd_origem=CD ESPIRITO SANTO, cd_destino=CD RIO)
  const transito = contagens
    .filter(c => c.tipo === 'transito' && c.cd_origem === 'CD ESPIRITO SANTO' && c.cd_destino === 'CD RIO')
    .reduce((acc, c) => {
      if (c.ativo === 'HB 618') acc.total_618 += c.quantidade || 0
      if (c.ativo === 'HB 623') acc.total_623 += c.quantidade || 0
      return acc
    }, { total_618: 0, total_623: 0 })
  
  transito.total_geral = transito.total_618 + transito.total_623

  // Total CD
  const total_cd = {
    total_618: estoque.total_618 + fornecedor.total_618 + transito.total_618,
    total_623: estoque.total_623 + fornecedor.total_623 + transito.total_623,
    total_geral: 0
  }
  total_cd.total_geral = total_cd.total_618 + total_cd.total_623

  return { estoque, fornecedor, transito, total_cd }
}

function processarCDEspiritoSantoHNT(contagens: any[]) {
  // Mesma lógica mas com ativos HNT
  const estoque = contagens
    .filter(c => c.tipo === 'loja' && c.loja === 'CD ES')
    .reduce((acc, c) => {
      if (c.ativo === 'HNT G') acc.total_g += c.quantidade || 0
      if (c.ativo === 'HNT P') acc.total_p += c.quantidade || 0
      return acc
    }, { total_g: 0, total_p: 0 })
  
  estoque.total_geral = estoque.total_g + estoque.total_p

  const fornecedor = contagens
    .filter(c => c.tipo === 'fornecedor' && c.fornecedor === 'FORNECEDOR ES')
    .reduce((acc, c) => {
      if (c.ativo === 'HNT G') acc.total_g += c.quantidade || 0
      if (c.ativo === 'HNT P') acc.total_p += c.quantidade || 0
      return acc
    }, { total_g: 0, total_p: 0 })
  
  fornecedor.total_geral = fornecedor.total_g + fornecedor.total_p

  const transito = contagens
    .filter(c => c.tipo === 'transito' && c.cd_origem === 'CD ESPIRITO SANTO' && c.cd_destino === 'CD RIO')
    .reduce((acc, c) => {
      if (c.ativo === 'HNT G') acc.total_g += c.quantidade || 0
      if (c.ativo === 'HNT P') acc.total_p += c.quantidade || 0
      return acc
    }, { total_g: 0, total_p: 0 })
  
  transito.total_geral = transito.total_g + transito.total_p

  const total_cd = {
    total_g: estoque.total_g + fornecedor.total_g + transito.total_g,
    total_p: estoque.total_p + fornecedor.total_p + transito.total_p,
    total_geral: 0
  }
  total_cd.total_geral = total_cd.total_g + total_cd.total_p

  return { estoque, fornecedor, transito, total_cd }
}

function processarCDSaoPaulo(contagens: any[]) {
  // Similar ao ES mas com CD SP
  const estoque = contagens
    .filter(c => c.tipo === 'loja' && c.loja === 'CD SP')
    .reduce((acc, c) => {
      if (c.ativo === 'HB 618') acc.total_618 += c.quantidade || 0
      if (c.ativo === 'HB 623') acc.total_623 += c.quantidade || 0
      return acc
    }, { total_618: 0, total_623: 0 })
  
  estoque.total_geral = estoque.total_618 + estoque.total_623

  const fornecedor = contagens
    .filter(c => c.tipo === 'fornecedor' && c.fornecedor === 'FORNECEDOR SP')
    .reduce((acc, c) => {
      if (c.ativo === 'HB 618') acc.total_618 += c.quantidade || 0
      if (c.ativo === 'HB 623') acc.total_623 += c.quantidade || 0
      return acc
    }, { total_618: 0, total_623: 0 })
  
  fornecedor.total_geral = fornecedor.total_618 + fornecedor.total_623

  const transito = contagens
    .filter(c => c.tipo === 'transito' && c.cd_origem === 'CD SÃO PAULO')
    .reduce((acc, c) => {
      if (c.ativo === 'HB 618') acc.total_618 += c.quantidade || 0
      if (c.ativo === 'HB 623') acc.total_623 += c.quantidade || 0
      return acc
    }, { total_618: 0, total_623: 0 })
  
  transito.total_geral = transito.total_618 + transito.total_623

  const total_cd = {
    total_618: estoque.total_618 + fornecedor.total_618 + transito.total_618,
    total_623: estoque.total_623 + fornecedor.total_623 + transito.total_623,
    total_geral: 0
  }
  total_cd.total_geral = total_cd.total_618 + total_cd.total_623

  return { estoque, fornecedor, transito, total_cd }
}

function processarCDSaoPauloHNT(contagens: any[]) {
  // Similar ao ES mas com CD SP e ativos HNT
  const estoque = contagens
    .filter(c => c.tipo === 'loja' && c.loja === 'CD SP')
    .reduce((acc, c) => {
      if (c.ativo === 'HNT G') acc.total_g += c.quantidade || 0
      if (c.ativo === 'HNT P') acc.total_p += c.quantidade || 0
      return acc
    }, { total_g: 0, total_p: 0 })
  
  estoque.total_geral = estoque.total_g + estoque.total_p

  const fornecedor = contagens
    .filter(c => c.tipo === 'fornecedor' && c.fornecedor === 'FORNECEDOR SP')
    .reduce((acc, c) => {
      if (c.ativo === 'HNT G') acc.total_g += c.quantidade || 0
      if (c.ativo === 'HNT P') acc.total_p += c.quantidade || 0
      return acc
    }, { total_g: 0, total_p: 0 })
  
  fornecedor.total_geral = fornecedor.total_g + fornecedor.total_p

  const transito = contagens
    .filter(c => c.tipo === 'transito' && c.cd_origem === 'CD SÃO PAULO')
    .reduce((acc, c) => {
      if (c.ativo === 'HNT G') acc.total_g += c.quantidade || 0
      if (c.ativo === 'HNT P') acc.total_p += c.quantidade || 0
      return acc
    }, { total_g: 0, total_p: 0 })
  
  transito.total_geral = transito.total_g + transito.total_p

  const total_cd = {
    total_g: estoque.total_g + fornecedor.total_g + transito.total_g,
    total_p: estoque.total_p + fornecedor.total_p + transito.total_p,
    total_geral: 0
  }
  total_cd.total_geral = total_cd.total_g + total_cd.total_p

  return { estoque, fornecedor, transito, total_cd }
}

function processarCDRio(contagens: any[]) {
  // Estoque CD RIO - soma por setor_cd, excluindo Central de Producao
  const contagensCD = contagens.filter(c => c.tipo === 'cd')
  
  const setoresNormais = contagensCD
    .filter(c => c.setor_cd && c.setor_cd !== 'Central de Producao')
    .reduce((acc, c) => {
      if (c.ativo === 'HB 618') acc.total_618 += c.quantidade || 0
      if (c.ativo === 'HB 623') acc.total_623 += c.quantidade || 0
      return acc
    }, { total_618: 0, total_623: 0 })
  
  setoresNormais.total_geral = setoresNormais.total_618 + setoresNormais.total_623

  const centralProducao = contagensCD
    .filter(c => c.setor_cd === 'Central de Producao')
    .reduce((acc, c) => {
      if (c.ativo === 'HB 618') acc.total_618 += c.quantidade || 0
      if (c.ativo === 'HB 623') acc.total_623 += c.quantidade || 0
      return acc
    }, { total_618: 0, total_623: 0 })
  
  centralProducao.total_geral = centralProducao.total_618 + centralProducao.total_623

  const totalEstoque = {
    total_618: setoresNormais.total_618 + centralProducao.total_618,
    total_623: setoresNormais.total_623 + centralProducao.total_623,
    total_geral: 0
  }
  totalEstoque.total_geral = totalEstoque.total_618 + totalEstoque.total_623

  // Fornecedor RJ
  const fornecedor = contagens
    .filter(c => c.tipo === 'fornecedor' && c.fornecedor === 'FORNECEDOR RJ')
    .reduce((acc, c) => {
      if (c.ativo === 'HB 618') acc.total_618 += c.quantidade || 0
      if (c.ativo === 'HB 623') acc.total_623 += c.quantidade || 0
      return acc
    }, { total_618: 0, total_623: 0 })
  
  fornecedor.total_geral = fornecedor.total_618 + fornecedor.total_623

  // Total CD RJ
  const total_cd = {
    total_618: totalEstoque.total_618 + fornecedor.total_618,
    total_623: totalEstoque.total_623 + fornecedor.total_623,
    total_geral: 0
  }
  total_cd.total_geral = total_cd.total_618 + total_cd.total_623

  return {
    estoque: {
      setores_normais: setoresNormais,
      central_producao: centralProducao,
      total_estoque: totalEstoque
    },
    fornecedor,
    total_cd
  }
}

function processarCDRioHNT(contagens: any[]) {
    // Mesma lógica mas com ativos HNT
    const contagensCD = contagens.filter(c => c.tipo === 'cd')
    
    const setoresNormais = contagensCD
      .filter(c => c.setor_cd && c.setor_cd !== 'Central de Producao')
      .reduce((acc, c) => {
        if (c.ativo === 'HNT G') acc.total_g += c.quantidade || 0
        if (c.ativo === 'HNT P') acc.total_p += c.quantidade || 0
        return acc
      }, { total_g: 0, total_p: 0 })
    
    setoresNormais.total_geral = setoresNormais.total_g + setoresNormais.total_p
   
    const centralProducao = contagensCD
      .filter(c => c.setor_cd === 'Central de Producao')
      .reduce((acc, c) => {
        if (c.ativo === 'HNT G') acc.total_g += c.quantidade || 0
        if (c.ativo === 'HNT P') acc.total_p += c.quantidade || 0
        return acc
      }, { total_g: 0, total_p: 0 })
    
    centralProducao.total_geral = centralProducao.total_g + centralProducao.total_p
   
    const totalEstoque = {
      total_g: setoresNormais.total_g + centralProducao.total_g,
      total_p: setoresNormais.total_p + centralProducao.total_p,
      total_geral: 0
    }
    totalEstoque.total_geral = totalEstoque.total_g + totalEstoque.total_p
   
    // Fornecedor RJ
    const fornecedor = contagens
      .filter(c => c.tipo === 'fornecedor' && c.fornecedor === 'FORNECEDOR RJ')
      .reduce((acc, c) => {
        if (c.ativo === 'HNT G') acc.total_g += c.quantidade || 0
        if (c.ativo === 'HNT P') acc.total_p += c.quantidade || 0
        return acc
      }, { total_g: 0, total_p: 0 })
    
    fornecedor.total_geral = fornecedor.total_g + fornecedor.total_p
   
    // Total CD RJ
    const total_cd = {
      total_g: totalEstoque.total_g + fornecedor.total_g,
      total_p: totalEstoque.total_p + fornecedor.total_p,
      total_geral: 0
    }
    total_cd.total_geral = total_cd.total_g + total_cd.total_p
   
    return {
      estoque: {
        setores_normais: setoresNormais,
        central_producao: centralProducao,
        total_estoque: totalEstoque
      },
      fornecedor,
      total_cd
    }
   }
   
   function calcularTotaisGerais(lojas: any[], cdES: any, cdSP: any, cdRio: any) {
    const totalLojas = lojas.reduce((acc, loja) => {
      acc.total_618 += loja.total_618
      acc.total_623 += loja.total_623
      return acc
    }, { total_618: 0, total_623: 0 })
   
    const total_618 = totalLojas.total_618 + cdES.total_cd.total_618 + cdSP.total_cd.total_618 + cdRio.total_cd.total_618
    const total_623 = totalLojas.total_623 + cdES.total_cd.total_623 + cdSP.total_cd.total_623 + cdRio.total_cd.total_623
    const total_geral = total_618 + total_623
   
    return { total_618, total_623, total_geral }
   }
   
   function calcularTotaisGeraisHNT(lojas: any[], cdES: any, cdSP: any, cdRio: any) {
    const totalLojas = lojas.reduce((acc, loja) => {
      acc.total_g += loja.total_g
      acc.total_p += loja.total_p
      return acc
    }, { total_g: 0, total_p: 0 })
   
    const total_g = totalLojas.total_g + cdES.total_cd.total_g + cdSP.total_cd.total_g + cdRio.total_cd.total_g
    const total_p = totalLojas.total_p + cdES.total_cd.total_p + cdSP.total_cd.total_p + cdRio.total_cd.total_p
    const total_geral = total_g + total_p
   
    return { total_g, total_p, total_geral }
   }