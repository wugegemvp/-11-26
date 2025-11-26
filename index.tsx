import React, { useState, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { Shield, Sparkles, Swords, Zap, ShieldAlert, RefreshCw } from "lucide-react";

// --- Data Definitions ---

type Tier = "T0" | "T1" | "T2" | "T3" | "T4";

interface CharacterData {
  role: string;
  roleIcon: React.ReactNode;
  tiers: Record<Tier, string[]>;
}

const TIER_LABELS: Record<Tier, string> = {
  T0: "传说",
  T1: "顶级",
  T2: "精英",
  T3: "卓越",
  T4: "过渡",
};

const TIER_COLORS: Record<Tier, string> = {
  T0: "text-amber-400 border-amber-500/30 bg-amber-500/5",
  T1: "text-rose-400 border-rose-500/30 bg-rose-500/5",
  T2: "text-purple-400 border-purple-500/30 bg-purple-500/5",
  T3: "text-sky-400 border-sky-500/30 bg-sky-500/5",
  T4: "text-slate-400 border-slate-500/30 bg-slate-500/5",
};

const DATA: CharacterData[] = [
  {
    role: "主将",
    roleIcon: <Shield className="w-3 h-3 text-red-400" />,
    tiers: {
      T0: ["关羽", "周瑜", "司马懿"],
      T1: ["陆逊", "张辽", "曹仁"],
      T2: ["邓艾", "孙策", "姜维"],
      T3: ["夏侯渊", "徐晃", "黄忠"],
      T4: ["袁绍", "公孙瓒", "马腾"],
    },
  },
  {
    role: "军师",
    roleIcon: <Sparkles className="w-3 h-3 text-purple-400" />,
    tiers: {
      T0: ["诸葛亮", "郭嘉", "荀彧"],
      T1: ["贾诩", "庞统", "法正"],
      T2: ["鲁肃", "荀攸", "程昱"],
      T3: ["徐庶", "田丰", "沮授"],
      T4: ["李儒", "陈宫", "蒋干"],
    },
  },
  {
    role: "副将",
    roleIcon: <Swords className="w-3 h-3 text-blue-400" />,
    tiers: {
      T0: ["赵云", "吕蒙", "张郃"],
      T1: ["夏侯惇", "魏延", "高顺"],
      T2: ["关平", "李典", "徐盛"],
      T3: ["黄盖", "于禁", "程普"],
      T4: ["潘璋", "马忠(吴)", "糜芳"],
    },
  },
  {
    role: "先锋",
    roleIcon: <Zap className="w-3 h-3 text-yellow-400" />,
    tiers: {
      T0: ["吕布", "张飞", "马超"],
      T1: ["颜良", "文丑", "庞德"],
      T2: ["甘宁", "太史慈", "徐晃"],
      T3: ["华雄", "凌统", "曹彰"],
      T4: ["潘凤", "邢道荣", "武安国"],
    },
  },
  {
    role: "亲卫",
    roleIcon: <ShieldAlert className="w-3 h-3 text-emerald-400" />,
    tiers: {
      T0: ["典韦", "许褚", "周泰"],
      T1: ["周仓", "陈到", "曹洪"],
      T2: ["王平", "严颜", "廖化"],
      T3: ["关兴", "张苞", "曹纯"],
      T4: ["宋谦", "傅士仁", "祖茂"],
    },
  },
];

// --- Logic Helpers ---

interface SelectionItem {
  id: string;   // Unique key: Role-Tier-Name
  role: string;
  tier: Tier;
  name: string;
}

const getUniqueId = (role: string, tier: string, name: string) => `${role}-${tier}-${name}`;

// --- Components ---

const App = () => {
  const [selections, setSelections] = useState<SelectionItem[]>([]);

  // Calculate simple derived sets for Header/Sidebar indicators only
  const { usedTiers, isFull } = useMemo(() => {
    const usedTiers = new Set<Tier>();
    selections.forEach((item) => usedTiers.add(item.tier));
    return {
      usedTiers,
      isFull: selections.length >= 5,
    };
  }, [selections]);

  const toggleSelection = (role: string, tier: Tier, name: string) => {
    const id = getUniqueId(role, tier, name);
    const isSelected = selections.some(s => s.id === id);

    if (isSelected) {
      // Deselect self
      setSelections(prev => prev.filter(s => s.id !== id));
      return;
    }

    // Logic for New Selection
    // 1. Check if Tier is blocked by a DIFFERENT Role (Hard Constraint)
    const tierBlocker = selections.find(s => s.tier === tier && s.role !== role);
    if (tierBlocker) return; // Column locked by another row

    // 2. Check Name duplicate (Hard Constraint)
    const nameBlocker = selections.find(s => s.name === name && s.role !== role);
    if (nameBlocker) return;

    // 3. Check Full Team Constraint
    // We can only select if we are NOT adding a 6th role. 
    // If the role is already taken, we are swapping (count stays 5).
    // If role is free, we are adding (count becomes +1).
    const roleOccupier = selections.find(s => s.role === role);
    if (selections.length >= 5 && !roleOccupier) return; 

    // Apply: Remove any existing char in this role (Swap logic), then add new one
    setSelections(prev => {
      const filtered = prev.filter(s => s.role !== role);
      return [...filtered, { id, role, tier, name }];
    });
  };

  const getStatus = (role: string, tier: Tier, name: string) => {
    const id = getUniqueId(role, tier, name);
    const isSelected = selections.some(s => s.id === id);
    if (isSelected) return "SELECTED";

    // 1. Tier Blocked? (By a different row)
    const tierBlocker = selections.find(s => s.tier === tier && s.role !== role);
    if (tierBlocker) return "DIMMED";

    // 2. Name Blocked?
    const nameBlocker = selections.find(s => s.name === name && s.role !== role);
    if (nameBlocker) return "DIMMED";

    // 3. Full Team Blocked?
    // If team is full (5), and this Row is EMPTY, we can't select (would be 6th).
    // If this Row has a selection, we CAN select (it would be a swap).
    const roleOccupier = selections.find(s => s.role === role);
    if (selections.length >= 5 && !roleOccupier) return "DIMMED";

    return "AVAILABLE";
  };

  const clearSelection = () => setSelections([]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-amber-500/30 pb-10">
      
      {/* Compact Header */}
      <div className="px-3 py-2 border-b border-slate-800 bg-slate-900/95 sticky top-0 z-50 flex justify-between items-center shadow-lg">
        <div className="flex flex-col">
          <h1 className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-yellow-500 leading-tight">
            三国志 · 战略名将录
          </h1>
          <p className="text-[10px] text-slate-400">
             1角色/行 · 1角色/列 · 同名不可复选
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
             <span className={`text-xs font-bold font-mono ${selections.length === 5 ? 'text-green-400' : 'text-amber-500'}`}>
              已选: {selections.length}/5
            </span>
          </div>
          <button 
            onClick={clearSelection}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> 重置
          </button>
        </div>
      </div>

      {/* Main Grid Plane */}
      <div className="p-1 overflow-x-auto">
        <div className="min-w-[500px] border border-slate-800 bg-slate-900 shadow-2xl rounded-sm">
          
          {/* Header Row */}
          <div className="grid grid-cols-[50px_repeat(5,1fr)] bg-slate-900 text-slate-400 text-[10px] border-b border-slate-800">
            <div className="p-1 flex items-center justify-center font-bold bg-slate-800/50">职位</div>
            {(Object.keys(TIER_LABELS) as Tier[]).map((tier) => (
              <div key={tier} className="py-1.5 flex flex-col items-center justify-center border-l border-slate-800/50 relative">
                 {/* Visual indicator if this col is fully taken by a DIFFERENT row. 
                     We only show the header shade if the tier is effectively used up. */}
                 {usedTiers.has(tier) && <div className="absolute inset-0 bg-slate-950/60 pointer-events-none" />}
                <span className={`font-bold text-[11px] ${getTierColor(tier)}`}>{tier}</span>
                <span className="scale-75 opacity-60 uppercase tracking-tighter">{TIER_LABELS[tier]}</span>
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-800">
            {DATA.map((row) => {
              // Row state logic
              const selectionInRow = selections.find(s => s.role === row.role);
              const isRowSelectedHere = !!selectionInRow;

              return (
                <div key={row.role} className={`grid grid-cols-[50px_repeat(5,1fr)] transition-colors duration-300`}>
                  
                  {/* Role Label */}
                  <div className={`
                    p-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold border-r border-slate-800/50 relative
                    ${isRowSelectedHere ? 'text-amber-400 bg-amber-900/10' : 'text-slate-400 bg-slate-900/30'}
                  `}>
                    <div className={`p-1 rounded ${isRowSelectedHere ? 'bg-amber-500/10 ring-1 ring-amber-500/30' : 'bg-slate-800'}`}>
                      {row.roleIcon}
                    </div>
                    <span className="writing-vertical-lr scale-90">{row.role}</span>
                  </div>

                  {/* Tier Cells */}
                  {(Object.keys(TIER_LABELS) as Tier[]).map((tier) => (
                    <div key={tier} className="p-1 border-l border-slate-800/30 flex flex-col gap-1 relative">
                      {row.tiers[tier].map((name) => {
                        const status = getStatus(row.role, tier, name);
                        const isSelected = status === "SELECTED";
                        const isDimmed = status === "DIMMED";

                        return (
                          <button
                            key={name}
                            onClick={() => toggleSelection(row.role, tier, name)}
                            disabled={isDimmed}
                            className={`
                              relative w-full py-1.5 px-0.5 rounded text-[10px] font-medium transition-all duration-200 border
                              flex items-center justify-center tracking-tight leading-none
                              ${isSelected 
                                ? "bg-amber-600 border-amber-400 text-white shadow-[0_0_10px_rgba(245,158,11,0.4)] z-10 scale-[1.02]" 
                                : isDimmed
                                  ? "opacity-20 grayscale border-transparent text-slate-500 cursor-not-allowed bg-transparent"
                                  : `${TIER_COLORS[tier]} hover:brightness-125 hover:border-opacity-50 active:scale-95`
                              }
                            `}
                          >
                            {name}
                            {isSelected && (
                              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full shadow-sm animate-pulse z-20" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer / Legend */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 border-t border-slate-800 py-2 px-4 flex justify-between items-center text-[10px] text-slate-400 backdrop-blur z-50">
         <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-amber-600 rounded shadow-[0_0_5px_rgba(245,158,11,0.5)]"></div>
              <span>已选</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-slate-800 border border-slate-600 rounded"></div>
              <span>可选/替换</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-slate-800/30 opacity-40 rounded"></div>
              <span>不可选</span>
            </div>
         </div>
      </div>

    </div>
  );
};

function getTierColor(tier: Tier): string {
  switch (tier) {
    case "T0": return "text-amber-400 border-amber-500/30 bg-amber-500/5";
    case "T1": return "text-rose-400 border-rose-500/30 bg-rose-500/5";
    case "T2": return "text-purple-400 border-purple-500/30 bg-purple-500/5";
    case "T3": return "text-sky-400 border-sky-500/30 bg-sky-500/5";
    case "T4": return "text-slate-400 border-slate-500/30 bg-slate-500/5";
    default: return "text-slate-400 border-slate-500/30";
  }
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);