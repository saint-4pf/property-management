import { formatCurrency } from '../../utils/formatters'

const StatCard = ({
  title, value, isCurrency = false,
  color = 'indigo', icon, subtitle
}) => {
  const colors = {
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    green:  'bg-green-50  border-green-200  text-green-700',
    red:    'bg-red-50    border-red-200    text-red-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    blue:   'bg-blue-50   border-blue-200   text-blue-700'
  }
  return (
    <div className={`rounded-xl border-2 p-5 ${colors[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-500">
          {title}
        </span>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
      <p className={`text-2xl font-bold ${colors[color].split(' ')[2]}`}>
        {isCurrency ? formatCurrency(value) : value}
      </p>
      {subtitle && (
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
  )
}

export default StatCard