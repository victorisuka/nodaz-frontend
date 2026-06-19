function getSearchableParts(product) {
  return [
    product?.title,
    product?.description,
    product?.category?.name,
    product?.subcategory?.name,
  ].filter(Boolean)
}

export function getProductCategoryLabel(product) {
  return product?.category?.name || product?.subcategory?.name || ''
}

export function getProductCategoryImageUrl(product) {
  return product?.category?.imageUrl || product?.subcategory?.imageUrl || ''
}

export function getProductSearchText(product) {
  return getSearchableParts(product).join(' ').toLowerCase()
}

export function summarizeProductCategories(products, limit = 4) {
  const counts = products.reduce((accumulator, product) => {
    const label = getProductCategoryLabel(product)

    if (!label) {
      return accumulator
    }

    accumulator[label] = accumulator[label] ?? {
      label,
      count: 0,
      imageUrl: getProductCategoryImageUrl(product),
    }

    accumulator[label].count += 1

    if (!accumulator[label].imageUrl) {
      accumulator[label].imageUrl = getProductCategoryImageUrl(product)
    }

    return accumulator
  }, {})

  return Object.values(counts)
    .sort((left, right) => right.count - left.count)
    .slice(0, limit)
}