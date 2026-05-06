export default function StepSection() {
  const steps = [
    "Pilih Paket",
    "Isi Form Pendaftaran",
    "Tim Kami Survei",
    "Instalasi",
    "Internet Aktif"
  ];

  return (
    <section id="cara-daftar" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-space-grotesk font-bold text-[#1A1A1A] mb-4">
          Cara Berlangganan
        </h2>
        <p className="text-gray-500 max-w-2xl mx-auto text-lg mb-16">
          Proses mudah dan cepat untuk menikmati koneksi internet tanpa batas dari CAKRANA.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-start relative">
          {/* Garis penghubung (hanya terlihat di desktop) */}
          <div className="hidden md:block absolute top-8 left-[10%] right-[10%] h-[2px] bg-gray-100 -z-10"></div>

          {steps.map((step, idx) => (
            <div key={idx} className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F5A623] to-[#d98f1b] text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-[#F5A623]/30">
                {idx + 1}
              </div>
              <h3 className="font-bold text-[#1A1A1A]">{step}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}