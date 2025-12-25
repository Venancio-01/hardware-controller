import { DeviceStatusDashboard } from "@/components/DeviceStatusDashboard";
import { ConfigForm } from "@/components/ConfigForm";
import { ConfigFormValues } from "@/lib/validation";
import { Settings } from "lucide-react";

// 模拟当前配置数据
const defaultConfig: ConfigFormValues = {
  ipAddress: "192.168.1.100",
  subnetMask: "255.255.255.0",
  gateway: "192.168.1.1",
  port: 8080,
  deviceId: "node-switch-001",
  relayIndex: 0,
};

const Index = () => {
  // 模拟保存配置
  const handleSaveConfig = async (values: ConfigFormValues) => {
    // 模拟 API 调用延迟
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log("Configuration saved:", values);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 页面头部 */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">设备配置</h1>
              <p className="text-sm text-muted-foreground">配置网络参数和设备设置</p>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧仪表盘 (1/3 宽度) */}
          <aside className="lg:col-span-1">
            <div className="sticky top-8">
              <DeviceStatusDashboard
                isOnline={true}
                lastUpdate="刚刚"
                currentIp={defaultConfig.ipAddress}
                currentPort={defaultConfig.port}
                protocol="TCP/IP"
              />
            </div>
          </aside>

          {/* 右侧配置表单 (2/3 宽度) */}
          <section className="lg:col-span-2">
            <ConfigForm 
              defaultValues={defaultConfig}
              onSave={handleSaveConfig}
            />
          </section>
        </div>
      </main>
    </div>
  );
};

export default Index;
