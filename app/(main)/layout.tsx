import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-white p-4">
      {/* 
        Container utamanya bg-white karena di desain, bagian luar sidebar/content ada frame putih membulat, 
        tapi agar persis seperti gambar yang merupakan app window, kita bisa buat frame rounded.
        Atau kita asumsikan window full screen, maka padding dihilangkan. 
        Mari kita gunakan padding kecil agar terlihat seperti di screenshot (floating frame) atau full screen.
        Desain referensi terlihat seperti UI yang mengisi window, tapi sudut luar canvas melengkung.
      */}
      <div className="flex w-full h-full rounded-[2.5rem] bg-[var(--color-sidebar)] overflow-hidden shadow-2xl ring-1 ring-slate-200">
        <Sidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-[var(--color-canvas)] rounded-l-[2rem] overflow-hidden ml-1">
          <Topbar />
          <main className="flex-1 overflow-y-auto px-8 pb-8 pt-4">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
