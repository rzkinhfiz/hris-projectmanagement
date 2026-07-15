import { BarChart3, Briefcase, Clock, Users, ArrowUpRight, ArrowDownRight } from "lucide-react";

export function OverviewCards() {
  const cards = [
    {
      id: "revenue",
      title: "Total revenue",
      value: "$53,00989", // From reference
      trend: "+12% increase from last month",
      isPositive: true,
      icon: <BarChart3 size={20} className="text-purple-500" />,
      iconBg: "bg-purple-100",
    },
    {
      id: "projects",
      title: "Projects",
      value: "95",
      suffix: "/100",
      trend: "-10% decrease from last month",
      isPositive: false,
      icon: <Briefcase size={20} className="text-orange-500" />,
      iconBg: "bg-orange-100",
    },
    {
      id: "time",
      title: "Time spent",
      value: "1022",
      suffix: "/1300 Hrs",
      trend: "+8% increase from last month",
      isPositive: true,
      icon: <Clock size={20} className="text-blue-500" />,
      iconBg: "bg-blue-100",
    },
    {
      id: "resources",
      title: "Resources",
      value: "101",
      suffix: "/120",
      trend: "+2% increase from last month",
      isPositive: true,
      icon: <Users size={20} className="text-amber-500" />,
      iconBg: "bg-amber-100",
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800">Overview</h2>
        <button className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50">
          Last 30 days
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      
      <div className="grid grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.id} className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${card.iconBg}`}>
              {card.icon}
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium mb-1">{card.title}</p>
              <div className="flex items-baseline gap-1 mb-3">
                <h3 className="text-2xl font-bold text-slate-800">{card.value}</h3>
                {card.suffix && <span className="text-sm font-semibold text-slate-500">{card.suffix}</span>}
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-semibold ${card.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                {card.isPositive ? <ArrowUpRight size={12} strokeWidth={3} /> : <ArrowDownRight size={12} strokeWidth={3} />}
                <span>{card.trend.replace(/^[+-][0-9]+%\s/, '')}</span>
                <span className="ml-[-4px]">{card.trend.split(' ')[0]}</span>
                {/* 
                  To match exact look: "↗ 12% increase from last month"
                */}
                <span className="hidden">fallback text for styling</span>
              </div>
              {/* Better layout for the trend text matching the image */}
              <div className={`mt-[-14px] flex items-center gap-1 text-[10px] font-semibold ${card.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                 {card.isPositive ? <ArrowUpRight size={12} strokeWidth={3} /> : <ArrowDownRight size={12} strokeWidth={3} />}
                 <span>{card.trend.split(' ')[0]}</span>
                 <span className="text-slate-400 font-medium">{card.trend.split(' ').slice(1).join(' ')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
