import { getStatusColor } from '../../utils/formatters'

const Badge = ({ status, label }) => (
  <span className={`
    inline-flex items-center px-2.5 py-0.5
    rounded-full text-xs font-medium
    ${getStatusColor(status)}
  `}>
    {label || status}
  </span>
)

export default Badge