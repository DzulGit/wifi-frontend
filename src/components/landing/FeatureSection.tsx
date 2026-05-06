import { Zap, Globe, HeadphonesIcon, Wallet } from "lucide-react";

export default function FeatureSection() {
  const features = [
    { icon: Zap, title: "Kecepatan Stabil", desc: "Rasio upload dan download 1:1 tanpa throttling." },
    { icon: Globe, title: "Jaringan Luas", desc: "Coverage area yang luas, terus berekspansi." },
    { icon: HeadphonesIcon, title: "Bantuan 24/7", desc: "Tim teknis kami siap sedia membantu Anda." },
    { icon: Wallet, title: "Harga Terjangkau", desc: "Biaya flat setiap bulan tanpa biaya tersembunyi." }
  ];

  return (
    <section id="fitur" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-space-grotesk font-bold text-[#1A1A1A] mb-4">
            Kenapa Pilih CAKRANA?
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            Kami menawarkan infrastruktur jaringan fiber optik terbaik untuk memastikan koneksi Anda stabil dan tanpa gangguan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((fitur, idx) => (
            <div key={idx} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-[#F5A623]/10 rounded-xl flex items-center justify-center mb-6 text-[#F5A623]">
                <fitur.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-3">{fitur.title}</h3>
              <p className="text-gray-500 leading-relaxed">{fitur.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}