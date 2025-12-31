package types

// 状态类型定义
type State string

const (
	StateIdle      State = "idle"
	StateInit      State = "init"
	StateReady     State = "ready"
	StateRunning   State = "running"
	StateError     State = "error"
	StateShutting  State = "shutting"
	StateShutdown  State = "shutdown"
)

// 设备状态
type DeviceStatus struct {
	ID       string `json:"id"`
	Type     string `json:"type"`
	State    State  `json:"state"`
	Online   bool   `json:"online"`
	LastSeen int64  `json:"last_seen"`
}

// 配置类型
type Config struct {
	ListenAddr string `json:"listen_addr"`
	Debug      bool   `json:"debug"`
}
