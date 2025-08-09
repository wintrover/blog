import { writable } from 'svelte/store'
import { postsData } from '../lib/posts.js'

export const posts = writable(postsData)