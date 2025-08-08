export default defineAppConfig({
    toaster: {
        position: "bottom-right" as const,
        expand: true,
        duration: 5000,
    },
    theme: {
        radius: 0.25,
        blackAsPrimary: false,
    },
    ui: {
        colors: {
            primary: "indigo",
            secondary: "blue",
            success: "green",
            info: "blue",
            warning: "yellow",
            error: "red",
            neutral: "neutral",
        },
        tooltip: {
            slots: {
                content: "bg-foreground text-background",
                arrow: "fill-foreground",
            },
        },
        card: {
            slots: {
                header: "p-4 sm:px-6 border-none !pb-0",
                body: "ring-0",
                footer: "p-4 sm:px-6",
            },
        },
        accordion: {
            slots: {
                header: "flex px-3",
                content: "px-2",
            },
        },
        modal: {
            slots: {
                overlay:
                    "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
            },
        },
    },
});
