import { useMessage, useModal } from "@fastbuildai/ui";
import { h, markRaw, ref, resolveComponent, computed, type Ref } from "vue";
import type { DatasetDocument, DatasetSegment } from "@/models/ai-datasets";
import {
    apiDeleteDocument,
    apiRenameDocument,
    apiBatchDeleteSegments,
    apiCreateSegment,
    apiDeleteSegment,
    apiUpdateSegment,
    apiRetryDocument,
    apiSetDocumentEnabled,
} from "@/services/console/ai-datasets";

const UTextarea = defineAsyncComponent(
    () => import("@nuxt/ui/runtime/components/Textarea.vue" as string),
);
const UInput = defineAsyncComponent(
    () => import("@nuxt/ui/runtime/components/Input.vue" as string),
);

export function useSelection<T>(items: Ref<T[] | undefined>, getId: (item: T) => string) {
    const selected = ref<Set<string>>(new Set());

    const isAll = computed(() => {
        const list = items.value ?? [];
        return list.length > 0 && selected.value.size === list.length;
    });

    const isIndeterminate = computed(() => {
        const list = items.value ?? [];
        return selected.value.size > 0 && selected.value.size < list.length;
    });

    const toggle = (id: string) => {
        selected.value.has(id) ? selected.value.delete(id) : selected.value.add(id);
    };

    const toggleAll = () => {
        const list = items.value ?? [];
        selected.value = isAll.value ? new Set() : new Set(list.map(getId));
    };

    const clear = () => {
        selected.value.clear();
    };

    return {
        selected,
        isAll,
        isIndeterminate,
        toggle,
        toggleAll,
        clear,
    };
}

export function useDocumentActions() {
    const toast = useMessage();
    const { t } = useI18n();
    const { params: URLQueryParams } = useRoute();
    const datasetId = computed(() => (URLQueryParams as Record<string, string>).id);

    /** 删除文档 */
    const deleteDocument = async (id: string, onSuccess?: () => void) => {
        try {
            await useModal({
                color: "error",
                title: t("console-ai-datasets.documents.delete.title"),
                content: t("console-ai-datasets.documents.delete.desc"),
                confirmText: t("console-common.delete"),
                ui: {
                    content: "!w-sm",
                },
            });

            await apiDeleteDocument(id, datasetId.value as string);
            toast.success(t("common.message.deleteSuccess"));
            refreshNuxtData(`dataset-detail-${datasetId.value}`);
            onSuccess?.();
        } catch (error) {
            console.error("删除失败:", error);
            toast.error((error as Error).message);
        }
    };

    /** 重命名文档 */
    const renameDocument = async (document: DatasetDocument, onSuccess?: () => void) => {
        try {
            const newName = ref(document.fileName);

            const RenameForm = markRaw({
                setup() {
                    return () =>
                        h("div", { class: "py-2" }, [
                            h(
                                "div",
                                { class: "text-sm text-gray-600 mb-3" },
                                t("console-ai-datasets.documents.renameModal.desc"),
                            ),
                            h(UInput, {
                                modelValue: newName.value,
                                "onUpdate:modelValue": (value: string) => {
                                    newName.value = value;
                                },
                                placeholder: t(
                                    "console-ai-datasets.documents.renameModal.placeholder",
                                ),
                                class: "w-full",
                                size: "md",
                            }),
                        ]);
                },
            });

            await useModal({
                title: t("console-ai-datasets.documents.renameModal.title"),
                content: RenameForm,
                confirmText: t("console-common.confirm"),
                cancelText: t("console-common.cancel"),
                ui: {
                    content: "!w-sm",
                },
            });

            if (newName.value && newName.value !== document.fileName) {
                await apiRenameDocument(document.id, {
                    fileName: newName.value,
                    datasetId: datasetId.value as string,
                });
                toast.success(t("console-ai-datasets.documents.renameModal.success"));
                onSuccess?.();
            }
        } catch (error) {
            console.error("重命名失败:", error);
            toast.error(t("console-ai-datasets.documents.renameModal.failed"));
        }
    };

    /** 重试文档 */
    const retryDocument = async (id: string, onSuccess?: () => void) => {
        try {
            await useModal({
                title: t("console-ai-datasets.documents.retry.title"),
                content: t("console-ai-datasets.documents.retry.desc"),
                confirmText: t("console-common.confirm"),
                cancelText: t("console-common.cancel"),
                ui: {
                    content: "!w-sm",
                },
            });

            await apiRetryDocument(id);
            toast.success(t("console-ai-datasets.documents.retry.success"));
            onSuccess?.();
        } catch (error) {
            console.error("重试失败:", error);
            toast.error(t("console-ai-datasets.documents.retry.failed"));
        }
    };

    /** 切换文档启用状态 */
    const toggleDocumentEnabled = async (id: string, enabled: boolean, onSuccess?: () => void) => {
        try {
            await useModal({
                title: enabled
                    ? t("console-ai-datasets.documents.enable.title")
                    : t("console-ai-datasets.documents.disable.title"),
                content: enabled
                    ? t("console-ai-datasets.documents.enable.desc")
                    : t("console-ai-datasets.documents.disable.desc"),
                confirmText: t("console-common.confirm"),
                cancelText: t("console-common.cancel"),
                ui: {
                    content: "!w-sm",
                },
            });

            await apiSetDocumentEnabled(id, enabled, datasetId.value as string);
            toast.success(
                t(
                    enabled
                        ? "console-ai-datasets.documents.enable.success"
                        : "console-ai-datasets.documents.disable.success",
                ),
            );
            onSuccess?.();
        } catch (error) {
            console.error("切换启用状态失败:", error);
            toast.error(
                t(
                    enabled
                        ? "console-ai-datasets.documents.enable.failed"
                        : "console-ai-datasets.documents.disable.failed",
                ),
            );
        }
    };

    return {
        deleteDocument,
        renameDocument,
        retryDocument,
        toggleDocumentEnabled,
    };
}

export function useSegmentActions() {
    const toast = useMessage();
    const { t } = useI18n();
    const { params: URLQueryParams } = useRoute();
    const datasetId = computed(() => (URLQueryParams as Record<string, string>).id);

    /** 删除分段（支持单个或批量）*/
    const deleteSegments = async (ids: string | string[], onSuccess?: () => void) => {
        try {
            const isBatch = Array.isArray(ids);
            await useModal({
                color: "error",
                title: isBatch
                    ? t("console-ai-datasets.segments.batchDelete.title")
                    : t("console-ai-datasets.segments.delete.title"),
                content: isBatch
                    ? t("console-ai-datasets.segments.batchDelete.confirmDesc")
                    : t("console-ai-datasets.segments.batchDelete.confirmDesc2"),
                confirmText: isBatch
                    ? t("console-ai-datasets.segments.batchDelete.confirmText")
                    : t("console-common.delete"),
                ui: { content: "!w-sm" },
            });

            if (isBatch) {
                await apiBatchDeleteSegments(ids, datasetId.value as string);
            } else {
                await apiDeleteSegment(ids, datasetId.value as string);
            }
            toast.success(t("console-ai-datasets.segments.batchDelete.success"));
            onSuccess?.();
        } catch (error) {
            console.error("删除失败:", error);
            toast.error(t("console-ai-datasets.segments.batchDelete.failed"));
        }
    };

    /** 创建分段 */
    const createSegment = async (documentId: string, onSuccess?: () => void) => {
        if (!documentId) {
            toast.error(t("console-ai-datasets.segments.createSegmentModal.tip"));
            return;
        }

        try {
            const newContent = ref("");

            const CreateForm = markRaw({
                setup() {
                    return () =>
                        h("div", { class: "py-2" }, [
                            h(
                                "div",
                                { class: "text-sm text-gray-600 mb-3" },
                                t("console-ai-datasets.segments.createSegmentModal.desc"),
                            ),
                            h(UTextarea, {
                                modelValue: newContent.value,
                                "onUpdate:modelValue": (value: string) =>
                                    (newContent.value = value),
                                placeholder: t(
                                    "console-ai-datasets.segments.createSegmentModal.placeholder",
                                ),
                                class: "w-full",
                                size: "md",
                                rows: 10,
                            }),
                        ]);
                },
            });

            await useModal({
                title: t("console-ai-datasets.segments.createSegment"),
                content: CreateForm,
                confirmText: t("console-common.create"),
                cancelText: t("console-common.cancel"),
                ui: { content: "!w-lg" },
            });

            if (newContent.value.trim()) {
                await apiCreateSegment({
                    documentId,
                    content: newContent.value.trim(),
                    datasetId: datasetId.value as string,
                });
                toast.success(t("console-ai-datasets.segments.createSegmentModal.success"));
                onSuccess?.();
            }
        } catch (error) {
            console.error("创建失败:", error);
            toast.error(t("console-ai-datasets.segments.createSegmentModal.failed"));
        }
    };

    /** 编辑分段 */
    const editSegment = async (segment: DatasetSegment, onSuccess?: () => void) => {
        try {
            const newContent = ref(segment.content);

            const EditForm = markRaw({
                setup() {
                    return () =>
                        h("div", { class: "py-2" }, [
                            h(
                                "div",
                                { class: "text-sm text-gray-600 mb-3" },
                                t("console-ai-datasets.segments.editSegmentModal.desc"),
                            ),
                            h(UTextarea, {
                                modelValue: newContent.value,
                                "onUpdate:modelValue": (value: string) =>
                                    (newContent.value = value),
                                placeholder: t(
                                    "console-ai-datasets.segments.editSegmentModal.placeholder",
                                ),
                                class: "w-full",
                                size: "md",
                                rows: 10,
                            }),
                        ]);
                },
            });

            await useModal({
                title: t("console-ai-datasets.segments.editSegmentModal.title"),
                content: EditForm,
                confirmText: t("console-common.confirm"),
                cancelText: t("console-common.cancel"),
                ui: { content: "!w-lg" },
            });

            if (newContent.value && newContent.value !== segment.content) {
                await apiUpdateSegment(segment.id, {
                    content: newContent.value,
                    datasetId: datasetId.value as string,
                });
                toast.success(t("console-ai-datasets.segments.editSegmentModal.success"));
                onSuccess?.();
            }
        } catch (error) {
            console.error("编辑失败:", error);
            toast.error(t("console-ai-datasets.segments.editSegmentModal.failed"));
        }
    };

    return {
        deleteSegments,
        createSegment,
        editSegment,
    };
}
