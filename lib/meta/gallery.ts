import { ZHTBaseMeta } from './base';
export interface GalleryMeta extends ZHTBaseMeta<"gallery"> {
    pageNumber: number
    files: {[key: number]: string}
    preview: string
}