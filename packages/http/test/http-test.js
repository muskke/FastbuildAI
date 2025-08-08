/**
 * 这个文件用于测试ESLint规则
 * 下面的代码会触发ESLint警告/错误
 */

// 使用原生fetch API - 应该被ESLint检测
fetch("https://example.com/api/data")
    .then((response) => response.json())
    .then((data) => console.log(data));

// 使用XMLHttpRequest - 应该被ESLint检测
const xhr = new XMLHttpRequest();
xhr.open("GET", "https://example.com/api/data");
xhr.send();

// 使用EventSource - 应该被ESLint检测
const eventSource = new EventSource("https://example.com/events");
eventSource.onmessage = (event) => {
    console.log(event.data);
};

// 使用window.fetch - 应该被ESLint检测
window.fetch("https://example.com/api/data");

// 使用window.XMLHttpRequest - 应该被ESLint检测
const xhr2 = new window.XMLHttpRequest();
xhr2.open("GET", "https://example.com/api/data");
xhr2.send();

/**
 * 使用我们的HTTP客户端 - 不应该被ESLint检测
 * 这是推荐的做法
 */
import { http } from "@fastbuildai/http";

// 正确的做法
http.get("https://example.com/api/data").then((data) => console.log(data));
