import { useEffect, useRef, useState } from 'react'

const CELL_SIZE = 34
const CELL_GAP = 2
const MAX_CELLS = 600

export function AuthInteractiveGrid() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [cellCount, setCellCount] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateCellCount = () => {
      const { offsetWidth, offsetHeight } = container
      const cols = Math.ceil(offsetWidth / (CELL_SIZE + CELL_GAP))
      const rows = Math.ceil(offsetHeight / (CELL_SIZE + CELL_GAP))
      setCellCount(Math.min(cols * rows, MAX_CELLS))
    }

    updateCellCount()

    const observer = new ResizeObserver(updateCellCount)
    observer.observe(container)

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="auth-interactive-grid" aria-hidden>
      {Array.from({ length: cellCount }, (_, index) => (
        <span key={index} />
      ))}
      <div className="auth-interactive-scan" />
    </div>
  )
}
