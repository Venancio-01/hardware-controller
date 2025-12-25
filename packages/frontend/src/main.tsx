/**
 * 前端入口点
 *
 * 这是前端应用的主入口文件，用于启动 React 应用并将其渲染到 DOM。
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// 获取根 DOM 元素并渲染应用
const container = document.getElementById('root');
if (!container) {
  throw new Error('Failed to find the root element');
}

const root = ReactDOM.createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);