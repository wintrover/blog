import { writable } from 'svelte/store'
import categoryConfig from '../lib/categories.json'

export const categories = writable(categoryConfig.categories)
export const selectedCategory = writable('all')

// 카테고리 메타데이터 가져오기
export function getCategoryInfo(categoryName) {
  return categoryConfig.categories[categoryName.toLowerCase()] || null
}

// 모든 카테고리 목록 가져오기
export function getAllCategories() {
  return Object.values(categoryConfig.categories)
}

// 카테고리 slug로 이름 찾기
export function getCategoryNameBySlug(slug) {
  const category = Object.values(categoryConfig.categories).find(cat => cat.slug === slug)
  return category ? category.name : null
}