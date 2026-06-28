"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { io, type Socket } from "socket.io-client"
import { useAuth } from "./useAuth"

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
})

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { session } = useAuth()

  useEffect(() => {
    if (!session?.access_token) return

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001"

    const socketInstance = io(socketUrl, {
      auth: { token: session.access_token },
      transports: ["websocket", "polling"],
    })

    socketInstance.on("connect", () => setIsConnected(true))
    socketInstance.on("disconnect", () => setIsConnected(false))

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [session?.access_token])

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  return useContext(SocketContext)
}
