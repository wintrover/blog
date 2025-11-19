import { readable } from 'svelte/store'
import { loadAllPosts } from '../lib/postLoader'
import { Post } from '../lib/types'

export const posts = readable<Post[]>([], set => {
  loadAllPosts().then(data => {
    set(data)
  })
})