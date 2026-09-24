import React from 'react'
const STATUS_CLASS = {
  'Pending Stage 1': 'badge badge--pending',
  'Pending Stage 2': 'badge badge--review',
  Successful: 'badge badge--success',
  Failed: 'badge badge--rejected',
}
export default function Badge({ status }) { return <span className={STATUS_CLASS[status] || 'badge'}>{status}</span> }
