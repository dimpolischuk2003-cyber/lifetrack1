import { useState, useEffect, useCallback } from "react";

// ===================== CONSTANTS =====================

const HABIT_CATEGORIES = [
  { id: "sport", label: "Спорт", emoji: "💪", color: "#FF6B35" },
  { id: "health", label: "Здоров'я", emoji: "🧘", color: "#2EC4B6" },
  { id: "learn", label: "Навчання", emoji: "📚", color: "#E71D36" },
  { id: "mind", label: "Розум", emoji: "🧠", color: "#9B5DE5" },
  { id: "social", label: "Соціальне", emoji: "🤝", color: "#F15BB5" },
  { id: "creative", label: "Творчість", emoji: "🎨", color: "#FEE440" },
  { id: "finance", label: "Фінанси", emoji: "💰", color: "#00BBF9" },
  { id: "other", label: "Інше", emoji: "⭐", color: "#8AC926" },
];

const EXPENSE_CATEGORIES = [
  { id: "products", label: "Продукти", emoji: "🛒", color: "#8AC926" },
  { id: "cafe", label: "Кафе", emoji: "☕", color: "#FF6B35" },
  { id: "transport", label: "Транспорт", emoji: "🚌", color: "#00BBF9" },
  { id: "taxi", label: "Таксі", emoji: "🚕", color: "#FEE440" },
  { id: "gifts", label: "Подарунки", emoji: "🎁", color: "#F15BB5" },
  { id: "subscriptions", label: "Підписки/поповнення", emoji: "📱", color: "#9B5DE5" },
  { id: "hygiene", label: "Гігієна/господарство", emoji: "🧴", color: "#2EC4B6" },
  { id: "entertainment", label: "Розваги", emoji: "🎮", color: "#E84393" },
  { id: "shopping", label: "Покупки", emoji: "🛍️", color: "#6C5CE7" },
  { id: "education", label: "Навчання", emoji: "📚", color: "#E71D36" },
  { id: "housing", label: "Житло", emoji: "🏠", color: "#636E72" },
  { id: "debts", label: "Борги", emoji: "💳", color: "#D63031" },
  { id: "piggybank", label: "Скарбничка", emoji: "🐷", color: "#FDCB6E" },
  { id: "sport", label: "Спорт", emoji: "🏋️", color: "#00B894" },
  { id: "adventures", label: "Пригоди/розваги", emoji: "✈️", color: "#0984E3" },
  { id: "family", label: "Рідним", emoji: "👨‍👩‍👧", color: "#E17055" },
  { id: "donations", label: "Донати", emoji: "💙", color: "#0652DD" },
];

const MOTIVATIONAL = {
  sport: ["Твоє тіло стає сильнішим! 🔥", "Кожне тренування — інвестиція в себе!", "Один крок ближче до найкращої версії! 💪", "Сила приходить від подолання неможливого!"],
  health: ["Ти крокуєш впевнено! 🌿", "Турбуватися про себе — це мудрість!", "Маленькі кроки ведуть до великих змін!", "Ти обираєш себе щодня! 🧘"],
  learn: ["Знання — це сила! 📖", "Кожен день навчання — крок до мрії!", "Великі досягнення з маленьких уроків!", "Мозок стає сильнішим! 🧠"],
  mind: ["Спокійний розум — суперсила! 🌟", "Ментальне здоров'я — фундамент усього!", "Ти інвестуєш у свій внутрішній світ!", "Кожна хвилина для себе — акт любові! 💜"],
  social: ["Зв'язки роблять нас сильнішими! 🤗", "Ти будуєш мости! Це надихає!", "Кожна розмова — можливість зрости!", "Люди навколо — твоя суперсила! 🌍"],
  creative: ["Творчість — це сміливість! 🎨", "Кожна ідея — насіння чогось великого!", "Ти створюєш щось унікальне!", "Креативність — інтелект, що розважається! ✨"],
  finance: ["Фінансова дисципліна — свобода завтра! 💰", "Кожна копійка — крок до мрії!", "Ти будуєш фінансове майбутнє!", "Розумні рішення = щасливе завтра! 📈"],
  other: ["Ти робиш це! Кожен день рахується! ⭐", "Постійність — ключ до успіху!", "Маленькі кроки → великі результати!", "Пишайся собою — тримаєш ритм! 🎯"],
};

// ===================== HELPERS =====================

const todayStr = () => new Date().toISOString().slice(0, 10);
const monthStr = (d = new Date()) => d.toISOString().slice(0, 7);
const dayOfWeek = (s) => ["Нд","Пн","Вт","Ср","Чт","Пт","Сб"][new Date(s).getDay()];
const last7 = () => { const r=[]; for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);r.push(d.toISOString().slice(0,10))} return r; };
const fmt = (n) => n.toLocaleString("uk-UA");

function calcStreak(comp) {
  let s=0; const t=new Date();
  for(let i=0;i<365;i++){const d=new Date(t);d.setDate(d.getDate()-i);if(comp[d.toISOString().slice(0,10)])s++;else break;}
  return s;
}
function calcMaxStreak(comp) {
  const sorted=Object.keys(comp).filter(k=>comp[k]).sort();
  if(!sorted.length)return 0;
  let max=1,cur=1;
  for(let i=1;i<sorted.length;i++){if((new Date(sorted[i])-new Date(sorted[i-1]))/864e5===1){cur++;max=Math.max(max,cur)}else cur=1;}
  return max;
}
function getMotivation(cat, goal) {
  const msgs = MOTIVATIONAL[cat] || MOTIVATIONAL.other;
  const base = msgs[Math.floor(Math.random() * msgs.length)];
  return goal ? `${base}\n\n🎯 "${goal}" — ти на шляху!` : base;
}

const STORE_KEY = "lifetrack-v2";
function load() { try { const r = localStorage?.getItem(STORE_KEY); return r ? JSON.parse(r) : null; } catch { return null; } }
function save(d) { try { localStorage?.setItem(STORE_KEY, JSON.stringify(d)); } catch {} }

// ===================== SHARED UI =====================

const S = {
  bg: "#0f0f1a",
  bg2: "#1a1a2e",
  card: "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.06)",
  text: "#e0e0e8",
  muted: "#8a8a9a",
  accent: "#9B5DE5",
  accent2: "#F15BB5",
  green: "#2EC4B6",
  red: "#E71D36",
  orange: "#FF6B35",
};

const font1 = "'Unbounded', sans-serif";
const font2 = "'Nunito', sans-serif";

function Btn({ children, onClick, variant = "primary", style: sx, disabled }) {
  const bg = variant === "primary"
    ? "linear-gradient(135deg, #9B5DE5, #F15BB5)"
    : variant === "danger"
    ? "rgba(231,29,54,0.12)"
    : "rgba(255,255,255,0.06)";
  const color = variant === "primary" ? "#fff" : variant === "danger" ? S.red : S.text;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "13px 20px", borderRadius: 14, border: variant === "danger" ? `1px solid ${S.red}30` : "none",
      background: disabled ? "rgba(255,255,255,0.08)" : bg, color: disabled ? "#555" : color,
      fontFamily: font2, fontSize: 14, fontWeight: 800, cursor: disabled ? "default" : "pointer",
      width: "100%", transition: "all 0.2s", WebkitTapHighlightColor: "transparent", ...sx,
    }}>{children}</button>
  );
}

function Input({ value, onChange, placeholder, type = "text", style: sx }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type} style={{
      width: "100%", padding: "13px 16px", borderRadius: 14, border: `1.5px solid ${S.border}`,
      background: "rgba(255,255,255,0.05)", color: S.text, fontFamily: font2, fontSize: 15,
      outline: "none", boxSizing: "border-box", ...sx,
    }} />
  );
}

function TextArea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{
      width: "100%", padding: "13px 16px", borderRadius: 14, border: `1.5px solid ${S.border}`,
      background: "rgba(255,255,255,0.05)", color: S.text, fontFamily: font2, fontSize: 14,
      outline: "none", resize: "none", boxSizing: "border-box",
    }} />
  );
}

function Label({ children }) {
  return <div style={{ fontFamily: font2, fontSize: 13, fontWeight: 700, color: S.muted, marginBottom: 6 }}>{children}</div>;
}

function SectionTitle({ children }) {
  return <div style={{ fontFamily: font1, fontSize: 14, fontWeight: 700, color: S.text, marginBottom: 10 }}>{children}</div>;
}

// ===================== SIDEBAR =====================

function Sidebar({ open, onClose, current, onNavigate }) {
  const items = [
    { id: "habits", emoji: "🎯", label: "Звички" },
    { id: "finance", emoji: "💳", label: "Фінанси" },
  ];
  return (
    <>
      {open && <div onClick={onClose} style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200,
        animation: "fadeIn 0.2s ease",
      }} />}
      <div style={{
        position: "fixed", top: 0, left: open ? 0 : -280, width: 270, height: "100%",
        background: "linear-gradient(180deg, #161628, #0f0f1a)", zIndex: 210,
        transition: "left 0.3s cubic-bezier(0.4,0,0.2,1)", padding: "60px 20px 20px",
        borderRight: `1px solid ${S.border}`,
      }}>
        <div style={{ fontFamily: font1, fontSize: 20, fontWeight: 900, marginBottom: 40,
          background: "linear-gradient(135deg, #9B5DE5, #F15BB5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          LifeTrack
        </div>
        {items.map(it => (
          <button key={it.id} onClick={() => { onNavigate(it.id); onClose(); }} style={{
            display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "14px 16px",
            borderRadius: 14, border: "none", cursor: "pointer", marginBottom: 6,
            background: current === it.id ? "rgba(155,93,229,0.12)" : "transparent",
            transition: "all 0.2s",
          }}>
            <span style={{ fontSize: 22 }}>{it.emoji}</span>
            <span style={{ fontFamily: font2, fontSize: 16, fontWeight: 700,
              color: current === it.id ? S.accent : S.muted,
            }}>{it.label}</span>
          </button>
        ))}
        <div style={{ position: "absolute", bottom: 30, left: 20, right: 20 }}>
          <div style={{ fontFamily: font2, fontSize: 11, color: "#444", textAlign: "center" }}>
            LifeTrack v2.0
          </div>
        </div>
      </div>
    </>
  );
}

// ===================== HABIT COMPONENTS =====================

function WeekDots({ completions }) {
  const days = last7(), today = todayStr();
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
      {days.map(d => {
        const done = !!completions[d], isToday = d === today;
        return (
          <div key={d} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 10, color: S.muted, fontFamily: font2, marginBottom: 3 }}>{dayOfWeek(d)}</div>
            <div style={{
              width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700,
              background: done ? "linear-gradient(135deg, #2EC4B6, #8AC926)" : isToday ? "rgba(155,93,229,0.15)" : "rgba(255,255,255,0.05)",
              color: done ? "#fff" : isToday ? S.accent : "#555",
              border: isToday && !done ? `2px solid ${S.accent}` : "2px solid transparent",
            }}>{done ? "✓" : new Date(d).getDate()}</div>
          </div>
        );
      })}
    </div>
  );
}

function HabitCard({ habit, onToggle, onTap }) {
  const today = todayStr();
  const done = !!habit.completions[today];
  const streak = calcStreak(habit.completions);
  const cat = HABIT_CATEGORIES.find(c => c.id === habit.category) || HABIT_CATEGORIES[7];
  const [showMsg, setShowMsg] = useState(false);
  const [msg, setMsg] = useState("");

  const handleToggle = (e) => {
    e.stopPropagation(); e.preventDefault();
    if (!done) {
      setMsg(getMotivation(habit.category, habit.goal));
      setShowMsg(true);
      setTimeout(() => setShowMsg(false), 3500);
    }
    onToggle(habit.id);
  };

  return (
    <div style={{
      background: done ? `linear-gradient(135deg, ${cat.color}15, ${cat.color}08)` : S.card,
      borderRadius: 20, padding: 14, marginBottom: 12, position: "relative", overflow: "hidden",
      border: done ? `1.5px solid ${cat.color}40` : `1.5px solid ${S.border}`,
    }}>
      {showMsg && (
        <div onClick={() => setShowMsg(false)} style={{
          position: "absolute", inset: 0, background: `linear-gradient(135deg, ${cat.color}ee, ${cat.color}cc)`,
          borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center",
          padding: 20, zIndex: 10, animation: "fadeIn 0.3s", cursor: "pointer",
        }}>
          <p style={{ color: "#fff", fontFamily: font2, fontSize: 14, fontWeight: 700,
            textAlign: "center", lineHeight: 1.5, whiteSpace: "pre-line",
          }}>{msg}</p>
        </div>
      )}
      <div onClick={() => onTap(habit.id)} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", marginBottom: 10 }}>
        <div style={{ fontSize: 22, flexShrink: 0 }}>{cat.emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: font1, fontSize: 14, fontWeight: 600, color: done ? cat.color : S.text,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{habit.name}</div>
          <div style={{ fontFamily: font2, fontSize: 11, color: S.muted, display: "flex", gap: 8, marginTop: 1 }}>
            <span>{cat.label}</span>
            {streak > 0 && <span style={{ color: S.orange }}>🔥 {streak}</span>}
          </div>
        </div>
        <div style={{ color: "#555", fontSize: 18 }}>›</div>
      </div>
      <button onClick={handleToggle} style={{
        width: "100%", padding: "11px 0", borderRadius: 14,
        border: done ? "none" : `2px solid ${cat.color}50`,
        background: done ? `linear-gradient(135deg, ${cat.color}, ${cat.color}cc)` : "rgba(255,255,255,0.04)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer",
        boxShadow: done ? `0 4px 15px ${cat.color}40` : "none", WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation", transition: "all 0.3s",
      }}>
        <span style={{ fontSize: 18, color: done ? "#fff" : cat.color }}>{done ? "✓" : "○"}</span>
        <span style={{ fontFamily: font2, fontSize: 14, fontWeight: 800, color: done ? "#fff" : cat.color }}>
          {done ? "Виконано!" : "Відмітити"}
        </span>
      </button>
    </div>
  );
}

function HabitDetail({ habit, onBack, onDelete }) {
  const cat = HABIT_CATEGORIES.find(c => c.id === habit.category) || HABIT_CATEGORIES[7];
  const streak = calcStreak(habit.completions);
  const maxS = calcMaxStreak(habit.completions);
  const total = Object.values(habit.completions).filter(Boolean).length;
  return (
    <div style={{ animation: "slideIn 0.3s" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: S.accent, fontFamily: font2, fontSize: 15, fontWeight: 700, cursor: "pointer", padding: "8px 0", marginBottom: 8 }}>← Назад</button>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 48, marginBottom: 6 }}>{cat.emoji}</div>
        <h2 style={{ fontFamily: font1, fontSize: 20, fontWeight: 800, color: cat.color, margin: 0 }}>{habit.name}</h2>
        <div style={{ fontFamily: font2, fontSize: 12, color: S.muted, marginTop: 4 }}>{cat.label}</div>
      </div>
      {habit.goal && (
        <div style={{ background: `${cat.color}15`, borderRadius: 16, padding: 14, marginBottom: 12, border: `1px solid ${cat.color}25` }}>
          <div style={{ fontFamily: font2, fontSize: 11, color: S.muted, marginBottom: 2 }}>🎯 Моя ціль</div>
          <div style={{ fontFamily: font2, fontSize: 14, fontWeight: 700, color: S.text, lineHeight: 1.4 }}>{habit.goal}</div>
        </div>
      )}
      {habit.motivation && (
        <div style={{ background: S.card, borderRadius: 16, padding: 14, marginBottom: 12, border: `1px solid ${S.border}` }}>
          <div style={{ fontFamily: font2, fontSize: 11, color: S.muted, marginBottom: 2 }}>💡 Моя мотивація</div>
          <div style={{ fontFamily: font2, fontSize: 13, color: "#c0c0cc", lineHeight: 1.4 }}>{habit.motivation}</div>
        </div>
      )}
      {streak > 0 && (
        <div style={{ textAlign: "center", margin: "8px 0" }}>
          <div style={{ fontSize: Math.min(streak * 2 + 20, 56), lineHeight: 1, animation: "pulse 2s infinite" }}>🔥</div>
          <div style={{ fontFamily: font1, fontSize: 26, fontWeight: 800, background: "linear-gradient(135deg, #FF6B35, #E71D36)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {streak} {streak === 1 ? "день" : streak < 5 ? "дні" : "днів"}
          </div>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, margin: "14px 0" }}>
        {[{ l: "Streak", v: `${streak} 🔥` }, { l: "Макс.", v: `${maxS} ⚡` }, { l: "Всього", v: `${total} ✅` }].map(s => (
          <div key={s.l} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: "11px 6px", textAlign: "center" }}>
            <div style={{ fontFamily: font1, fontSize: 18, fontWeight: 800, color: S.text }}>{s.v}</div>
            <div style={{ fontFamily: font2, fontSize: 10, color: S.muted, marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>
      <SectionTitle>Останні 7 днів</SectionTitle>
      <WeekDots completions={habit.completions} />
      <div style={{ marginTop: 28 }}><Btn variant="danger" onClick={() => onDelete(habit.id)}>Видалити звичку</Btn></div>
    </div>
  );
}

function AddHabitForm({ onAdd, onCancel }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("sport");
  const [goal, setGoal] = useState("");
  const [motivation, setMotivation] = useState("");
  const [step, setStep] = useState(0);

  return (
    <div style={{ animation: "slideIn 0.3s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <button onClick={onCancel} style={{ background: "none", border: "none", color: S.muted, fontFamily: font2, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Скасувати</button>
        <div style={{ fontFamily: font1, fontSize: 16, fontWeight: 800, color: S.text }}>Нова звичка</div>
        <div style={{ width: 60 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 22 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width: i === step ? 24 : 8, height: 8, borderRadius: 4,
            background: i === step ? "linear-gradient(90deg, #9B5DE5, #F15BB5)" : i < step ? S.accent : "rgba(255,255,255,0.1)",
            transition: "all 0.3s",
          }} />
        ))}
      </div>
      {step === 0 && (
        <div>
          <Label>Назва звички</Label>
          <Input value={name} onChange={setName} placeholder="Наприклад: Біг 30 хвилин" />
          <div style={{ marginTop: 14 }}>
            <Label>Категорія</Label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4 }}>
              {HABIT_CATEGORIES.map(c => (
                <button key={c.id} onClick={() => setCategory(c.id)} style={{
                  padding: "10px 12px", borderRadius: 12, cursor: "pointer", textAlign: "left",
                  border: category === c.id ? `2px solid ${c.color}` : `2px solid ${S.border}`,
                  background: category === c.id ? `${c.color}18` : S.card,
                  color: category === c.id ? c.color : S.muted, fontFamily: font2, fontSize: 13, fontWeight: 700,
                }}>{c.emoji} {c.label}</button>
              ))}
            </div>
          </div>
        </div>
      )}
      {step === 1 && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40 }}>🎯</div>
          <div style={{ fontFamily: font1, fontSize: 16, fontWeight: 700, color: S.text, margin: "8px 0 4px" }}>Яка твоя ціль?</div>
          <div style={{ fontFamily: font2, fontSize: 12, color: S.muted, marginBottom: 14 }}>Що хочеш досягти цією звичкою?</div>
          <TextArea value={goal} onChange={setGoal} placeholder="Наприклад: Пробігти марафон до кінця року" />
        </div>
      )}
      {step === 2 && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40 }}>💡</div>
          <div style={{ fontFamily: font1, fontSize: 16, fontWeight: 700, color: S.text, margin: "8px 0 4px" }}>Чому це важливо?</div>
          <div style={{ fontFamily: font2, fontSize: 12, color: S.muted, marginBottom: 14 }}>Запиши мотивацію — допоможе в складні дні</div>
          <TextArea value={motivation} onChange={setMotivation} placeholder="Наприклад: Хочу бути здоровим для своєї сім'ї" />
        </div>
      )}
      <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
        {step > 0 && <Btn variant="ghost" onClick={() => setStep(step - 1)}>Назад</Btn>}
        <Btn disabled={step === 0 && !name.trim()} onClick={() => {
          if (step < 2) setStep(step + 1);
          else onAdd({ name: name.trim(), category, goal: goal.trim(), motivation: motivation.trim() });
        }}>{step < 2 ? "Далі →" : "Створити ✨"}</Btn>
      </div>
    </div>
  );
}

function HabitsStats({ habits }) {
  const today = todayStr(), total = habits.length;
  const doneToday = habits.filter(h => h.completions[today]).length;
  const pct = total > 0 ? Math.round(doneToday / total * 100) : 0;
  const best = habits.reduce((b, h) => { const s = calcStreak(h.completions); return s > b.s ? { n: h.name, s } : b; }, { n: "—", s: 0 });
  const days = last7();
  const rates = days.map(d => { const done = habits.filter(h => h.completions[d]).length; return total > 0 ? Math.round(done / total * 100) : 0; });

  return (
    <div style={{ animation: "slideIn 0.3s" }}>
      <h2 style={{ fontFamily: font1, fontSize: 20, fontWeight: 800, color: S.text, textAlign: "center", margin: "0 0 18px" }}>Статистика звичок</h2>
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <div style={{ position: "relative", width: 110, height: 110, margin: "0 auto" }}>
          <svg width="110" height="110" viewBox="0 0 110 110">
            <circle cx="55" cy="55" r="48" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="9" />
            <circle cx="55" cy="55" r="48" fill="none" stroke="url(#pg)" strokeWidth="9" strokeLinecap="round"
              strokeDasharray={`${pct / 100 * 301.6} 301.6`} transform="rotate(-90 55 55)" style={{ transition: "stroke-dasharray 1s" }} />
            <defs><linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#9B5DE5" /><stop offset="100%" stopColor="#2EC4B6" /></linearGradient></defs>
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontFamily: font1, fontSize: 26, fontWeight: 800, color: S.text }}>{pct}%</div>
            <div style={{ fontFamily: font2, fontSize: 10, color: S.muted }}>сьогодні</div>
          </div>
        </div>
        <div style={{ fontFamily: font2, fontSize: 13, color: S.muted, marginTop: 6 }}>{doneToday} з {total} виконано</div>
      </div>
      <div style={{ background: S.card, borderRadius: 18, padding: 16, marginBottom: 14 }}>
        <div style={{ fontFamily: font2, fontSize: 12, fontWeight: 700, color: S.muted, marginBottom: 10 }}>Виконання за тиждень</div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: 70, gap: 4 }}>
          {rates.map((r, i) => (
            <div key={i} style={{ textAlign: "center", flex: 1 }}>
              <div style={{ height: Math.max(4, r / 100 * 55), borderRadius: 6, marginBottom: 4,
                background: r >= 80 ? "linear-gradient(to top, #2EC4B6, #8AC926)" : r >= 50 ? "linear-gradient(to top, #FEE440, #FF6B35)" : r > 0 ? "linear-gradient(to top, #E71D36, #FF6B35)" : "rgba(255,255,255,0.08)",
                transition: "height 0.5s",
              }} />
              <div style={{ fontFamily: font2, fontSize: 9, color: days[i] === todayStr() ? S.accent : "#555", fontWeight: days[i] === todayStr() ? 800 : 400 }}>{dayOfWeek(days[i])}</div>
            </div>
          ))}
        </div>
      </div>
      {best.s > 0 && (
        <div style={{ background: "linear-gradient(135deg, rgba(255,107,53,0.12), rgba(231,29,54,0.08))", borderRadius: 18, padding: 16, border: "1px solid rgba(255,107,53,0.2)", textAlign: "center" }}>
          <div style={{ fontSize: 28 }}>🏆</div>
          <div style={{ fontFamily: font1, fontSize: 13, fontWeight: 700, color: S.orange, marginTop: 2 }}>Найкращий streak</div>
          <div style={{ fontFamily: font2, fontSize: 13, color: S.text, marginTop: 2 }}>{best.n} — {best.s} {best.s === 1 ? "день" : best.s < 5 ? "дні" : "днів"}</div>
        </div>
      )}
    </div>
  );
}

// ===================== FINANCE COMPONENTS =====================

function AddTransactionForm({ onAdd, onCancel }) {
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("products");
  const [date, setDate] = useState(todayStr());

  return (
    <div style={{ animation: "slideIn 0.3s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <button onClick={onCancel} style={{ background: "none", border: "none", color: S.muted, fontFamily: font2, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Скасувати</button>
        <div style={{ fontFamily: font1, fontSize: 16, fontWeight: 800, color: S.text }}>Новий запис</div>
        <div style={{ width: 60 }} />
      </div>

      {/* Type toggle */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 4 }}>
        {[{ id: "expense", label: "Витрата", emoji: "💸" }, { id: "income", label: "Дохід", emoji: "💰" }].map(t => (
          <button key={t.id} onClick={() => setType(t.id)} style={{
            flex: 1, padding: "11px 0", borderRadius: 12, border: "none", cursor: "pointer",
            background: type === t.id ? (t.id === "expense" ? "rgba(231,29,54,0.15)" : "rgba(46,196,182,0.15)") : "transparent",
            color: type === t.id ? (t.id === "expense" ? S.red : S.green) : S.muted,
            fontFamily: font2, fontSize: 14, fontWeight: 800, transition: "all 0.2s",
          }}>{t.emoji} {t.label}</button>
        ))}
      </div>

      {/* Date picker */}
      <Label>📅 Дата</Label>
      <input type="date" value={date} onChange={e => setDate(e.target.value)} max={todayStr()} style={{
        width: "100%", padding: "12px 16px", borderRadius: 14, border: `1.5px solid ${S.border}`,
        background: "rgba(255,255,255,0.05)", color: S.text, fontFamily: font2, fontSize: 15,
        outline: "none", boxSizing: "border-box", marginBottom: 14,
        colorScheme: "dark",
      }} />

      {/* Amount */}
      <Label>Сума (₴)</Label>
      <Input value={amount} onChange={setAmount} placeholder="0" type="number" style={{ fontSize: 24, fontWeight: 800, fontFamily: font1, textAlign: "center", marginBottom: 14 }} />

      {/* Description */}
      <Label>Опис</Label>
      <Input value={desc} onChange={setDesc} placeholder={type === "income" ? "Наприклад: Зарплата" : "Наприклад: Обід у кафе"} style={{ marginBottom: 14 }} />

      {/* Category (expenses only) */}
      {type === "expense" && (
        <>
          <Label>Категорія</Label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 14 }}>
            {EXPENSE_CATEGORIES.map(c => (
              <button key={c.id} onClick={() => setCategory(c.id)} style={{
                padding: "8px 4px", borderRadius: 12, cursor: "pointer", textAlign: "center",
                border: category === c.id ? `2px solid ${c.color}` : `2px solid ${S.border}`,
                background: category === c.id ? `${c.color}18` : S.card,
                color: category === c.id ? c.color : S.muted, fontFamily: font2, fontSize: 10, fontWeight: 700,
                lineHeight: 1.3,
              }}>
                <div style={{ fontSize: 18, marginBottom: 2 }}>{c.emoji}</div>
                {c.label}
              </button>
            ))}
          </div>
        </>
      )}

      <Btn disabled={!amount || parseFloat(amount) <= 0} onClick={() => {
        onAdd({
          id: Date.now().toString(), type, amount: parseFloat(amount),
          description: desc.trim(), category: type === "expense" ? category : "income",
          date: date,
        });
      }}>Додати {type === "expense" ? "витрату" : "дохід"} ✓</Btn>
    </div>
  );
}

function TransactionItem({ tx, onDelete }) {
  const isExp = tx.type === "expense";
  const cat = isExp ? (EXPENSE_CATEGORIES.find(c => c.id === tx.category) || EXPENSE_CATEGORIES[7]) : { emoji: "💰", label: "Дохід", color: S.green };
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14,
      background: S.card, border: `1px solid ${S.border}`, marginBottom: 8,
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
        background: `${cat.color}18`, fontSize: 20, flexShrink: 0,
      }}>{cat.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: font2, fontSize: 14, fontWeight: 700, color: S.text,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{tx.description || cat.label}</div>
        <div style={{ fontFamily: font2, fontSize: 11, color: S.muted }}>{cat.label} · {tx.date.slice(5).replace("-", "/")}</div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontFamily: font1, fontSize: 15, fontWeight: 700, color: isExp ? S.red : S.green }}>
          {isExp ? "−" : "+"}{fmt(tx.amount)} ₴
        </div>
      </div>
      <button onClick={() => onDelete(tx.id)} style={{
        background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#444",
        padding: 4, flexShrink: 0, WebkitTapHighlightColor: "transparent",
      }}>✕</button>
    </div>
  );
}

function FinanceDashboard({ transactions, onAdd, onDelete }) {
  const [subView, setSubView] = useState("overview");
  const [selectedMonth, setSelectedMonth] = useState(monthStr());
  // Date range filter
  const firstOfMonth = selectedMonth + "-01";
  const lastDay = new Date(parseInt(selectedMonth.slice(0,4)), parseInt(selectedMonth.slice(5,7)), 0).getDate();
  const lastOfMonth = selectedMonth + "-" + String(lastDay).padStart(2, "0");
  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(lastOfMonth);
  const [showFilter, setShowFilter] = useState(false);

  // Sync date range when month changes
  const prevMonth = () => {
    const d = new Date(selectedMonth + "-01");
    d.setMonth(d.getMonth() - 1);
    const m = monthStr(d);
    setSelectedMonth(m);
    const ld = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    setDateFrom(m + "-01");
    setDateTo(m + "-" + String(ld).padStart(2, "0"));
    setShowFilter(false);
  };
  const nextMonth = () => {
    const d = new Date(selectedMonth + "-01");
    d.setMonth(d.getMonth() + 1);
    if (d <= new Date()) {
      const m = monthStr(d);
      setSelectedMonth(m);
      const ld = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      setDateFrom(m + "-01");
      setDateTo(m + "-" + String(ld).padStart(2, "0"));
      setShowFilter(false);
    }
  };

  if (subView === "add") return <AddTransactionForm onAdd={(tx) => { onAdd(tx); setSubView("overview"); }} onCancel={() => setSubView("overview")} />;

  // Filter by date range
  const filtered = transactions.filter(t => t.date >= dateFrom && t.date <= dateTo);
  const totalIncome = filtered.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // By category
  const byCat = {};
  filtered.filter(t => t.type === "expense").forEach(t => {
    byCat[t.category] = (byCat[t.category] || 0) + t.amount;
  });
  const catEntries = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const maxCatVal = catEntries.length > 0 ? catEntries[0][1] : 1;

  // By day for chart (all days in range, max 31)
  const rangeDays = [];
  const dStart = new Date(dateFrom), dEnd = new Date(dateTo);
  for (let d = new Date(dStart); d <= dEnd; d.setDate(d.getDate() + 1)) {
    rangeDays.push(d.toISOString().slice(0, 10));
  }
  const showDailyChart = rangeDays.length <= 31;
  const dailyExpenses = rangeDays.map(d => transactions.filter(t => t.date === d && t.type === "expense").reduce((s, t) => s + t.amount, 0));
  const maxDaily = Math.max(...dailyExpenses, 1);

  const monthName = new Date(selectedMonth + "-01").toLocaleDateString("uk-UA", { month: "long", year: "numeric" });

  const fmtShort = (d) => { const p = d.split("-"); return `${p[2]}/${p[1]}`; };

  return (
    <div style={{ animation: "slideIn 0.3s" }}>
      {/* Month selector */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <button onClick={prevMonth} style={{ background: "none", border: "none", color: S.accent, fontSize: 22, cursor: "pointer", padding: 8 }}>‹</button>
        <div style={{ fontFamily: font1, fontSize: 15, fontWeight: 700, color: S.text, textTransform: "capitalize" }}>{monthName}</div>
        <button onClick={nextMonth} style={{ background: "none", border: "none", color: monthStr() === selectedMonth ? "#333" : S.accent, fontSize: 22, cursor: "pointer", padding: 8 }}>›</button>
      </div>

      {/* Date range filter toggle */}
      <button onClick={() => setShowFilter(!showFilter)} style={{
        width: "100%", padding: "10px 14px", borderRadius: 12, border: `1px solid ${S.border}`,
        background: showFilter ? "rgba(155,93,229,0.1)" : S.card, cursor: "pointer", marginBottom: 10,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        fontFamily: font2, fontSize: 13, fontWeight: 700, color: showFilter ? S.accent : S.muted,
      }}>
        📅 {fmtShort(dateFrom)} — {fmtShort(dateTo)} {showFilter ? "▲" : "▼"}
      </button>

      {showFilter && (
        <div style={{ background: S.card, borderRadius: 14, padding: 14, marginBottom: 14, border: `1px solid ${S.border}`, animation: "fadeIn 0.2s" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: font2, fontSize: 11, color: S.muted, marginBottom: 4 }}>Від</div>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{
                width: "100%", padding: "10px 10px", borderRadius: 10, border: `1px solid ${S.border}`,
                background: "rgba(255,255,255,0.06)", color: S.text, fontFamily: font2, fontSize: 13,
                outline: "none", boxSizing: "border-box", colorScheme: "dark",
              }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: font2, fontSize: 11, color: S.muted, marginBottom: 4 }}>До</div>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} max={todayStr()} style={{
                width: "100%", padding: "10px 10px", borderRadius: 10, border: `1px solid ${S.border}`,
                background: "rgba(255,255,255,0.06)", color: S.text, fontFamily: font2, fontSize: 13,
                outline: "none", boxSizing: "border-box", colorScheme: "dark",
              }} />
            </div>
          </div>
          {/* Quick presets */}
          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
            {[
              { label: "Сьогодні", fn: () => { setDateFrom(todayStr()); setDateTo(todayStr()); } },
              { label: "Тиждень", fn: () => { const d = new Date(); d.setDate(d.getDate() - 6); setDateFrom(d.toISOString().slice(0,10)); setDateTo(todayStr()); } },
              { label: "Цей місяць", fn: () => { setDateFrom(firstOfMonth); setDateTo(lastOfMonth); } },
            ].map(p => (
              <button key={p.label} onClick={p.fn} style={{
                padding: "6px 12px", borderRadius: 8, border: `1px solid ${S.border}`, background: S.card,
                color: S.muted, fontFamily: font2, fontSize: 11, fontWeight: 700, cursor: "pointer",
              }}>{p.label}</button>
            ))}
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        <div style={{ background: "rgba(46,196,182,0.08)", borderRadius: 16, padding: 14, border: "1px solid rgba(46,196,182,0.15)" }}>
          <div style={{ fontFamily: font2, fontSize: 11, color: S.muted, marginBottom: 2 }}>💰 Дохід</div>
          <div style={{ fontFamily: font1, fontSize: 17, fontWeight: 800, color: S.green }}>+{fmt(totalIncome)} ₴</div>
        </div>
        <div style={{ background: "rgba(231,29,54,0.08)", borderRadius: 16, padding: 14, border: "1px solid rgba(231,29,54,0.15)" }}>
          <div style={{ fontFamily: font2, fontSize: 11, color: S.muted, marginBottom: 2 }}>💸 Витрати</div>
          <div style={{ fontFamily: font1, fontSize: 17, fontWeight: 800, color: S.red }}>−{fmt(totalExpense)} ₴</div>
        </div>
      </div>
      <div style={{ background: balance >= 0 ? "rgba(46,196,182,0.06)" : "rgba(231,29,54,0.06)", borderRadius: 16, padding: 14, marginBottom: 18,
        border: `1px solid ${balance >= 0 ? "rgba(46,196,182,0.12)" : "rgba(231,29,54,0.12)"}`, textAlign: "center",
      }}>
        <div style={{ fontFamily: font2, fontSize: 11, color: S.muted }}>Баланс за період</div>
        <div style={{ fontFamily: font1, fontSize: 24, fontWeight: 900, color: balance >= 0 ? S.green : S.red }}>
          {balance >= 0 ? "+" : "−"}{fmt(Math.abs(balance))} ₴
        </div>
      </div>

      {/* By category */}
      {catEntries.length > 0 && (
        <div style={{ background: S.card, borderRadius: 18, padding: 16, marginBottom: 14, border: `1px solid ${S.border}` }}>
          <div style={{ fontFamily: font2, fontSize: 12, fontWeight: 700, color: S.muted, marginBottom: 12 }}>Витрати за категоріями</div>
          {catEntries.map(([catId, val]) => {
            const cat = EXPENSE_CATEGORIES.find(c => c.id === catId) || { emoji: "📦", label: catId, color: "#8AC926" };
            const pct = totalExpense > 0 ? Math.round(val / totalExpense * 100) : 0;
            return (
              <div key={catId} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontFamily: font2, fontSize: 13, fontWeight: 700, color: S.text }}>{cat.emoji} {cat.label}</span>
                  <span style={{ fontFamily: font1, fontSize: 11, fontWeight: 700, color: cat.color }}>{fmt(val)} ₴ ({pct}%)</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${val / maxCatVal * 100}%`, borderRadius: 3, background: cat.color, transition: "width 0.5s" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Daily chart */}
      {showDailyChart && rangeDays.length > 1 && (
        <div style={{ background: S.card, borderRadius: 18, padding: 16, marginBottom: 14, border: `1px solid ${S.border}` }}>
          <div style={{ fontFamily: font2, fontSize: 12, fontWeight: 700, color: S.muted, marginBottom: 10 }}>Витрати по днях</div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: 70, gap: 1, overflowX: "auto" }}>
            {dailyExpenses.map((val, i) => (
              <div key={i} style={{ textAlign: "center", flex: 1, minWidth: rangeDays.length > 14 ? 8 : 14 }}>
                <div style={{ height: Math.max(3, val / maxDaily * 50), borderRadius: 4, marginBottom: 2,
                  background: val > 0 ? "linear-gradient(to top, #E71D36, #FF6B35)" : "rgba(255,255,255,0.04)",
                  transition: "height 0.5s",
                }} />
                {rangeDays.length <= 14 && (
                  <div style={{ fontFamily: font2, fontSize: 8, color: rangeDays[i] === todayStr() ? S.accent : "#444",
                    fontWeight: rangeDays[i] === todayStr() ? 800 : 400,
                  }}>{rangeDays[i].slice(8)}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All transactions in range */}
      <SectionTitle>Записи ({filtered.length})</SectionTitle>
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px 0", color: S.muted, fontFamily: font2, fontSize: 13 }}>Записів за цей період немає</div>
      ) : (
        filtered.sort((a, b) => b.date.localeCompare(a.date) || parseInt(b.id) - parseInt(a.id)).map(tx => (
          <TransactionItem key={tx.id} tx={tx} onDelete={onDelete} />
        ))
      )}

      {/* Add button */}
      <div style={{ marginTop: 16, paddingBottom: 20 }}>
        <Btn onClick={() => setSubView("add")}>+ Додати запис</Btn>
      </div>
    </div>
  );
}

// ===================== MAIN APP =====================

export default function LifeTrack() {
  const [section, setSection] = useState("habits");
  const [habits, setHabits] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [habitView, setHabitView] = useState("home");
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const d = load();
    if (d) { setHabits(d.habits || []); setTransactions(d.transactions || []); }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) save({ habits, transactions });
  }, [habits, transactions, loaded]);

  const toggleHabit = useCallback(id => {
    setHabits(p => p.map(h => {
      if (h.id !== id) return h;
      const c = { ...h.completions }; c[todayStr()] = !c[todayStr()]; return { ...h, completions: c };
    }));
  }, []);

  const addHabit = useCallback(d => {
    setHabits(p => [...p, { id: Date.now().toString(), ...d, completions: {}, createdAt: todayStr() }]);
    setHabitView("home");
  }, []);

  const deleteHabit = useCallback(id => { setHabits(p => p.filter(h => h.id !== id)); setHabitView("home"); }, []);
  const addTransaction = useCallback(tx => setTransactions(p => [...p, tx]), []);
  const deleteTransaction = useCallback(id => setTransactions(p => p.filter(t => t.id !== id)), []);

  const today = todayStr();
  const doneToday = habits.filter(h => h.completions[today]).length;
  const allDone = habits.length > 0 && doneToday === habits.length;
  const greeting = (() => { const h = new Date().getHours(); if (h < 6) return "Доброї ночі"; if (h < 12) return "Доброго ранку"; if (h < 18) return "Доброго дня"; return "Доброго вечора"; })();

  return (
    <div style={{
      maxWidth: 420, margin: "0 auto", minHeight: "100vh",
      background: `linear-gradient(180deg, ${S.bg} 0%, ${S.bg2} 50%, ${S.bg} 100%)`,
      fontFamily: font2, position: "relative", overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@400;600;700;800;900&family=Nunito:wght@400;600;700;800&display=swap');
        @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: #555; }
        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      {/* Ambient glow */}
      <div style={{ position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)",
        width: 300, height: 300, background: "radial-gradient(circle, rgba(155,93,229,0.12) 0%, transparent 70%)", pointerEvents: "none",
      }} />

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} current={section}
        onNavigate={(s) => { setSection(s); setHabitView("home"); }} />

      <div style={{ position: "relative", padding: "16px 20px 40px" }}>
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <button onClick={() => setSidebarOpen(true)} style={{
            background: "none", border: "none", cursor: "pointer", padding: 6,
            display: "flex", flexDirection: "column", gap: 4, WebkitTapHighlightColor: "transparent",
          }}>
            <div style={{ width: 22, height: 2.5, background: S.muted, borderRadius: 2 }} />
            <div style={{ width: 16, height: 2.5, background: S.muted, borderRadius: 2 }} />
            <div style={{ width: 22, height: 2.5, background: S.muted, borderRadius: 2 }} />
          </button>
          <div style={{ fontFamily: font1, fontSize: 15, fontWeight: 800,
            background: "linear-gradient(135deg, #9B5DE5, #F15BB5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>LifeTrack</div>
          <div style={{ width: 34 }} />
        </div>

        {/* ============ HABITS SECTION ============ */}
        {section === "habits" && (
          <>
            {habitView === "home" && (
              <div style={{ animation: "fadeIn 0.3s" }}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: font2, fontSize: 14, color: S.muted }}>{greeting} 👋</div>
                  <h1 style={{ fontFamily: font1, fontSize: 22, fontWeight: 900, margin: "2px 0 0",
                    background: "linear-gradient(135deg, #e0e0e8, #9B5DE5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  }}>Мої звички</h1>
                </div>

                {habits.length > 0 && (
                  <div style={{
                    background: allDone ? "linear-gradient(135deg, rgba(46,196,182,0.15), rgba(138,201,38,0.1))" : S.card,
                    borderRadius: 18, padding: 14, marginBottom: 16, textAlign: "center",
                    border: allDone ? "1px solid rgba(46,196,182,0.3)" : `1px solid ${S.border}`,
                  }}>
                    {allDone ? (
                      <>
                        <div style={{ fontSize: 30 }}>🎉</div>
                        <div style={{ fontFamily: font1, fontSize: 15, fontWeight: 800, color: S.green, marginTop: 2 }}>Всі звички виконано!</div>
                        <div style={{ fontFamily: font2, fontSize: 12, color: S.muted, marginTop: 2 }}>Ти чемпіон! Так тримати 💪</div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontFamily: font1, fontSize: 15, fontWeight: 700, color: S.text }}>{doneToday} / {habits.length}</div>
                        <div style={{ fontFamily: font2, fontSize: 12, color: S.muted }}>виконано сьогодні</div>
                        <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)", marginTop: 8, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${doneToday / habits.length * 100}%`, borderRadius: 2,
                            background: "linear-gradient(90deg, #9B5DE5, #2EC4B6)", transition: "width 0.5s",
                          }} />
                        </div>
                      </>
                    )}
                  </div>
                )}

                {habits.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "50px 20px", color: S.muted }}>
                    <div style={{ fontSize: 48, marginBottom: 14 }}>🌱</div>
                    <div style={{ fontFamily: font1, fontSize: 17, fontWeight: 700, color: S.text, marginBottom: 6 }}>Почни свій шлях</div>
                    <div style={{ fontFamily: font2, fontSize: 14 }}>Додай першу звичку!</div>
                  </div>
                ) : (
                  habits.map(h => (
                    <HabitCard key={h.id} habit={h} onToggle={toggleHabit}
                      onTap={id => { setSelectedHabit(id); setHabitView("detail"); }} />
                  ))
                )}

                <div style={{ display: "flex", gap: 10, marginTop: 16, paddingBottom: 20 }}>
                  <Btn onClick={() => setHabitView("add")}>+ Нова звичка</Btn>
                  {habits.length > 0 && (
                    <Btn variant="ghost" onClick={() => setHabitView("stats")} style={{ width: "auto", minWidth: 50 }}>📊</Btn>
                  )}
                </div>
              </div>
            )}
            {habitView === "add" && <AddHabitForm onAdd={addHabit} onCancel={() => setHabitView("home")} />}
            {habitView === "detail" && selectedHabit && habits.find(h => h.id === selectedHabit) && (
              <HabitDetail habit={habits.find(h => h.id === selectedHabit)} onBack={() => setHabitView("home")} onDelete={deleteHabit} />
            )}
            {habitView === "stats" && (
              <div>
                <button onClick={() => setHabitView("home")} style={{ background: "none", border: "none", color: S.accent, fontFamily: font2, fontSize: 15, fontWeight: 700, cursor: "pointer", padding: "8px 0", marginBottom: 8 }}>← Назад</button>
                <HabitsStats habits={habits} />
              </div>
            )}
          </>
        )}

        {/* ============ FINANCE SECTION ============ */}
        {section === "finance" && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: font2, fontSize: 14, color: S.muted }}>{greeting} 👋</div>
              <h1 style={{ fontFamily: font1, fontSize: 22, fontWeight: 900, margin: "2px 0 0",
                background: "linear-gradient(135deg, #e0e0e8, #2EC4B6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>Мої фінанси</h1>
            </div>
            <FinanceDashboard transactions={transactions} onAdd={addTransaction} onDelete={deleteTransaction} />
          </div>
        )}
      </div>
    </div>
  );
}
