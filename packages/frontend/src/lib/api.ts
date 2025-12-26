/**
 * API 请求工具函数
 *
 * 封装原生 fetch，自动处理认证 Token 和 401 错误
 */

/**
 * 带有认证支持的 fetch 包装器
 */
export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // 1. 获取本地存储的 Token
  const token = localStorage.getItem('token');

  // 2. 准备请求头
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // 如果是发送 JSON 数据，确保 Content-Type
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // 3. 执行请求
  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  // 4. 处理认证失效 (401)
  if (response.status === 401) {
    localStorage.removeItem('token');
    // 如果不是在登录页，则重定向
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
    throw new Error('认证已过期，请重新登录');
  }

  // 5. 处理非 OK 响应 (4xx, 5xx)
  if (!response.ok) {
    let errorMsg = `API 错误: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorMsg;
    } catch {
      // 无法解析 JSON 则保持默认错误消息
    }
    throw new Error(errorMsg);
  }

  // 6. 解析响应内容
  const json = await response.json();

  // 统一的成功/错误结构处理
  if (!json.success) {
    throw new Error(json.error || '未知 API 错误');
  }

  // 返回数据负载
  // 有些API返回 { success, data: {...} }, 有些直接返回 { success, token, ... }
  // 如果有 data 字段,返回 data; 否则返回整个响应对象
  return json.data !== undefined ? json.data as T : json as T;
}