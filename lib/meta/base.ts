export type ZHTLanguage = "unknown" | "zh-CN" | "en-US" | "jp"

export interface ZHTBaseMeta<Type extends string> {
    type: Type
    title: string
    subTitles: {
        [K in ZHTLanguage]?: string
    }
    description: string
    language: ZHTLanguage
}