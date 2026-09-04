import { createCrudApi } from './crud'
import { Tag, TagFormData } from '@/types'

export const tagsApi = createCrudApi<Tag, TagFormData>('/tags')
