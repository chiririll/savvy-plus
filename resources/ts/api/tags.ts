import { createCrudApi } from './crud'
import { Tag } from '@/types'
import { TagFormData } from '@/schemas'

export const tagsApi = createCrudApi<Tag, TagFormData>('/tags')
