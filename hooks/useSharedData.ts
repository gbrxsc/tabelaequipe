"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { sharedStorage, type AppData } from "@/lib/storage"
import { toast } from "@/components/ui/use-toast"

interface TeamMember {
  id: string
  name: string
  monthlyPayment: number
  paymentStatus: { [month: string]: boolean }
  absences: { date: string; reason: string }[]
  isGoalkeeper?: boolean
}

interface Event {
  id: string
  title: string
  date: string
  type: "churrasco" | "confraternizacao" | "outro"
  description: string
}

interface TeamDraw {
  id: string
  date: string
  teamA: string[]
  teamB: string[]
  goalkeepers: string[]
  screenshot?: string
}

interface CashEntry {
  id: string
  playerName: string
  amount: number
  date: string
  description: string
}

const initialMembers: TeamMember[] = [
  {
    id: "1",
    name: "Kaio Gabriel",
    monthlyPayment: 150,
    paymentStatus: { "2024-01": true, "2024-02": false, "2024-03": false },
    absences: [
      { date: "2024-03-06", reason: "Trabalho" },
      { date: "2024-03-13", reason: "Doente" },
    ],
    isGoalkeeper: true,
  },
  {
    id: "2",
    name: "Lucas Henrique",
    monthlyPayment: 150,
    paymentStatus: { "2024-01": true, "2024-02": true, "2024-03": false },
    absences: [{ date: "2024-02-28", reason: "Viagem" }],
  },
  {
    id: "3",
    name: "Gabriel Cardoso",
    monthlyPayment: 150,
    paymentStatus: { "2024-01": false, "2024-02": true, "2024-03": true },
    absences: [],
    isGoalkeeper: true,
  },
  {
    id: "4",
    name: "Gustavo Silva",
    monthlyPayment: 150,
    paymentStatus: { "2024-01": true, "2024-02": false, "2024-03": true },
    absences: [
      { date: "2024-01-17", reason: "Compromisso familiar" },
      { date: "2024-02-07", reason: "Doente" },
      { date: "2024-03-20", reason: "Trabalho" },
    ],
  },
  {
    id: "5",
    name: "Bruno Barroso",
    monthlyPayment: 150,
    paymentStatus: { "2024-01": true, "2024-02": true, "2024-03": false },
    absences: [{ date: "2024-02-14", reason: "Viagem" }],
  },
]

const initialEvents: Event[] = [
  {
    id: "1",
    title: "Churrasco de Fim de Ano",
    date: "2024-12-20",
    type: "churrasco",
    description: "Churrasco para celebrar o fim do ano com a equipe",
  },
  {
    id: "2",
    title: "Confraternização de Aniversário",
    date: "2024-04-15",
    type: "confraternizacao",
    description: "Comemoração dos aniversários do trimestre",
  },
]

const initialDrawHistory: TeamDraw[] = [
  {
    id: "1",
    date: "2024-03-01",
    teamA: ["Lucas Henrique", "Bruno Barroso", "Jogador Extra 1", "Jogador Extra 2"],
    teamB: ["Gustavo Silva", "Jogador Extra 4", "Jogador Extra 5", "Jogador Extra 6"],
    goalkeepers: ["Kaio Gabriel", "Gabriel Cardoso"],
  },
]

const initialCashEntries: CashEntry[] = [
  {
    id: "1",
    playerName: "João Silva",
    amount: 15,
    date: "2024-03-15",
    description: "Jogo avulso",
  },
]

const initialExtraPlayers = [
  "Jogador Extra 1",
  "Jogador Extra 2",
  "Jogador Extra 3",
  "Jogador Extra 4",
  "Jogador Extra 5",
  "Jogador Extra 6",
  "Jogador Extra 7",
]

export function useSharedData(isAdmin: boolean) {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers)
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [cashEntries, setCashEntries] = useState<CashEntry[]>(initialCashEntries)
  const [extraPlayers, setExtraPlayers] = useState<string[]>(initialExtraPlayers)
  const [drawHistory, setDrawHistory] = useState<TeamDraw[]>(initialDrawHistory)
  const [teamDrawCounts, setTeamDrawCounts] = useState<{ [key: string]: number }>({})
  const [lastBackup, setLastBackup] = useState<string>("")
  const [isOnline, setIsOnline] = useState(true)
  const [lastSync, setLastSync] = useState<string>("")

  const lastSaveRef = useRef<string>("")
  const saveTimeoutRef = useRef<NodeJS.Timeout>()

  // Carrega dados iniciais
  useEffect(() => {
    console.log("Carregando dados iniciais...")
    const savedData = sharedStorage.loadData()
    if (savedData) {
      console.log("Dados encontrados:", savedData.lastModified)
      updateStateFromData(savedData)
    } else {
      console.log("Nenhum dado salvo encontrado, usando dados iniciais")
    }
  }, [])

  // Função para atualizar estado a partir dos dados
  const updateStateFromData = useCallback((data: AppData) => {
    setMembers(data.members || initialMembers)
    setEvents(data.events || initialEvents)
    setCashEntries(data.cashEntries || initialCashEntries)
    setExtraPlayers(data.extraPlayers || initialExtraPlayers)
    setDrawHistory(data.drawHistory || initialDrawHistory)
    setTeamDrawCounts(data.teamDrawCounts || {})
    setLastBackup(data.lastBackup || "")
    setLastSync(data.lastModified || "")
    setIsOnline(true)

    console.log("Estado atualizado:", data.lastModified)
  }, [])

  // Escuta mudanças em tempo real
  useEffect(() => {
    const handleDataUpdate = (data: AppData) => {
      // Evita loops infinitos verificando se os dados realmente mudaram
      if (data.lastModified !== lastSaveRef.current) {
        console.log("Recebendo atualização:", data.lastModified)
        updateStateFromData(data)
        lastSaveRef.current = data.lastModified

        if (!isAdmin) {
          toast({
            title: "Dados atualizados",
            description: `Última modificação: ${new Date(data.lastModified).toLocaleTimeString("pt-BR")}`,
          })
        }
      }
    }

    sharedStorage.addListener(handleDataUpdate)

    // Força sincronização inicial
    sharedStorage.forceSync()

    return () => {
      sharedStorage.removeListener(handleDataUpdate)
    }
  }, [isAdmin, updateStateFromData])

  // Salva dados com debounce (apenas admin)
  const saveData = useCallback(() => {
    if (!isAdmin) {
      console.log("Tentativa de salvar negada - não é admin")
      return
    }

    // Limpa timeout anterior
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Debounce de 500ms
    saveTimeoutRef.current = setTimeout(() => {
      const data = {
        members,
        events,
        drawHistory,
        cashEntries,
        extraPlayers,
        teamDrawCounts,
        lastBackup: new Date().toISOString(),
      }

      try {
        console.log("Salvando dados como admin...")
        sharedStorage.saveData(data)
        setIsOnline(true)
        lastSaveRef.current = new Date().toISOString()

        toast({
          title: "Dados salvos",
          description: `Sincronizado em ${new Date().toLocaleTimeString("pt-BR")}`,
        })
      } catch (error) {
        console.error("Erro ao salvar dados:", error)
        setIsOnline(false)
        toast({
          title: "Erro ao salvar",
          description: "Verifique sua conexão",
          variant: "destructive",
        })
      }
    }, 500)
  }, [isAdmin, members, events, drawHistory, cashEntries, extraPlayers, teamDrawCounts])

  // Auto-save quando admin faz mudanças
  useEffect(() => {
    if (isAdmin) {
      saveData()
    }
  }, [isAdmin, members, events, drawHistory, cashEntries, extraPlayers, teamDrawCounts, saveData])

  // Cleanup
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return {
    // Estados
    members,
    events,
    cashEntries,
    extraPlayers,
    drawHistory,
    teamDrawCounts,
    lastBackup,
    isOnline,
    lastSync,

    // Setters (apenas para admin)
    setMembers: isAdmin
      ? setMembers
      : () => {
          console.log("Setter bloqueado - não é admin")
        },
    setEvents: isAdmin
      ? setEvents
      : () => {
          console.log("Setter bloqueado - não é admin")
        },
    setCashEntries: isAdmin
      ? setCashEntries
      : () => {
          console.log("Setter bloqueado - não é admin")
        },
    setExtraPlayers: isAdmin
      ? setExtraPlayers
      : () => {
          console.log("Setter bloqueado - não é admin")
        },
    setDrawHistory: isAdmin
      ? setDrawHistory
      : () => {
          console.log("Setter bloqueado - não é admin")
        },
    setTeamDrawCounts: isAdmin
      ? setTeamDrawCounts
      : () => {
          console.log("Setter bloqueado - não é admin")
        },

    // Funções
    saveData: isAdmin
      ? saveData
      : () => {
          console.log("Save bloqueado - não é admin")
        },
    forceSync: () => sharedStorage.forceSync(),
  }
}
