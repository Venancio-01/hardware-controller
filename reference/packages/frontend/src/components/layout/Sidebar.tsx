import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { DeviceStatus } from 'shared'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Cpu, Activity, Wifi } from "lucide-react"
import { useCoreStatus } from '@/hooks/useCoreStatus'
import { CoreStatusBadge } from '@/components/system/CoreStatusBadge'
import { formatUptime } from '@/lib/formatters'
import { RestartCoreButton } from '@/components/system/RestartCoreButton'
import { Skeleton } from "@/components/ui/skeleton"

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
    connections,
  } = useCoreStatus();


  // 硬件连接状态渲染
  const renderHardwareConnection = () => {
    const isCabinetConnected = coreStatus === 'Running' && (connections?.cabinet ?? false);
    const isControlConnected = coreStatus === 'Running' && (connections?.control ?? false);
    const bothConnected = isCabinetConnected && isControlConnected;

    return (
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {!bothConnected ? (
            <>
              <span className={isCabinetConnected ? "" : "text-destructive font-medium"}>供弹柜</span>
              <span>/</span>
              <span className={isControlConnected ? "" : "text-destructive font-medium"}>控制柜</span>
            </>
          ) : (
            "供弹柜/控制柜"
          )}
        </span>
        {(() => {
          if (connectionStatus !== 'connected') {
            return <Badge variant="outline" className="gap-1">未连接</Badge>;
          }

          if (bothConnected) {
            return (
              <Badge variant="default" className="gap-1">
                <Activity className="h-3 w-3 animate-pulse" />
                已连接
              </Badge>
            );
          } else {
            return (
              <Badge variant="destructive" className="gap-1">
                <Activity className="h-3 w-3 animate-pulse" />
                未连接
              </Badge>
            );
          }
        })()}
      </div>
    );
  };

  return (
    <aside className="lg:col-span-1 space-y-4">
      {/* 程序状态卡片 */}
      <Card className="transition-all duration-300 hover:shadow-md border-0 shadow-sm bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            程序状态
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* 运行状态 (对应控制核心) */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">运行状态</span>
            {isLoading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <CoreStatusBadge status={coreStatus} connectionStatus={connectionStatus} showIcon={true} />
            )}
          </div>

          {/* 硬件连接 (供弹柜/控制柜) */}
          {isLoading ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">供弹柜/控制柜</span>
              <Skeleton className="h-6 w-20" />
            </div>
          ) : (
            renderHardwareConnection()
          )}

          {/* 已运行时长 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              已运行时长
            </span>
            {isLoading ? (
              <Skeleton className="h-5 w-24" />
            ) : (
                <span className="text-sm font-medium">{formatUptime(coreUptime)}</span>
            )}
          </div>

          <div className="pt-2">
            {isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <RestartCoreButton className="w-full" />
            )}
          </div>
        </CardContent>
      </Card>
    </aside>
  )
}
