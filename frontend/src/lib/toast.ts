import { toast } from "sonner"

export const showToast = {
  success: (message: string, description?: string) => {
    toast.success(message, {
      description,
      className: "success",
    })
  },
  
  error: (message: string, description?: string) => {
    toast.error(message, {
      description,
      className: "error",
    })
  },
  
  warning: (message: string, description?: string) => {
    toast.warning(message, {
      description,
      className: "warning",
    })
  },
  
  info: (message: string, description?: string) => {
    toast.info(message, {
      description,
      className: "info",
    })
  },
  
  // Default toast without specific styling
  default: (message: string, description?: string) => {
    toast(message, {
      description,
    })
  },
}

// Convenience functions for common use cases
export const toastSuccess = (message: string, description?: string) => 
  showToast.success(message, description)

export const toastError = (message: string, description?: string) => 
  showToast.error(message, description)

export const toastWarning = (message: string, description?: string) => 
  showToast.warning(message, description)

export const toastInfo = (message: string, description?: string) => 
  showToast.info(message, description)