export type QuickAction =
  | 'draft_readme'
  | 'draft_ci'
  | 'draft_env'
  | 'analyze_roadmap'
  | 'general_chat'

export const QUICK_ACTIONS: Record<QuickAction, { label: string; prompt: string }> = {
  draft_readme: {
    label: 'Draf README Proyek',
    prompt:
      'Buatkan draf berkas README.md lengkap dan profesional untuk proyek ini. Sertakan judul, deskripsi proyek, prasyarat, cara instalasi langkah demi langkah, dan contoh cara menjalankannya.',
  },
  draft_ci: {
    label: 'Draf GitHub Actions CI',
    prompt:
      'Buatkan berkas workflow GitHub Actions (.github/workflows/test.yml) yang cocok untuk bahasa/framework proyek ini, yang menjalankan lint, test, atau build otomatis pada setiap git push.',
  },
  draft_env: {
    label: 'Draf .env.example',
    prompt:
      'Buatkan draf berkas .env.example yang aman dan rapi untuk proyek ini dengan placeholder nama-nama variabel konfigurasi yang umum dibutuhkan.',
  },
  analyze_roadmap: {
    label: 'Analisa lah projek ku untuk pengembangan selanjutnya',
    prompt:
      'Analisa secara menyeluruh repositori dan arsitektur proyek ini, lalu berikan rekomendasi konkret untuk pengembangan fitur selanjutnya, peningkatan kualitas teknis, dan saran portofolio agar proyek ini semakin unggul untuk karier ke depan.',
  },
  general_chat: {
    label: 'Tanya Bebas',
    prompt: '',
  },
}
