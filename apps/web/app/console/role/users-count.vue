<script lang="ts" setup>
import { ProModal } from "@fastbuildai/ui";
import type { TableColumn } from "@nuxt/ui";
import { useI18n } from "vue-i18n";

import type { UserInfo } from "@/models/user";

const { t } = useI18n();

const props = defineProps<{
    users: UserInfo[];
    roleName: string;
}>();

const emit = defineEmits<{ (e: "close"): void }>();

const handleClose = () => {
    emit("close");
};

const TimeDisplay = resolveComponent("TimeDisplay");

const columns = computed<TableColumn<UserInfo>[]>(() => [
    {
        accessorKey: "userNo",
        header: t("console-financial.accountBalance.table.userNo"),
    },
    {
        accessorKey: "username",
        header: t("console-user.form.username"),
    },
    {
        accessorKey: "roleName",
        header: t("console-user.form.role"),
    },
    {
        accessorKey: "createdAt",
        header: t("console-common.createAt"),
        cell: ({ row }) => {
            const createdAt = row.getValue("createdAt") as string;
            return h(TimeDisplay, {
                datetime: createdAt,
                mode: "datetime",
            });
        },
    },
]);
</script>

<template>
    <ProModal
        :model-value="true"
        :title="t('console-system-perms.role.usersCountTitle')"
        :ui="{ content: 'max-w-3xl' }"
        @update:model-value="handleClose"
    >
        <UTable :data="props.users" :columns="columns">
            <template #username-cell="{ row }">
                <div class="flex items-center gap-2">
                    <UAvatar :src="row.original.avatar" size="sm" />
                    <div>{{ row.original.username }}</div>
                </div>
            </template>
            <template #roleName-cell="{ row }">
                {{ props.roleName }}
            </template>
        </UTable>
    </ProModal>
</template>
