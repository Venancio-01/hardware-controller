import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCoreStatus } from '@/hooks/useCoreStatus';
import { CoreStatusBadge } from '@/components/system/CoreStatusBadge';
import { Activity, Wifi, Clock, Server } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function LoginStatusPanel() {
  const { status, connectionStatus, uptime } = useCoreStatus();

  const formatUptime = (ms: number | null) => {
    if (!ms) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getConnectionBadgeVariant = (status: string) => {
    switch (status) {
      case 'connected':
        return 'default'; // Using default (primary) for connected
      case 'connecting':
        return 'secondary';
      case 'error':
      case 'disconnected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const connectionLabel = {
    connected: '已连接',
    connecting: '连接中...',
    disconnected: '未连接',
    error: '连接错误',
  }[connectionStatus] || '未知';

  return (
    <div className="h-full flex flex-col justify-center p-6 lg:p-10 bg-muted/30 backdrop-blur-sm rounded-r-xl border-l border-border/50">
      <div className="space-y-6 max-w-sm mx-auto w-full">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">系统运行状态</h2>
          <p className="text-sm text-muted-foreground">
            实时监控设备运行各项指标
          </p>
        </div>

        <div className="space-y-4">
          <Card className="bg-background/60 shadow-sm border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Server className="h-4 w-4 text-primary" />
                控制核心
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">运行状态</span>
                <CoreStatusBadge
                  status={status}
                  connectionStatus={connectionStatus}
                  showIcon={true}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background/60 shadow-sm border-border/60">
             <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Wifi className="h-4 w-4 text-primary" />
                网络连接
              </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">连接状态</span>
                <Badge variant={getConnectionBadgeVariant(connectionStatus)} className="gap-1">
                   {connectionStatus === 'connected' && <Activity className="h-3 w-3 animate-pulse" />}
                   {connectionLabel}
                </Badge>
              </div>
            </CardContent>
          </Card>

           <Card className="bg-background/60 shadow-sm border-border/60">
             <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                持续运行
              </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">已运行时长</span>
                <span className="font-mono text-sm font-medium">{formatUptime(uptime)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="pt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          系统实时监控中
        </div>
      </div>
    </div>
  );
}
