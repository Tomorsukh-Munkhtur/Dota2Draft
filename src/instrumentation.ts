export async function register() {
  // Тоглоомын өгөгдлийн автомат шинэчлэлт (зөвхөн Node.js сервер дээр).
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startAutoUpdate } = await import("./lib/autoUpdate");
    startAutoUpdate();
  }
}
