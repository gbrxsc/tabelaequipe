"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  CalendarDays,
  CreditCard,
  Download,
  Plus,
  RefreshCw,
  Shuffle,
  UserMinus,
  Users,
  Utensils,
  Lock,
  Eye,
  Save,
  Upload,
  LogOut,
  Wifi,
  WifiOff,
  Clock,
  User,
  FileText,
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useSharedData } from "@/hooks/useSharedData"
import { clearSharedData, hasSharedData } from "@/lib/storage"
import { supabase, type Atualizacao } from "@/lib/supabase"

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

const ADMIN_PASSWORD = "gabriel111"

export default function TeamDashboard() {
  // All state declarations first - before any conditional logic
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isViewOnly, setIsViewOnly] = useState(false)
  const [password, setPassword] = useState("")
  const [showLogin, setShowLogin] = useState(true)

  // Estados do Painel de Atualizações
  const [atualizacoes, setAtualizacoes] = useState<Atualizacao[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Estados do formulário
  const [titulo, setTitulo] = useState("")
  const [descricao, setDescricao] = useState("")
  const [autor, setAutor] = useState("")

  // Estados de formulários
  const [newMemberName, setNewMemberName] = useState("")
  const [newMemberPayment, setNewMemberPayment] = useState("")
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [newEvent, setNewEvent] = useState<Partial<Event>>({})
  const [activeTab, setActiveTab] = useState("pagamentos")
  const [newAbsence, setNewAbsence] = useState<{ memberId: string; date: string; reason: string }>({
    memberId: "",
    date: "",
    reason: "",
  })
  const [newCashEntry, setNewCashEntry] = useState<Partial<any>>({})

  // Estados de sorteio
  const [newExtraPlayer, setNewExtraPlayer] = useState("")
  const [selectedPlayers, setSelectedPlayers] = useState<{ [id: string]: boolean }>({})
  const [teamA, setTeamA] = useState<string[]>([])
  const [teamB, setTeamB] = useState<string[]>([])
  const [goalkeepers, setGoalkeepers] = useState<string[]>([])
  const teamResultRef = useRef<HTMLDivElement>(null)

  // Hook personalizado para dados compartilhados - MUST be called before conditional returns
  const {
    members,
    events,
    cashEntries,
    extraPlayers,
    drawHistory,
    teamDrawCounts,
    lastBackup,
    isOnline,
    lastSync,
    setMembers,
    setEvents,
    setCashEntries,
    setExtraPlayers,
    setDrawHistory,
    setTeamDrawCounts,
    saveData,
    forceSync,
  } = useSharedData(isAuthenticated)

  // All useEffect hooks before conditional returns
  useEffect(() => {
    carregarAtualizacoes()
  }, [])

  // Constants
  const currentMonth = "2024-03"
  const months = ["2024-01", "2024-02", "2024-03"]

  // All function definitions before conditional returns
  const carregarAtualizacoes = async () => {
    try {
      setLoading(true)

      // Check if supabase client is properly initialized
      if (!supabase.from) {
        console.error("Supabase client not properly initialized")
        toast({
          title: "Erro de configuração",
          description: "O cliente Supabase não está configurado corretamente. Verifique as variáveis de ambiente.",
          variant: "destructive",
        })
        setAtualizacoes([])
        return
      }

      const { data, error } = await supabase.from("atualizacoes").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("Erro ao carregar atualizações:", error)
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar as atualizações. Verifique sua conexão.",
          variant: "destructive",
        })
        return
      }

      setAtualizacoes(data || [])
    } catch (error) {
      console.error("Erro inesperado:", error)
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao carregar os dados.",
        variant: "destructive",
      })
      setAtualizacoes([])
    } finally {
      setLoading(false)
    }
  }

  const salvarAtualizacao = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!titulo.trim() || !descricao.trim() || !autor.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)

      // Check if supabase client is properly initialized
      if (!supabase.from) {
        console.error("Supabase client not properly initialized")
        toast({
          title: "Erro de configuração",
          description: "O cliente Supabase não está configurado corretamente. Verifique as variáveis de ambiente.",
          variant: "destructive",
        })
        return
      }

      const novaAtualizacao: Omit<Atualizacao, "id" | "created_at"> = {
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        autor: autor.trim(),
        data: new Date().toISOString(),
      }

      const { data, error } = await supabase.from("atualizacoes").insert([novaAtualizacao]).select()

      if (error) {
        console.error("Erro ao salvar atualização:", error)
        toast({
          title: "Erro ao salvar",
          description: "Não foi possível salvar a atualização. Tente novamente.",
          variant: "destructive",
        })
        return
      }

      // Limpa o formulário
      setTitulo("")
      setDescricao("")
      setAutor("")

      // Recarrega as atualizações
      await carregarAtualizacoes()

      toast({
        title: "Atualização salva!",
        description: "A atualização foi publicada com sucesso.",
      })
    } catch (error) {
      console.error("Erro inesperado ao salvar:", error)
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao salvar a atualização.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const formatarData = (dataString: string) => {
    try {
      const data = new Date(dataString)
      return data.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "Data inválida"
    }
  }

  const exportData = () => {
    const data = {
      members,
      events,
      drawHistory,
      cashEntries,
      extraPlayers,
      teamDrawCounts,
      lastBackup: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `team-dashboard-backup-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Backup exportado",
      description: "Arquivo JSON baixado com sucesso",
    })
  }

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        setMembers(data.members || [])
        setEvents(data.events || [])
        setCashEntries(data.cashEntries || [])
        setExtraPlayers(data.extraPlayers || [])
        setDrawHistory(data.drawHistory || [])
        setTeamDrawCounts(data.teamDrawCounts || {})

        toast({
          title: "Dados importados com sucesso",
          description: "Backup restaurado e sincronizado",
        })
      } catch (error) {
        toast({
          title: "Erro ao importar dados",
          description: "Arquivo inválido",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
  }

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      setIsViewOnly(false)
      setShowLogin(false)
      toast({
        title: "Login realizado com sucesso",
        description: "Modo administrador ativado - suas alterações serão sincronizadas",
      })
    } else {
      toast({
        title: "Senha incorreta",
        description: "Tente novamente",
        variant: "destructive",
      })
    }
    setPassword("")
  }

  const handleViewOnly = () => {
    setIsViewOnly(true)
    setIsAuthenticated(false)
    setShowLogin(false)
    toast({
      title: "Modo visualização ativado",
      description: "Dados sincronizados em tempo real",
    })
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setIsViewOnly(false)
    setShowLogin(true)
    setPassword("")
    toast({
      title: "Logout realizado",
      description: "Sessão encerrada",
    })
  }

  const handleClearData = () => {
    if (confirm("Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.")) {
      clearSharedData()
      window.location.reload()
    }
  }

  const handleForceSync = () => {
    // Força sincronização manual
    forceSync()
    toast({
      title: "Sincronização forçada",
      description: "Dados atualizados manualmente",
    })
  }

  // All other function definitions...
  const addMember = () => {
    if (!isAuthenticated) return
    if (newMemberName && newMemberPayment) {
      const newMember: TeamMember = {
        id: Date.now().toString(),
        name: newMemberName,
        monthlyPayment: Number.parseFloat(newMemberPayment),
        paymentStatus: { "2024-01": false, "2024-02": false, "2024-03": false },
        absences: [],
      }
      setMembers([...members, newMember])
      setNewMemberName("")
      setNewMemberPayment("")

      toast({
        title: "Membro adicionado",
        description: `${newMember.name} foi adicionado e sincronizado`,
      })
    }
  }

  const updatePaymentStatus = (memberId: string, month: string, status: boolean) => {
    if (!isAuthenticated) return
    setMembers(
      members.map((member) =>
        member.id === memberId ? { ...member, paymentStatus: { ...member.paymentStatus, [month]: status } } : member,
      ),
    )
  }

  const updateMemberPayment = (memberId: string, newPayment: number) => {
    if (!isAuthenticated) return
    setMembers(members.map((member) => (member.id === memberId ? { ...member, monthlyPayment: newPayment } : member)))
  }

  const addAbsence = () => {
    if (!isAuthenticated) return
    if (newAbsence.memberId && newAbsence.date) {
      setMembers(
        members.map((member) => {
          if (member.id === newAbsence.memberId) {
            return {
              ...member,
              absences: [...member.absences, { date: newAbsence.date, reason: newAbsence.reason || "Não informado" }],
            }
          }
          return member
        }),
      )
      setNewAbsence({ memberId: "", date: "", reason: "" })

      toast({
        title: "Falta registrada",
        description: "Informação sincronizada com todos os usuários",
      })
    }
  }

  const removeAbsence = (memberId: string, absenceDate: string) => {
    if (!isAuthenticated) return
    setMembers(
      members.map((member) => {
        if (member.id === memberId) {
          return {
            ...member,
            absences: member.absences.filter((absence) => absence.date !== absenceDate),
          }
        }
        return member
      }),
    )
  }

  const addEvent = () => {
    if (!isAuthenticated) return
    if (newEvent.title && newEvent.date && newEvent.type) {
      const event: Event = {
        id: Date.now().toString(),
        title: newEvent.title,
        date: newEvent.date,
        type: newEvent.type as Event["type"],
        description: newEvent.description || "",
      }
      setEvents([...events, event])
      setNewEvent({})

      toast({
        title: "Evento criado",
        description: `${event.title} foi adicionado e sincronizado`,
      })
    }
  }

  const removeEvent = (eventId: string) => {
    if (!isAuthenticated) return
    setEvents(events.filter((event) => event.id !== eventId))
  }

  const addExtraPlayer = () => {
    if (!isAuthenticated) return
    if (newExtraPlayer.trim()) {
      setExtraPlayers([...extraPlayers, newExtraPlayer])
      setNewExtraPlayer("")
    }
  }

  const removeExtraPlayer = (player: string) => {
    if (!isAuthenticated) return
    setExtraPlayers(extraPlayers.filter((p) => p !== player))
  }

  const togglePlayerSelection = (id: string, isSelected: boolean) => {
    setSelectedPlayers({
      ...selectedPlayers,
      [id]: isSelected,
    })
  }

  const drawTeams = () => {
    const availableGoalkeepers = members.filter((m) => m.isGoalkeeper)
    const selectedMemberIds = Object.entries(selectedPlayers)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => id)

    const selectedMemberNames = members
      .filter((m) => selectedMemberIds.includes(m.id) && !m.isGoalkeeper)
      .map((m) => m.name)

    const selectedExtraPlayers = extraPlayers.filter((p) => selectedPlayers[`extra-${p}`])
    const allFieldPlayers = [...selectedMemberNames, ...selectedExtraPlayers]

    if (allFieldPlayers.length < 8) {
      toast({
        title: "Jogadores insuficientes",
        description: `Precisamos de 8 jogadores de linha. Temos apenas ${allFieldPlayers.length}.`,
        variant: "destructive",
      })
      return
    }

    if (availableGoalkeepers.length < 2) {
      toast({
        title: "Goleiros insuficientes",
        description: "Precisamos de 2 goleiros para o sorteio.",
        variant: "destructive",
      })
      return
    }

    const shuffledPlayers = [...allFieldPlayers].sort(() => Math.random() - 0.5)
    const shuffledGoalkeepers = availableGoalkeepers.map((g) => g.name).sort(() => Math.random() - 0.5)

    const newTeamA = shuffledPlayers.slice(0, 4)
    const newTeamB = shuffledPlayers.slice(4, 8)

    setTeamA(newTeamA)
    setTeamB(newTeamB)
    setGoalkeepers(shuffledGoalkeepers)

    if (isAuthenticated) {
      const newDraw = {
        id: Date.now().toString(),
        date: new Date().toISOString().split("T")[0],
        teamA: newTeamA,
        teamB: newTeamB,
        goalkeepers: shuffledGoalkeepers,
      }

      setDrawHistory([newDraw, ...drawHistory])

      const teamKey = [...newTeamA, ...newTeamB, ...shuffledGoalkeepers].sort().join(",")
      setTeamDrawCounts({
        ...teamDrawCounts,
        [teamKey]: (teamDrawCounts[teamKey] || 0) + 1,
      })

      toast({
        title: "Times sorteados!",
        description: "Resultado sincronizado com todos os usuários",
      })
    } else {
      toast({
        title: "Times sorteados!",
        description: "Você pode tirar um screenshot do resultado.",
      })
    }
  }

  const captureScreenshot = async () => {
    if (!teamResultRef.current) return

    try {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      if (ctx) {
        canvas.width = 800
        canvas.height = 600

        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        ctx.fillStyle = "#000000"
        ctx.font = "bold 24px Arial"
        ctx.textAlign = "center"
        ctx.fillText("Sorteio de Times", canvas.width / 2, 50)

        ctx.font = "16px Arial"
        ctx.fillText(new Date().toLocaleDateString("pt-BR"), canvas.width / 2, 80)

        ctx.font = "bold 20px Arial"
        ctx.fillStyle = "#16a34a"
        ctx.textAlign = "left"
        ctx.fillText("Time A", 50, 150)

        ctx.font = "16px Arial"
        ctx.fillStyle = "#000000"
        ctx.fillText(`Goleiro: ${goalkeepers[0]}`, 50, 180)

        teamA.forEach((player, index) => {
          ctx.fillText(`${index + 1}. ${player}`, 50, 210 + index * 25)
        })

        ctx.font = "bold 20px Arial"
        ctx.fillStyle = "#ea580c"
        ctx.textAlign = "left"
        ctx.fillText("Time B", 450, 150)

        ctx.font = "16px Arial"
        ctx.fillStyle = "#000000"
        ctx.fillText(`Goleiro: ${goalkeepers[1]}`, 450, 180)

        teamB.forEach((player, index) => {
          ctx.fillText(`${index + 1}. ${player}`, 450, 210 + index * 25)
        })

        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `sorteio-times-${new Date().toISOString().split("T")[0]}.png`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
          }
        })
      }

      toast({
        title: "Screenshot capturado!",
        description: "O arquivo foi baixado automaticamente.",
      })
    } catch (error) {
      toast({
        title: "Erro ao capturar screenshot",
        description: "Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const addCashEntry = () => {
    if (!isAuthenticated) return
    if (newCashEntry.playerName && newCashEntry.amount && newCashEntry.date) {
      const entry = {
        id: Date.now().toString(),
        playerName: newCashEntry.playerName,
        amount: newCashEntry.amount,
        date: newCashEntry.date,
        description: newCashEntry.description || "Jogo avulso",
      }
      setCashEntries([entry, ...cashEntries])
      setNewCashEntry({})

      toast({
        title: "Pagamento registrado",
        description: `R$ ${entry.amount} de ${entry.playerName} sincronizado`,
      })
    }
  }

  // Calculated values
  const totalMembers = members.length
  const paidThisMonth = members.filter((m) => m.paymentStatus[currentMonth]).length
  const totalAbsences = members.reduce((sum, m) => sum + m.absences.length, 0)
  const totalRevenue = members.reduce((sum, m) => sum + (m.paymentStatus[currentMonth] ? m.monthlyPayment : 0), 0)
  const revenueGoal = 420
  const remainingRevenue = Math.max(0, revenueGoal - totalRevenue)
  const totalCash = cashEntries.reduce((sum, entry) => sum + entry.amount, 0)

  // NOW the conditional return for login screen - after ALL hooks are called
  if (showLogin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Dashboard da Equipe</CardTitle>
            <CardDescription>Sistema de gestão compartilhado em tempo real</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="password">Senha do Administrador</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite a senha"
                  onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>
              <Button onClick={handleLogin} className="w-full bg-green-600 hover:bg-green-700">
                <Lock className="mr-2 h-4 w-4" />
                Entrar como Administrador
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            <Button onClick={handleViewOnly} variant="outline" className="w-full">
              <Eye className="mr-2 h-4 w-4" />
              Visualizar em Tempo Real
            </Button>

            <Alert>
              <AlertDescription className="text-sm">
                <strong>🔒 Administrador:</strong> Faz alterações que são sincronizadas para todos
                <br />
                <strong>👁️ Visualização:</strong> Vê todas as alterações em tempo real
                <br />
                <strong>🌐 Compartilhado:</strong> Todos veem as mesmas informações atualizadas
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main dashboard return
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard da Equipe</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                {isOnline ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-red-500" />}
                <span>
                  {isAuthenticated ? "🔒 Administrador" : "👁️ Visualização"}
                  {isOnline ? " (Sincronizado)" : " (Offline)"}
                </span>
              </div>
              {lastSync && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Última atualização: {new Date(lastSync).toLocaleTimeString("pt-BR")}</span>
                </div>
              )}
              <div className="text-xs">{hasSharedData() ? "✅ Dados salvos" : "❌ Sem dados"}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <>
                <input type="file" accept=".json" onChange={importData} style={{ display: "none" }} id="import-file" />
                <Button variant="outline" onClick={() => document.getElementById("import-file")?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  Importar
                </Button>
                <Button variant="outline" onClick={exportData}>
                  <Save className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Membro
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Novo Membro</DialogTitle>
                      <DialogDescription>Adicione um novo membro à equipe (será sincronizado)</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Nome</Label>
                        <Input
                          id="name"
                          value={newMemberName}
                          onChange={(e) => setNewMemberName(e.target.value)}
                          placeholder="Nome completo"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="payment">Pagamento Mensal (R$)</Label>
                        <Input
                          id="payment"
                          type="number"
                          value={newMemberPayment}
                          onChange={(e) => setNewMemberPayment(e.target.value)}
                          placeholder="150.00"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="goalkeeper" />
                        <Label htmlFor="goalkeeper">É goleiro?</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={addMember} className="bg-green-600 hover:bg-green-700">
                        Adicionar e Sincronizar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" onClick={handleForceSync}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Forçar Sync
                </Button>
                <Button variant="destructive" onClick={handleClearData}>
                  Limpar Dados
                </Button>
              </>
            )}
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>

        {/* Alert para modo visualização */}
        {isViewOnly && (
          <Alert>
            <Eye className="h-4 w-4" />
            <AlertDescription>
              <strong>Modo Visualização Ativa:</strong> Você está vendo dados sincronizados em tempo real. Todas as
              alterações feitas pelo administrador aparecerão automaticamente aqui.
              {!isOnline && " ⚠️ Conexão instável - dados podem estar desatualizados."}
            </AlertDescription>
          </Alert>
        )}

        {/* Alert para admin */}
        {isAuthenticated && (
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              <strong>Modo Administrador Ativo:</strong> Suas alterações são automaticamente sincronizadas e visíveis
              para todos os usuários em tempo real.
              {!isOnline && " ⚠️ Problemas de sincronização - verifique sua conexão."}
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Membros</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMembers}</div>
              <p className="text-xs text-muted-foreground">membros ativos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagamentos (Março)</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {paidThisMonth}/{totalMembers}
              </div>
              <p className="text-xs text-muted-foreground">pagamentos realizados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faltas (Quartas)</CardTitle>
              <UserMinus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAbsences}</div>
              <p className="text-xs text-muted-foreground">faltas registradas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita (Março)</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {totalRevenue}</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Meta: R$ {revenueGoal}</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (totalRevenue / revenueGoal) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs">
                    {totalRevenue >= revenueGoal ? "Meta atingida!" : `Faltam R$ ${remainingRevenue}`}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Caixa (Não-mensais)</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {totalCash}</div>
              <p className="text-xs text-muted-foreground">pagamentos avulsos</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pagamentos" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
            <TabsTrigger value="faltas">Controle de Faltas</TabsTrigger>
            <TabsTrigger value="sorteio">Sorteio de Times</TabsTrigger>
            <TabsTrigger value="caixa">Caixa</TabsTrigger>
            <TabsTrigger value="atualizacoes">Atualizações</TabsTrigger>
          </TabsList>

          {/* Tab de Pagamentos */}
          <TabsContent value="pagamentos">
            <Card>
              <CardHeader>
                <CardTitle>Controle de Pagamentos</CardTitle>
                <CardDescription>
                  Gerencie os pagamentos mensais de cada membro
                  {isViewOnly && " (Dados sincronizados em tempo real)"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Valor Mensal</TableHead>
                      <TableHead>Janeiro</TableHead>
                      <TableHead>Fevereiro</TableHead>
                      <TableHead>Março</TableHead>
                      <TableHead>Faltas</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          {member.name}
                          {member.isGoalkeeper && <Badge className="ml-2 bg-purple-500">Goleiro</Badge>}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            R$ {member.monthlyPayment}
                            {isAuthenticated && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" onClick={() => setEditingMember(member)}>
                                    Editar
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Editar {member.name}</DialogTitle>
                                  </DialogHeader>
                                  <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                      <Label>Pagamento Mensal (R$)</Label>
                                      <Input
                                        type="number"
                                        defaultValue={member.monthlyPayment}
                                        onChange={(e) =>
                                          updateMemberPayment(member.id, Number.parseFloat(e.target.value) || 0)
                                        }
                                      />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`goalkeeper-${member.id}`}
                                        checked={member.isGoalkeeper}
                                        onCheckedChange={(checked) => {
                                          setMembers(
                                            members.map((m) =>
                                              m.id === member.id ? { ...m, isGoalkeeper: !!checked } : m,
                                            ),
                                          )
                                        }}
                                      />
                                      <Label htmlFor={`goalkeeper-${member.id}`}>É goleiro?</Label>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </TableCell>
                        {months.map((month) => (
                          <TableCell key={month}>
                            <Button
                              variant={member.paymentStatus[month] ? "default" : "outline"}
                              size="sm"
                              className={member.paymentStatus[month] ? "bg-green-600 hover:bg-green-700" : ""}
                              onClick={() => updatePaymentStatus(member.id, month, !member.paymentStatus[month])}
                              disabled={!isAuthenticated}
                            >
                              {member.paymentStatus[month] ? "Pago" : "Pendente"}
                            </Button>
                          </TableCell>
                        ))}
                        <TableCell>
                          <Badge variant={member.absences.length > 2 ? "destructive" : "secondary"}>
                            {member.absences.length} faltas
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => setActiveTab("faltas")}>
                            Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Events Section */}
            <Card className="mt-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Eventos da Equipe</CardTitle>
                  <CardDescription>
                    Churrascos, confraternizações e outros eventos
                    {isViewOnly && " (Sincronizado em tempo real)"}
                  </CardDescription>
                </div>
                {isAuthenticated && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-orange-600 hover:bg-orange-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Evento
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Criar Novo Evento</DialogTitle>
                        <DialogDescription>Adicione um novo evento para a equipe (será sincronizado)</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label>Título do Evento</Label>
                          <Input
                            value={newEvent.title || ""}
                            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                            placeholder="Ex: Churrasco de Fim de Ano"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Data</Label>
                          <Input
                            type="date"
                            value={newEvent.date || ""}
                            onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Tipo</Label>
                          <Select onValueChange={(value) => setNewEvent({ ...newEvent, type: value as Event["type"] })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="churrasco">Churrasco</SelectItem>
                              <SelectItem value="confraternizacao">Confraternização</SelectItem>
                              <SelectItem value="outro">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label>Descrição</Label>
                          <Textarea
                            value={newEvent.description || ""}
                            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                            placeholder="Descreva o evento..."
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={addEvent} className="bg-orange-600 hover:bg-orange-700">
                          Criar e Sincronizar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {events.map((event) => (
                    <Card key={event.id} className="border-l-4 border-l-orange-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{event.title}</CardTitle>
                          <Badge variant="outline" className="capitalize">
                            {event.type === "churrasco" && <Utensils className="mr-1 h-3 w-3" />}
                            {event.type === "confraternizacao" && <CalendarDays className="mr-1 h-3 w-3" />}
                            {event.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.date).toLocaleDateString("pt-BR")}
                        </p>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm mb-3">{event.description}</p>
                        {isAuthenticated && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => removeEvent(event.id)}
                          >
                            Remover Evento
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab de Controle de Faltas */}
          <TabsContent value="faltas">
            <Card>
              <CardHeader>
                <CardTitle>Controle de Faltas (Quartas-feiras)</CardTitle>
                <CardDescription>
                  Gerencie as faltas de cada membro da equipe
                  {isViewOnly && " (Dados sincronizados em tempo real)"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isAuthenticated && (
                  <div className="mb-6 space-y-4 rounded-lg border p-4">
                    <h3 className="text-lg font-medium">Registrar Nova Falta</h3>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <Label htmlFor="member-select">Membro</Label>
                        <Select
                          onValueChange={(value) => setNewAbsence({ ...newAbsence, memberId: value })}
                          value={newAbsence.memberId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um membro" />
                          </SelectTrigger>
                          <SelectContent>
                            {members.map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="absence-date">Data da Falta</Label>
                        <Input
                          id="absence-date"
                          type="date"
                          value={newAbsence.date}
                          onChange={(e) => setNewAbsence({ ...newAbsence, date: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="absence-reason">Motivo</Label>
                        <Input
                          id="absence-reason"
                          placeholder="Motivo da falta"
                          value={newAbsence.reason}
                          onChange={(e) => setNewAbsence({ ...newAbsence, reason: e.target.value })}
                        />
                      </div>
                    </div>
                    <Button
                      onClick={addAbsence}
                      disabled={!newAbsence.memberId || !newAbsence.date}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Registrar e Sincronizar
                    </Button>
                  </div>
                )}

                <div className="space-y-6">
                  {members.map((member) => (
                    <Card key={member.id} className="overflow-hidden">
                      <CardHeader className="bg-gray-50 pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle>{member.name}</CardTitle>
                          <Badge variant={member.absences.length > 2 ? "destructive" : "secondary"}>
                            {member.absences.length} faltas
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        {member.absences.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Motivo</TableHead>
                                {isAuthenticated && <TableHead className="w-[100px]">Ações</TableHead>}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {member.absences.map((absence, index) => (
                                <TableRow key={`${member.id}-absence-${index}`}>
                                  <TableCell>{new Date(absence.date).toLocaleDateString("pt-BR")}</TableCell>
                                  <TableCell>{absence.reason}</TableCell>
                                  {isAuthenticated && (
                                    <TableCell>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => removeAbsence(member.id, absence.date)}
                                      >
                                        Remover
                                      </Button>
                                    </TableCell>
                                  )}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="py-6 text-center text-muted-foreground">Nenhuma falta registrada</div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab de Sorteio de Times */}
          <TabsContent value="sorteio">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Configuração do Sorteio */}
              <Card>
                <CardHeader>
                  <CardTitle>Configuração do Sorteio</CardTitle>
                  <CardDescription>
                    Selecione os jogadores para o sorteio (4 jogadores por time + 1 goleiro cada)
                    {isViewOnly && " - Resultados sincronizados em tempo real"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Membros da Equipe */}
                  <div>
                    <h3 className="mb-3 font-medium">Membros da Equipe</h3>
                    <div className="space-y-2">
                      {members.map((member) => (
                        <div key={member.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`select-${member.id}`}
                            checked={!!selectedPlayers[member.id]}
                            onCheckedChange={(checked) => togglePlayerSelection(member.id, !!checked)}
                          />
                          <Label htmlFor={`select-${member.id}`} className="flex items-center">
                            {member.name}
                            {member.isGoalkeeper && <Badge className="ml-2 bg-purple-500">Goleiro</Badge>}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Jogadores Extras */}
                  <div>
                    <h3 className="mb-3 font-medium">Jogadores Extras</h3>
                    {isAuthenticated && (
                      <div className="mb-4 flex items-center space-x-2">
                        <Input
                          placeholder="Nome do jogador extra"
                          value={newExtraPlayer}
                          onChange={(e) => setNewExtraPlayer(e.target.value)}
                          className="flex-1"
                        />
                        <Button onClick={addExtraPlayer} disabled={!newExtraPlayer.trim()} size="sm">
                          Adicionar
                        </Button>
                      </div>
                    )}

                    <div className="space-y-2">
                      {extraPlayers.map((player) => (
                        <div key={player} className="flex items-center justify-between rounded-md border p-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`select-extra-${player}`}
                              checked={!!selectedPlayers[`extra-${player}`]}
                              onCheckedChange={(checked) => togglePlayerSelection(`extra-${player}`, !!checked)}
                            />
                            <Label htmlFor={`select-extra-${player}`}>{player}</Label>
                          </div>
                          {isAuthenticated && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => removeExtraPlayer(player)}
                            >
                              Remover
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button onClick={drawTeams} className="w-full bg-green-600 hover:bg-green-700">
                    <Shuffle className="mr-2 h-4 w-4" />
                    Sortear Times
                    {isAuthenticated && " e Sincronizar"}
                  </Button>
                </CardContent>
              </Card>

              {/* Resultado do Sorteio */}
              <Card>
                <CardHeader>
                  <CardTitle>Resultado do Sorteio</CardTitle>
                  <CardDescription>
                    Times sorteados aleatoriamente
                    {isViewOnly && " (Sincronizado em tempo real)"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div ref={teamResultRef} className="space-y-6">
                    {teamA.length > 0 && teamB.length > 0 ? (
                      <>
                        <div className="grid gap-4 md:grid-cols-2">
                          {/* Time A */}
                          <div className="rounded-lg border p-4">
                            <h3 className="mb-2 text-lg font-medium text-green-600">Time A</h3>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Badge className="bg-purple-500">Goleiro</Badge>
                                <span className="font-medium">{goalkeepers[0]}</span>
                              </div>
                              {teamA.map((player, index) => (
                                <div key={`teamA-${index}`} className="flex items-center space-x-2">
                                  <Badge className="bg-gray-200 text-gray-800">Jogador {index + 1}</Badge>
                                  <span>{player}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Time B */}
                          <div className="rounded-lg border p-4">
                            <h3 className="mb-2 text-lg font-medium text-orange-600">Time B</h3>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Badge className="bg-purple-500">Goleiro</Badge>
                                <span className="font-medium">{goalkeepers[1]}</span>
                              </div>
                              {teamB.map((player, index) => (
                                <div key={`teamB-${index}`} className="flex items-center space-x-2">
                                  <Badge className="bg-gray-200 text-gray-800">Jogador {index + 1}</Badge>
                                  <span>{player}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-center space-x-2">
                          <Button variant="outline" onClick={drawTeams} className="flex-1">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Sortear Novamente
                          </Button>
                          <Button onClick={captureScreenshot} className="flex-1 bg-blue-600 hover:bg-blue-700">
                            <Download className="mr-2 h-4 w-4" />
                            Capturar Screenshot
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="flex h-[200px] flex-col items-center justify-center text-center text-muted-foreground">
                        <Shuffle className="mb-2 h-12 w-12" />
                        <p>Clique em "Sortear Times" para gerar os times</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Histórico de Sorteios */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Histórico de Sorteios</CardTitle>
                  <CardDescription>
                    Registro de todos os sorteios realizados
                    {isViewOnly && " (Sincronizado em tempo real)"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Time A</TableHead>
                        <TableHead>Time B</TableHead>
                        <TableHead>Goleiros</TableHead>
                        <TableHead>Ocorrências</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {drawHistory.map((draw) => {
                        const teamKey = [...draw.teamA, ...draw.teamB, ...draw.goalkeepers].sort().join(",")
                        const occurrences = teamDrawCounts[teamKey] || 1

                        return (
                          <TableRow key={draw.id}>
                            <TableCell>{new Date(draw.date).toLocaleDateString("pt-BR")}</TableCell>
                            <TableCell>{draw.teamA.join(", ")}</TableCell>
                            <TableCell>{draw.teamB.join(", ")}</TableCell>
                            <TableCell>{draw.goalkeepers.join(", ")}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{occurrences}x</Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab de Caixa */}
          <TabsContent value="caixa">
            <Card>
              <CardHeader>
                <CardTitle>Controle de Caixa</CardTitle>
                <CardDescription>
                  Pagamentos de pessoas que não são do mensal
                  {isViewOnly && " (Dados sincronizados em tempo real)"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isAuthenticated && (
                  <div className="mb-6 space-y-4 rounded-lg border p-4">
                    <h3 className="text-lg font-medium">Registrar Novo Pagamento</h3>
                    <div className="grid gap-4 sm:grid-cols-4">
                      <div>
                        <Label htmlFor="player-name">Nome do Jogador</Label>
                        <Input
                          id="player-name"
                          value={newCashEntry.playerName || ""}
                          onChange={(e) => setNewCashEntry({ ...newCashEntry, playerName: e.target.value })}
                          placeholder="Nome completo"
                        />
                      </div>
                      <div>
                        <Label htmlFor="amount">Valor (R$)</Label>
                        <Input
                          id="amount"
                          type="number"
                          value={newCashEntry.amount || ""}
                          onChange={(e) =>
                            setNewCashEntry({ ...newCashEntry, amount: Number.parseFloat(e.target.value) || 0 })
                          }
                          placeholder="15.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cash-date">Data</Label>
                        <Input
                          id="cash-date"
                          type="date"
                          value={newCashEntry.date || ""}
                          onChange={(e) => setNewCashEntry({ ...newCashEntry, date: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Descrição</Label>
                        <Input
                          id="description"
                          placeholder="Jogo avulso"
                          value={newCashEntry.description || ""}
                          onChange={(e) => setNewCashEntry({ ...newCashEntry, description: e.target.value })}
                        />
                      </div>
                    </div>
                    <Button
                      onClick={addCashEntry}
                      disabled={!newCashEntry.playerName || !newCashEntry.amount || !newCashEntry.date}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Registrar e Sincronizar
                    </Button>
                  </div>
                )}

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      {isAuthenticated && <TableHead>Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cashEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.playerName}</TableCell>
                        <TableCell>R$ {entry.amount}</TableCell>
                        <TableCell>{new Date(entry.date).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>{entry.description}</TableCell>
                        {isAuthenticated && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setCashEntries(cashEntries.filter((e) => e.id !== entry.id))}
                            >
                              Remover
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab de Atualizações */}
          <TabsContent value="atualizacoes">
            <div className="min-h-screen bg-gray-50 p-4 md:p-6">
              <div className="mx-auto max-w-4xl space-y-8">
                {/* Título Principal */}
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">Painel de Atualizações da Equipe</h1>
                  <p className="text-lg text-gray-600">Compartilhe novidades e mantenha a equipe informada</p>
                </div>

                {/* Formulário de Nova Atualização */}
                <Card className="shadow-lg">
                  <CardHeader className="bg-blue-50">
                    <CardTitle className="flex items-center gap-2 text-blue-800">
                      <Plus className="h-5 w-5" />
                      Nova Atualização
                    </CardTitle>
                    <CardDescription>Publique uma nova atualização para toda a equipe</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form onSubmit={salvarAtualizacao} className="space-y-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="md:col-span-2">
                          <Label htmlFor="titulo" className="text-sm font-medium">
                            Título da Atualização *
                          </Label>
                          <Input
                            id="titulo"
                            type="text"
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                            placeholder="Ex: Nova funcionalidade implementada"
                            className="mt-1"
                            required
                          />
                        </div>

                        <div className="md:col-span-2">
                          <Label htmlFor="descricao" className="text-sm font-medium">
                            Descrição *
                          </Label>
                          <Textarea
                            id="descricao"
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                            placeholder="Descreva os detalhes da atualização..."
                            rows={4}
                            className="mt-1"
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="autor" className="text-sm font-medium">
                            Autor *
                          </Label>
                          <Input
                            id="autor"
                            type="text"
                            value={autor}
                            onChange={(e) => setAutor(e.target.value)}
                            placeholder="Seu nome"
                            className="mt-1"
                            required
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-500">Data</Label>
                          <Input
                            type="text"
                            value={new Date().toLocaleDateString("pt-BR")}
                            disabled
                            className="mt-1 bg-gray-50"
                          />
                          <p className="text-xs text-gray-500 mt-1">Data atual será salva automaticamente</p>
                        </div>
                      </div>

                      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={submitting}>
                        {submitting ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            Salvar Atualização
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Lista de Atualizações */}
                <Card className="shadow-lg">
                  <CardHeader className="bg-green-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-green-800">
                          <FileText className="h-5 w-5" />
                          Atualizações Recentes
                        </CardTitle>
                        <CardDescription>Histórico de todas as atualizações da equipe</CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        onClick={carregarAtualizacoes}
                        disabled={loading}
                        className="border-green-200 text-green-700 hover:bg-green-50"
                      >
                        {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {loading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                          </div>
                        ))}
                      </div>
                    ) : atualizacoes.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma atualização ainda</h3>
                        <p className="text-gray-500">Seja o primeiro a publicar uma atualização para a equipe!</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {atualizacoes.map((atualizacao, index) => (
                          <div
                            key={atualizacao.id || index}
                            className="border-l-4 border-l-blue-500 bg-white p-6 rounded-r-lg shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <h3 className="text-xl font-bold text-gray-900 leading-tight">{atualizacao.titulo}</h3>
                              <Badge variant="outline" className="ml-4 shrink-0">
                                #{atualizacoes.length - index}
                              </Badge>
                            </div>

                            <p className="text-gray-700 mb-4 leading-relaxed">{atualizacao.descricao}</p>

                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                <span className="italic">{atualizacao.autor}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <CalendarDays className="h-4 w-4" />
                                <span>{formatarData(atualizacao.data)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Rodapé */}
                <div className="text-center text-sm text-gray-500">
                  <p>
                    Total de atualizações: <strong>{atualizacoes.length}</strong>
                  </p>
                </div>
              </div>

              <Toaster />
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <Toaster />
    </div>
  )
}
