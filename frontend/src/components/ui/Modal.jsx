import { useEffect } from 'react'

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-md', md: 'max-w-lg',
    lg: 'max-w-2xl', xl: 'max-w-4xl'
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`
          relative bg-white rounded-xl shadow-xl
          w-full ${sizes[size]} max-h-screen overflow-y-auto
        `}>
          <div className="flex items-center justify-between
            p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600
                text-xl font-bold"
            >
              ✕
            </button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  )
}

export default Modal