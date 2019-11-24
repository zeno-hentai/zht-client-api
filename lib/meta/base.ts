export interface ZHTBaseMeta<Type extends string> {
    type: Type
    title: string
    description: string
    language: "zh-CN" | "en-US" | "jp"
}