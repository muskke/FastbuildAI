export interface PluginPackageJson {
    name: string;
    key: string;
    version: string;
    enabled: boolean;
    title: string;
    description: string;
    author: string;
    homepage: string;
}

export interface PluginConfigItem extends PluginPackageJson {
    path: string;
}

export interface PluginMinifestJson {
    name: string;
    key: string;
    version: string;
    title: string;
    description: string;
    author: string;
    homepage: string;
}
