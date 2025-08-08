/**
 * HTTP拦截器测试
 * 测试是否成功拦截了原生HTTP API
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { enableNativeAPIBlocking, disableNativeAPIBlocking } from '../src/blockNative';

// 模拟全局window对象
const mockWindow = () => {
  global.window = {
    fetch: vi.fn(),
    XMLHttpRequest: vi.fn(),
    EventSource: vi.fn()
  } as any;
};

describe('HTTP API拦截器', () => {
  beforeEach(() => {
    mockWindow();
  });

  afterEach(() => {
    // 清理mock
    vi.restoreAllMocks();
    delete (global as any).window;
  });

  it('应该拦截fetch API', () => {
    // 启用拦截
    enableNativeAPIBlocking();
    
    // 尝试调用fetch应该抛出错误
    expect(() => {
      (window as any).fetch('https://example.com');
    }).toThrow('禁止直接使用原生fetch API');
  });

  it('应该拦截XMLHttpRequest', () => {
    // 启用拦截
    enableNativeAPIBlocking();
    
    // 尝试创建XMLHttpRequest实例应该抛出错误
    expect(() => {
      new (window as any).XMLHttpRequest();
    }).toThrow('禁止直接使用XMLHttpRequest');
  });

  it('应该拦截EventSource', () => {
    // 启用拦截
    enableNativeAPIBlocking();
    
    // 尝试创建EventSource实例应该抛出错误
    expect(() => {
      new (window as any).EventSource('https://example.com/events');
    }).toThrow('禁止直接使用EventSource');
  });

  it('应该可以禁用拦截并恢复原生API', () => {
    // 原始API引用
    const originalFetch = (window as any).fetch;
    
    // 启用拦截
    enableNativeAPIBlocking();
    
    // 确认fetch已被替换
    expect((window as any).fetch).not.toBe(originalFetch);
    
    // 禁用拦截
    disableNativeAPIBlocking();
    
    // 确认fetch已恢复
    expect((window as any).fetch).toBe(originalFetch);
  });
}); 