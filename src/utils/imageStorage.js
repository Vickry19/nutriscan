export function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
  
      reader.onload = () => {
        resolve(reader.result);
      };
  
      reader.onerror = () => {
        reject(
          new Error("Gagal menyimpan gambar.")
        );
      };
  
      reader.readAsDataURL(file);
    });
  }