const Button = ({
  children, onClick, variant = 'primary',
  size = 'md', disabled = false,
  type = 'button', className = ''
}) => {
  const variants = {
    primary:   'bg-indigo-600 text-white hover:bg-indigo-700',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
    danger:    'bg-red-600 text-white hover:bg-red-700',
    success:   'bg-green-600 text-white hover:bg-green-700',
    ghost:     'bg-transparent text-gray-600 hover:bg-gray-100'
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center
        font-medium rounded-lg transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
    >
      {children}
    </button>
  )
}

export default Button