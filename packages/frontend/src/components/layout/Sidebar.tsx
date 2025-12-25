import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { DeviceStatus } from 'shared'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Wifi, WifiOff, Clock, Server, Globe, Hash, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { useState } from 'react'
import { toast } from "sonner"

export function Sidebar() {
  const [isTesting, setIsTesting] = useState(false);
  const { data: status, isLoading } = useQuery({
    queryKey: ['status'],
    queryFn: () => apiFetch<DeviceStatus>('/api/status'),
    refetchInterval: 5000,
  })

  // 格式化时间
  const formatTime = () => {
    return new Date().toLocaleTimeString('zh-CN', { hour12: false });
  };

  const handleTestConnection = async () => {
    if (!status) return;

    setIsTesting(true);

    // 模拟测试连接 (Mock)
    // 实际项目中应调用后端测试接口
    setTimeout(() => {
      const success = Math.random() > 0.3; // Random success for mock
      if (success) {
        toast.success("连接测试成功", {
          description: `成功连接到 ${status.ipAddress}:${status.port}`,
          icon: <CheckCircle2 className="h-4 w-4" />,
        });
      } else {
        toast.error("连接测试失败", {
          description: "请检查网络配置后重试",
          icon: <XCircle className="h-4 w-4" />,
        });
      }
      setIsTesting(false);
    }, 1500);
  };

  const isOnline = status?.online ?? false;
  const ipAddress = status?.ipAddress || '--';
  const port = status?.port || 0;
  const protocol = status?.protocol || '--';

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
      {/* 设备状态卡片 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-emerald-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-destructive" />
            )}
            设备状态
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">连接状态</span>
            <Badge variant={isOnline ? "default" : "destructive"} className={isOnline ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
              {isOnline ? "在线" : "离线"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              最后更新
            </span>
            <span className="text-sm font-medium">{formatTime()}</span>
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

      {/* 测试连接按钮 */}
      <Button
        onClick={handleTestConnection}
        disabled={isTesting || !status}
        variant="outline"
        className="w-full"
      >
        {isTesting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            测试中...
          </>
        ) : (
          <>
            <Wifi className="h-4 w-4" />
            测试连接
          </>
        )}
      </Button>
    </aside>
  )
}
