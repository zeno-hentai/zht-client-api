export type ZHTLanguage = "unknown" | "zh" | "zh-Hans" | "zh-Hant" | "en-US" | "jp"

export type ZHTItemSource = {
    type: "local"
} | {
    type: "crawler"
    url: string
}

export interface ZHTBaseMeta<Type extends string> {
    type: Type
    title: string
    source: ZHTItemSource
    subTitles: {
        [K in ZHTLanguage]?: string
    }
    description: string
    language: ZHTLanguage
}