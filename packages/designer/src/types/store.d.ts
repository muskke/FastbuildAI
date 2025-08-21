/**
 * 设计 Store 接口定义
 * 定义外部应用需要提供的 store 接口
 */
export interface DesignStoreInterface {
    // 状态
    components: ComponentConfig[];
    activeComponent: ComponentConfig | undefined;
    draggedComponent: ComponentMenuItem | null;
    configs: PageMateConfig;
    projectName: string;
    showSafeArea: boolean;
    isCanvasSelected: boolean;
    isDirty: boolean;

    // 方法
    addComponent(config: {
        type: string;
        title: string;
        position: Position;
        isHidden: boolean;
        size: Size;
        props: Record<string, any>;
    }): ComponentConfig;
    updatePosition(id: string, position: Position): void;
    updateSize(id: string, size: Size): void;
    updateProperties(id: string, props: Record<string, any>): void;
    updateVisible(id: string, value: boolean): void;
    setActiveComponent(id: string | null): void;
    removeComponent(id: string): void;
    setDraggedComponent(component: ComponentMenuItem | null): void;
    resetState(): void;
    getPages(id: string): Promise<any>;
    savePages(): Promise<any>;
}
