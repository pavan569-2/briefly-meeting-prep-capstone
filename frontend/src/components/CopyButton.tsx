import { useState, useEffect, useRef } from 'react'

interface CopyButtonProps {
  content: string
  label?: string
}

export function CopyButton({ content, label = 'Copy' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(false)
  const [clickCount, setClickCount] = useState(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (copied || error) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        setCopied(false)
        setError(false)
      }, 2000)
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [copied, error, clickCount])

  const handleCopy = async () => {
    try {
      if (!navigator.clipboard) {
        throw new Error('Clipboard API not available')
      }
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setError(false)
      setClickCount(c => c + 1)
    } catch {
      setError(true)
      setCopied(false)
      setClickCount(c => c + 1)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
      aria-live="polite"
    >
      {copied ? 'Copied!' : error ? 'Failed to copy' : label}
    </button>
  )
}
