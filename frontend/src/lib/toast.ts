import Swal from 'sweetalert2';

export const toast = {
  success: (message: string, title?: string) => {
    Swal.fire({
      icon: 'success',
      title: title || 'Success',
      text: message,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  },

  error: (message: string, title?: string) => {
    Swal.fire({
      icon: 'error',
      title: title || 'Error',
      text: message,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 4000,
      timerProgressBar: true,
    });
  },

  info: (message: string, title?: string) => {
    Swal.fire({
      icon: 'info',
      title: title || 'Info',
      text: message,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  },

  warning: (message: string, title?: string) => {
    Swal.fire({
      icon: 'warning',
      title: title || 'Warning',
      text: message,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  },

  loading: (message: string, title?: string) => {
    Swal.fire({
      title: title || 'Processing',
      text: message,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
  },

  close: () => {
    Swal.close();
  }
};
