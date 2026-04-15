import React from 'react'

interface FormErrorMessageProps {
  message: string | undefined
}
const FormErrorMessage = ({ message }: FormErrorMessageProps) => {
  return <div className="text-destructive text-sm">{message || ''}</div>
}

export default FormErrorMessage
