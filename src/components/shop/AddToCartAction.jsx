import { useState } from 'react'

import { addItemToCart } from '../../redux/cart/cartActions.js'
import { useAppDispatch } from '../../redux/hooks.js'

function clampQuantity(value, maxQuantity) {
  const parsedValue = Number.parseInt(value, 10)

  if (Number.isNaN(parsedValue)) {
    return 1
  }

  return Math.min(Math.max(parsedValue, 1), maxQuantity)
}

export function AddToCartAction({ productId, stock, label = 'Add to Cart', alwaysExpanded = false, disabled = false, disabledLabel = 'Unavailable' }) {
  const dispatch = useAppDispatch()
  const [quantity, setQuantity] = useState(1)
  const [isExpanded, setIsExpanded] = useState(alwaysExpanded)
  const numericStock = Number(stock)
  const maxQuantity = Number.isFinite(numericStock) && numericStock > 0 ? numericStock : 99

  function updateQuantity(nextQuantity) {
    setQuantity(clampQuantity(nextQuantity, maxQuantity))
  }

  function handleAddToCart() {
    dispatch(addItemToCart({ productId, quantity }))
    setIsExpanded(alwaysExpanded)
  }

  function handlePrimaryAction() {
    if (disabled) {
      return
    }

    if (alwaysExpanded) {
      handleAddToCart()
      return
    }

    if (!isExpanded) {
      setIsExpanded(true)
      return
    }

    handleAddToCart()
  }

  return (
    <div className="inline-flex max-w-full items-center overflow-hidden rounded-full bg-[#203728] text-white shadow-sm">
      <button
        type="button"
        className={`px-4 py-3 text-sm font-semibold transition ${disabled ? 'cursor-not-allowed bg-slate-400 text-white' : 'hover:bg-[#192c20]'}`}
        onClick={handlePrimaryAction}
        disabled={disabled}
      >
        {disabled ? disabledLabel : isExpanded ? `${label} x${quantity}` : label}
      </button>
      {isExpanded && !disabled ? (
        <div className="flex items-center border-l border-white/15 bg-white text-[#161d29]">
          <button
            type="button"
            className="px-3 py-3 text-lg font-semibold text-[#344256] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => updateQuantity(quantity - 1)}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
          >
            -
          </button>
          <input
            type="number"
            min="1"
            max={maxQuantity}
            value={quantity}
            onChange={(event) => updateQuantity(event.target.value)}
            className="w-14 border-x border-[#dfe5ec] px-2 py-3 text-center text-sm font-semibold text-[#161d29] outline-none"
            aria-label="Quantity"
          />
          <button
            type="button"
            className="px-3 py-3 text-lg font-semibold text-[#344256] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => updateQuantity(quantity + 1)}
            disabled={quantity >= maxQuantity}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      ) : null}
    </div>
  )
}