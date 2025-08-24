import { readable } from 'svelte/store'
import { loadAllPosts } from '../lib/postLoader.js'

export const posts = readable([], set => {
  loadAllPosts().then(data => {
    set(data)
  })
})