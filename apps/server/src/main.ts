import "@common/utils/env.util";

const startTime = Date.now();
// updatePluginListCache();

import { FileService } from "@common/base/services/file.service";
import { setGlobalContainer } from "@common/utils/global-container.util";
import { setAssetsDir, tryListen } from "@common/utils/system.util";
import { HttpLoggerInterceptor, LoggerModule } from "@core/logger";
// import { loadAllPlugins, updatePluginListCache } from "@core/plugins/plugins.module";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory, Reflector } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import * as bodyParser from "body-parser";
import bodyParserXml from "body-parser-xml";
import cookieParser from "cookie-parser";

import { appConfig } from "./common/config/app.config";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";
import { AppModule } from "./modules/app.module";

/**
 * 启动应用程序
 */
async function bootstrap() {
    // const plugins = await loadAllPlugins();
    // const dynamicAppModule = await AppModule.register(plugins);
    const dynamicAppModule = await AppModule.register();

    // 确保端口是数字类型
    const port = process.env.SERVER_PORT ? parseInt(process.env.SERVER_PORT, 10) : 4090;

    // 创建日志服务实例
    const appLogger = LoggerModule.createLogger(appConfig.name);
    const app = await NestFactory.create<NestExpressApplication>(dynamicAppModule, {
        logger: appLogger,
    });

    bodyParserXml(bodyParser);

    app.use(
        bodyParser.xml({
            limit: "1mb", // 请求体最大限制
            xmlParseOptions: {
                explicitArray: false, // 不把所有子节点解析成数组
            },
        }),
    );

    // 初始化全局容器
    setGlobalContainer(app);

    // 配置cookie解析器
    app.use(cookieParser());

    // 配置跨域
    const corsEnabled = process.env.SERVER_CORS_ENABLED === "true";
    if (corsEnabled) {
        app.enableCors({
            origin: process.env.SERVER_CORS_ORIGIN || "*",
            credentials: true,
        });
        appLogger.log(
            `已启用跨域(CORS)，允许来源: ${process.env.SERVER_CORS_ORIGIN || "*"}`,
            "Bootstrap",
        );
    }

    // 设置静态资源目录
    await setAssetsDir(app);

    // 启用全局验证管道
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
        }),
    );

    // 注册全局响应拦截器
    app.useGlobalInterceptors(
        new TransformInterceptor(app.get(Reflector), app.get(FileService)),
        new HttpLoggerInterceptor(appLogger),
    );

    // 注册全局异常过滤器
    app.useGlobalFilters(new HttpExceptionFilter());

    // 尝试监听端口，如果被占用则尝试其他端口（仅在开发环境下）
    tryListen(app, port, 3, startTime).catch((err) => {
        console.error("启动服务失败:", err);
        process.exit(1);
    });
}

// 处理未捕获的异常，防止进程崩溃
process.on("uncaughtException", (error) => {
    console.error("未捕获的异常:", error);
    // 记录错误但不退出进程（在生产环境中可能需要重启）
    if (process.env.NODE_ENV === "production") {
        console.error("生产环境检测到未捕获异常，建议检查代码");
    }
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("未处理的Promise拒绝:", reason);
    console.error("Promise:", promise);
    // 记录错误但不退出进程
    if (process.env.NODE_ENV === "production") {
        console.error("生产环境检测到未处理的Promise拒绝，建议检查代码");
    }
});

bootstrap();
