import { ref } from "vue";

export interface StepItem {
    id: number;
    title: string;
}

export function useStep(initStep = 1) {
    const { t } = useI18n();
    const STEPS: StepItem[] = [
        { id: 1, title: t("datasets.create.step.one") },
        { id: 2, title: t("datasets.create.step.two") },
        { id: 3, title: t("datasets.create.step.three") },
    ];

    const step = ref<number>(initStep);
    const nextStep = () => {
        if (step.value < STEPS.length) step.value += 1;
    };

    const changeStep = (delta: number) => {
        const next = step.value + delta;
        if (next >= 1 && next <= STEPS.length) step.value = next;
    };

    return {
        step,
        STEPS,
        nextStep,
        changeStep,
    };
}
