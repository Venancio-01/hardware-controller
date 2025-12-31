import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCoreStatus } from '@/hooks/useCoreStatus';
import { CoreStatusBadge } from '@/components/system/CoreStatusBadge';
import { Activity, Wifi, Clock, Server, Plug } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function LoginStatusPanel() {
  const { status, connectionStatus, uptime, connections } = useCoreStatus();

  const formatUptime = (ms: number | null) => {
    if (!ms) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);


    if (days > 0) return `${days}天 ${hours % 24}小时 ${minutes % 60}分钟`;
    if (hours > 0) return `${hours}小时 ${minutes % 60}分钟`;
    if (minutes > 0) return `${minutes}分钟`;
    return `${seconds}秒`;
  };


  return (
    <div className="h-full flex flex-col justify-center p-4 lg:p-6 bg-muted/30 backdrop-blur-sm rounded-r-xl border-l border-border/50">
      <div className="space-y-4 max-w-sm mx-auto w-full">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">系统运行状态</h2>
          <p className="text-sm text-muted-foreground">
            实时监控设备运行各项指标
          </p>
        </div>

        <div className="space-y-3">
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

          {/* 硬件连接状态 */}
          <Card className="bg-background/60 shadow-sm border-border/60">
             <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Wifi className="h-4 w-4 text-primary" />
                硬件连接
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                {(() => {
                  // Connection check logic extracted for scope access
                  const isCabinetConnected = status === 'Running' && (connections?.cabinet ?? false);
                  const isControlConnected = status === 'Running' && (connections?.control ?? false);
                  const bothConnected = isCabinetConnected && isControlConnected;

                  return (
                    <>
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
                        let label = '未连接';
                        let variant: "default" | "destructive" | "outline" | "secondary" = 'destructive';
                        let className = "gap-1";

                        if (connectionStatus !== 'connected') {
                          return <Badge variant="outline" className="gap-1">未连接</Badge>;
                        }

                        if (bothConnected) {
                          label = '已连接';
                          variant = 'default';
                        } else {
                          // Any failure results in error state
                          label = '未连接';
                          variant = 'destructive';
                        }

                        return (
                          <Badge variant={variant} className={className}>
                            {<Activity className="h-3 w-3 animate-pulse" />}
                            {label}
                          </Badge>
                        );
                      })()}
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

           <Card className="bg-background/60 shadow-sm border-border/60">
             <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
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
