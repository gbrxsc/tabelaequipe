// Sistema de armazenamento compartilhado melhorado
export interface AppData {
  members: any[]
  events: any[]
  drawHistory: any[]
  cashEntries: any[]
  extraPlayers: string[]
  teamDrawCounts: { [key: string]: number }
  lastBackup: string
  lastModified: string
  version: number
}

const SHARED_STORAGE_KEY = "team-dashboard-shared-v2"
const BROADCAST_CHANNEL_NAME = "team-dashboard-sync"

class SharedStorage {
  private broadcastChannel: BroadcastChannel
  private listeners: ((data: AppData) => void)[] = []
  private syncInterval: NodeJS.Timeout | null = null

  constructor() {
    // Canal de broadcast para comunicação entre abas/janelas
    this.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME)
    this.broadcastChannel.onmessage = (event) => {
      if (event.data.type === "DATA_UPDATED") {
        this.notifyListeners(event.data.payload)
      }
    }

    // Escuta mudanças no localStorage de outras abas
    window.addEventListener("storage", (e) => {
      if (e.key === SHARED_STORAGE_KEY && e.newValue) {
        try {
          const data = JSON.parse(e.newValue)
          this.notifyListeners(data)
        } catch (error) {
          console.error("Erro ao processar dados do storage:", error)
        }
      }
    })

    // Polling para garantir sincronização
    this.startPolling()
  }

  // Salva dados e notifica todos os listeners
  saveData(data: Omit<AppData, "lastModified" | "version">): void {
    const fullData: AppData = {
      ...data,
      lastModified: new Date().toISOString(),
      version: Date.now(),
    }

    try {
      // Salva no localStorage
      localStorage.setItem(SHARED_STORAGE_KEY, JSON.stringify(fullData))

      // Notifica via BroadcastChannel
      this.broadcastChannel.postMessage({
        type: "DATA_UPDATED",
        payload: fullData,
      })

      // Notifica listeners locais
      this.notifyListeners(fullData)

      console.log("Dados salvos e sincronizados:", new Date().toLocaleTimeString())
    } catch (error) {
      console.error("Erro ao salvar dados:", error)
    }
  }

  // Carrega dados do localStorage
  loadData(): AppData | null {
    try {
      const data = localStorage.getItem(SHARED_STORAGE_KEY)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      return null
    }
  }

  // Força sincronização manual
  forceSync(): void {
    const data = this.loadData()
    if (data) {
      this.notifyListeners(data)
    }
  }

  // Adiciona listener para mudanças
  addListener(callback: (data: AppData) => void): void {
    this.listeners.push(callback)
  }

  // Remove listener
  removeListener(callback: (data: AppData) => void): void {
    this.listeners = this.listeners.filter((l) => l !== callback)
  }

  // Notifica todos os listeners
  private notifyListeners(data: AppData): void {
    this.listeners.forEach((callback) => {
      try {
        callback(data)
      } catch (error) {
        console.error("Erro ao notificar listener:", error)
      }
    })
  }

  // Polling para garantir sincronização
  private startPolling(): void {
    this.syncInterval = setInterval(() => {
      // Força uma verificação periódica
      const data = this.loadData()
      if (data) {
        // Verifica se há uma versão mais nova
        const currentTime = Date.now()
        const dataTime = new Date(data.lastModified).getTime()

        // Se os dados foram modificados nos últimos 5 segundos, notifica
        if (currentTime - dataTime < 5000) {
          this.notifyListeners(data)
        }
      }
    }, 1000) // Verifica a cada 1 segundo
  }

  // Para o polling
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
    this.broadcastChannel.close()
  }
}

export const sharedStorage = new SharedStorage()

// Função para limpar dados antigos (útil para debug)
export const clearSharedData = () => {
  localStorage.removeItem(SHARED_STORAGE_KEY)
  console.log("Dados compartilhados limpos")
}

// Função para verificar se há dados salvos
export const hasSharedData = (): boolean => {
  return localStorage.getItem(SHARED_STORAGE_KEY) !== null
}
