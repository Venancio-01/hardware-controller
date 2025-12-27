import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { DeviceStatus } from 'shared'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Server, Globe, Hash, Loader2, Cpu, Timer, AlertCircle, Link2, Link2Off } from "lucide-react"
import { useCoreStatus } from '@/hooks/useCoreStatus'
import { CoreStatusBadge } from '@/components/system/CoreStatusBadge'
import { formatUptime } from '@/lib/formatters'
import { RestartCoreButton } from '@/components/system/RestartCoreButton'

export function Sidebar() {

  // 设备状态 (REST API)
  const { data: status, isLoading } = useQuery({
    queryKey: ['status'],
    queryFn: () => apiFetch<DeviceStatus>('/api/status'),
    refetchInterval: 5000,
  })

  // Core 进程状态 (WebSocket)
  const {
    status: coreStatus,
    uptime: coreUptime,
    lastError: coreLastError,
    connectionStatus,
    connectionError,
  } = useCoreStatus();

  const ipAddress = status?.ipAddress || '--';
  const port = status?.port || 0;
  const protocol = status?.protocol || '--';

  // WebSocket 连接状态徽章
  const getConnectionBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 gap-1">
            <Link2 className="h-3 w-3" />
            已连接
          </Badge>
        );
      case 'connecting':
        return (
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            连接中
          </Badge>
        );
      case 'disconnected':
      case 'error':
        return (
          <Badge variant="destructive" className="gap-1">
            <Link2Off className="h-3 w-3" />
            已断开
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <aside className="lg:col-span-1 space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading status...</span>
            </div>
          </CardContent>
        </Card>
      </aside>
    )
  }

  return (
    <aside className="lg:col-span-1 space-y-4">
      {/* Core 进程状态卡片 */}
      <Card className="transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            程序状态
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* WebSocket 连接状态 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">连接状态</span>
            {getConnectionBadge()}
          </div>

          {/* Core 进程状态 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">进程状态</span>
            <CoreStatusBadge status={coreStatus} connectionStatus={connectionStatus} />
          </div>

          {/* 运行时间 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Timer className="h-3.5 w-3.5" />
              运行时间
            </span>
            <span className="text-sm font-medium">{formatUptime(coreUptime)}</span>
          </div>

          {/* 错误信息 (仅在有错误时显示) */}
          {(coreLastError || connectionError) && (
            <div className="pt-2 border-t">
              <div className="flex items-start gap-2 text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p className="text-sm break-words">{connectionError || coreLastError}</p>
              </div>
            </div>
          )}


          {/* 重启控制 */}
          <div className="pt-2 border-t flex justify-end">
            <RestartCoreButton />
          </div>
        </CardContent>
      </Card>

      {/* 连接信息卡片 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Server className="h-4 w-4" />
            连接信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              IP 地址
            </span>
            <span className="text-sm font-mono font-medium">{ipAddress}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5" />
              端口号
            </span>
            <span className="text-sm font-mono font-medium">{port}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">协议类型</span>
            <Badge variant="secondary">{protocol}</Badge>
          </div>
        </CardContent>
      </Card>

    </aside>
  )
}
