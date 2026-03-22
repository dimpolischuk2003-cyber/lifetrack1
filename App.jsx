import { useState, useEffect, useCallback } from "react";

// ===================== CONSTANTS =====================
const HABIT_CATEGORIES = [
  { id: "sport", label: "Спорт", emoji: "💪" },
  { id: "health", label: "Здоров'я", emoji: "🧘" },
  { id: "learn", label: "Навчання", emoji: "📚" },
  { id: "mind", label: "Розум", emoji: "🧠" },
  { id: "social", label: "Соціальне", emoji: "🤝" },
  { id: "creative", label: "Творчість", emoji: "🎨" },
  { id: "finance", label: "Фінанси", emoji: "💰" },
  { id: "other", label: "Інше", emoji: "⭐" },
];
const EXPENSE_CATEGORIES = [
  { id: "products", label: "Продукти", emoji: "🛒" },
  { id: "cafe", label: "Кафе", emoji: "☕" },
  { id: "transport", label: "Транспорт", emoji: "🚌" },
  { id: "taxi", label: "Таксі", emoji: "🚕" },
  { id: "gifts", label: "Подарунки", emoji: "🎁" },
  { id: "subscriptions", label: "Підписки", emoji: "📱" },
  { id: "hygiene", label: "Гігієна/господ.", emoji: "🧴" },
  { id: "entertainment", label: "Розваги", emoji: "🎮" },
  { id: "shopping", label: "Покупки", emoji: "🛍️" },
  { id: "education", label: "Навчання", emoji: "📚" },
  { id: "housing", label: "Житло", emoji: "🏠" },
  { id: "debts", label: "Борги", emoji: "💳" },
  { id: "piggybank", label: "Скарбничка", emoji: "🐷" },
  { id: "sport_fin", label: "Спорт", emoji: "🏋️" },
  { id: "adventures", label: "Пригоди", emoji: "✈️" },
  { id: "family", label: "Рідним", emoji: "👨‍👩‍👧" },
  { id: "donations", label: "Донати", emoji: "💙" },
];
const MOTIVATIONAL = {
  sport: ["Твоє тіло стає сильнішим!", "Кожне тренування — інвестиція в себе!", "Один крок ближче до найкращої версії!", "Сила приходить від подолання неможливого!"],
  health: ["Ти крокуєш впевнено!", "Турбуватися про себе — це мудрість!", "Маленькі кроки ведуть до великих змін!", "Ти обираєш себе щодня!"],
  learn: ["Знання — це сила!", "Кожен день навчання — крок до мрії!", "Великі досягнення з маленьких уроків!", "Мозок стає сильнішим!"],
  mind: ["Спокійний розум — суперсила!", "Ментальне здоров'я — фундамент усього!", "Ти інвестуєш у свій внутрішній світ!", "Кожна хвилина для себе — акт любові!"],
  social: ["Зв'язки роблять нас сильнішими!", "Ти будуєш мости! Це надихає!", "Кожна розмова — можливість зрости!", "Люди навколо — твоя суперсила!"],
  creative: ["Творчість — це сміливість!", "Кожна ідея — насіння чогось великого!", "Ти створюєш щось унікальне!", "Креативність — інтелект, що розважається!"],
  finance: ["Фінансова дисципліна — свобода завтра!", "Кожна копійка — крок до мрії!", "Ти будуєш фінансове майбутнє!", "Розумні рішення = щасливе завтра!"],
  other: ["Ти робиш це! Кожен день рахується!", "Постійність — ключ до успіху!", "Маленькі кроки → великі результати!", "Пишайся собою — тримаєш ритм!"],
};

// ===================== DESIGN TOKENS =====================
const T = {
  bg: "#FAFBFC", card: "#FFFFFF", border: "#E8ECF0", borderLight: "#F0F3F6",
  text: "#1A1D21", textSec: "#6B7280", textMuted: "#9CA3AF",
  accent: "#4F46E5", accentLight: "#EEF2FF", accentHover: "#4338CA",
  green: "#059669", greenBg: "#ECFDF5", red: "#DC2626", redBg: "#FEF2F2",
  shadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
  shadowMd: "0 4px 12px rgba(0,0,0,0.08)",
};
const F1 = "'Inter', 'SF Pro Display', -apple-system, sans-serif";
const F2 = "'Inter', 'SF Pro Text', -apple-system, sans-serif";

// ===================== HELPERS =====================
const todayStr = () => new Date().toISOString().slice(0, 10);
const monthStr = (d = new Date()) => d.toISOString().slice(0, 7);
const dayOfWeek = (s) => ["Нд","Пн","Вт","Ср","Чт","Пт","Сб"][new Date(s).getDay()];
const last7 = () => { const r=[]; for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);r.push(d.toISOString().slice(0,10))} return r; };
const fmt = (n) => n.toLocaleString("uk-UA");
function calcStreak(c){let s=0;const t=new Date();for(let i=0;i<365;i++){const d=new Date(t);d.setDate(d.getDate()-i);if(c[d.toISOString().slice(0,10)])s++;else break;}return s;}
function calcMaxStreak(c){const sorted=Object.keys(c).filter(k=>c[k]).sort();if(!sorted.length)return 0;let max=1,cur=1;for(let i=1;i<sorted.length;i++){if((new Date(sorted[i])-new Date(sorted[i-1]))/864e5===1){cur++;max=Math.max(max,cur)}else cur=1;}return max;}
function getMotivation(cat,goal){const msgs=MOTIVATIONAL[cat]||MOTIVATIONAL.other;const base=msgs[Math.floor(Math.random()*msgs.length)];return goal?`${base}\n🎯 "${goal}"`:`${base}`;}
const STORE="lifetrack-v3";
function load(){try{const r=localStorage?.getItem(STORE);return r?JSON.parse(r):null}catch{return null}}
function save(d){try{localStorage?.setItem(STORE,JSON.stringify(d))}catch{}}

// ===================== SHARED UI =====================
function Btn({children,onClick,variant="primary",style:sx,disabled,small}){
  const styles={
    primary:{background:T.accent,color:"#fff",border:"none"},
    secondary:{background:T.bg,color:T.text,border:`1.5px solid ${T.border}`},
    danger:{background:T.redBg,color:T.red,border:`1px solid #FECACA`},
    ghost:{background:"transparent",color:T.textSec,border:`1.5px solid ${T.border}`},
  };
  const s=styles[variant]||styles.primary;
  return(<button onClick={onClick} disabled={disabled} style={{padding:small?"8px 14px":"13px 20px",borderRadius:12,...s,fontFamily:F2,fontSize:small?13:14,fontWeight:600,cursor:disabled?"default":"pointer",width:small?"auto":"100%",opacity:disabled?0.4:1,transition:"all 0.15s",WebkitTapHighlightColor:"transparent",...sx}}>{children}</button>);
}
function Input({value,onChange,placeholder,type="text",style:sx}){
  return(<input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} type={type} style={{width:"100%",padding:"12px 14px",borderRadius:12,border:`1.5px solid ${T.border}`,background:"#fff",color:T.text,fontFamily:F2,fontSize:15,outline:"none",boxSizing:"border-box",transition:"border 0.15s",...sx}} onFocus={e=>e.target.style.borderColor=T.accent} onBlur={e=>e.target.style.borderColor=T.border}/>);
}
function TextArea({value,onChange,placeholder,rows=3}){
  return(<textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{width:"100%",padding:"12px 14px",borderRadius:12,border:`1.5px solid ${T.border}`,background:"#fff",color:T.text,fontFamily:F2,fontSize:14,outline:"none",resize:"none",boxSizing:"border-box"}}/>);
}
function Label({children}){return <div style={{fontFamily:F2,fontSize:13,fontWeight:600,color:T.textSec,marginBottom:6}}>{children}</div>}
function SectionTitle({children}){return <div style={{fontFamily:F1,fontSize:15,fontWeight:700,color:T.text,marginBottom:10,marginTop:16}}>{children}</div>}
function Card({children,style:sx}){return <div style={{background:T.card,borderRadius:16,padding:16,border:`1px solid ${T.border}`,boxShadow:T.shadow,...sx}}>{children}</div>}

// ===================== HABIT COMPONENTS =====================
function WeekDots({completions}){
  const days=last7(),today=todayStr();
  return(<div style={{display:"flex",gap:6,justifyContent:"center"}}>{days.map(d=>{
    const done=!!completions[d],isToday=d===today;
    return(<div key={d} style={{textAlign:"center"}}><div style={{fontSize:10,color:T.textMuted,fontFamily:F2,marginBottom:3}}>{dayOfWeek(d)}</div>
      <div style={{width:30,height:30,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:600,
        background:done?T.accent:isToday?T.accentLight:"#F3F4F6",color:done?"#fff":isToday?T.accent:T.textMuted,
        border:isToday&&!done?`2px solid ${T.accent}`:"2px solid transparent"}}>{done?"✓":new Date(d).getDate()}</div></div>);
  })}</div>);
}

function HabitCard({habit,onToggle,onTap}){
  const today=todayStr(),done=!!habit.completions[today],streak=calcStreak(habit.completions);
  const cat=HABIT_CATEGORIES.find(c=>c.id===habit.category)||HABIT_CATEGORIES[7];
  const [showMsg,setShowMsg]=useState(false);const [msg,setMsg]=useState("");
  const handleToggle=(e)=>{e.stopPropagation();e.preventDefault();if(!done){setMsg(getMotivation(habit.category,habit.goal));setShowMsg(true);setTimeout(()=>setShowMsg(false),3e3)}onToggle(habit.id)};
  return(
    <Card style={{marginBottom:10,position:"relative",overflow:"hidden",border:done?`1.5px solid ${T.accent}20`:`1px solid ${T.border}`}}>
      {showMsg&&<div onClick={()=>setShowMsg(false)} style={{position:"absolute",inset:0,background:T.accent,borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",padding:20,zIndex:10,animation:"fadeIn 0.3s",cursor:"pointer"}}>
        <p style={{color:"#fff",fontFamily:F2,fontSize:14,fontWeight:600,textAlign:"center",lineHeight:1.5,whiteSpace:"pre-line"}}>{msg}</p></div>}
      <div onClick={()=>onTap(habit.id)} style={{display:"flex",alignItems:"center",gap:12,cursor:"pointer",marginBottom:10}}>
        <div style={{fontSize:22,flexShrink:0}}>{cat.emoji}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:F1,fontSize:15,fontWeight:600,color:done?T.accent:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{habit.name}</div>
          <div style={{fontFamily:F2,fontSize:12,color:T.textMuted,display:"flex",gap:8,marginTop:1}}>
            <span>{cat.label}</span>{streak>0&&<span style={{color:T.accent}}>🔥 {streak}</span>}</div></div>
        <div style={{color:T.textMuted,fontSize:16}}>›</div></div>
      <button onClick={handleToggle} style={{width:"100%",padding:"10px 0",borderRadius:10,
        border:done?"none":`1.5px solid ${T.accent}40`,
        background:done?T.accent:T.accentLight,
        display:"flex",alignItems:"center",justifyContent:"center",gap:8,cursor:"pointer",
        WebkitTapHighlightColor:"transparent",touchAction:"manipulation",transition:"all 0.2s"}}>
        <span style={{fontSize:16,color:done?"#fff":T.accent}}>{done?"✓":"○"}</span>
        <span style={{fontFamily:F2,fontSize:13,fontWeight:700,color:done?"#fff":T.accent}}>{done?"Виконано":"Відмітити"}</span>
      </button>
    </Card>);
}

function HabitDetail({habit,onBack,onDelete}){
  const cat=HABIT_CATEGORIES.find(c=>c.id===habit.category)||HABIT_CATEGORIES[7];
  const streak=calcStreak(habit.completions),maxS=calcMaxStreak(habit.completions),total=Object.values(habit.completions).filter(Boolean).length;
  return(<div style={{animation:"slideIn 0.3s"}}>
    <button onClick={onBack} style={{background:"none",border:"none",color:T.accent,fontFamily:F2,fontSize:14,fontWeight:600,cursor:"pointer",padding:"8px 0",marginBottom:8}}>← Назад</button>
    <div style={{textAlign:"center",marginBottom:20}}><div style={{fontSize:48,marginBottom:6}}>{cat.emoji}</div>
      <h2 style={{fontFamily:F1,fontSize:20,fontWeight:700,color:T.text,margin:0}}>{habit.name}</h2>
      <div style={{fontFamily:F2,fontSize:13,color:T.textMuted,marginTop:4}}>{cat.label}</div></div>
    {habit.goal&&<Card style={{marginBottom:10}}><div style={{fontFamily:F2,fontSize:11,color:T.textMuted,marginBottom:2}}>🎯 Моя ціль</div>
      <div style={{fontFamily:F2,fontSize:14,fontWeight:600,color:T.text,lineHeight:1.4}}>{habit.goal}</div></Card>}
    {habit.motivation&&<Card style={{marginBottom:10}}><div style={{fontFamily:F2,fontSize:11,color:T.textMuted,marginBottom:2}}>💡 Моя мотивація</div>
      <div style={{fontFamily:F2,fontSize:13,color:T.textSec,lineHeight:1.4}}>{habit.motivation}</div></Card>}
    {streak>0&&<div style={{textAlign:"center",margin:"12px 0"}}><div style={{fontSize:40,lineHeight:1}}>🔥</div>
      <div style={{fontFamily:F1,fontSize:24,fontWeight:800,color:T.accent}}>{streak} {streak===1?"день":streak<5?"дні":"днів"}</div></div>}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,margin:"14px 0"}}>
      {[{l:"Streak",v:streak},{l:"Макс.",v:maxS},{l:"Всього",v:total}].map(s=>
        <Card key={s.l} style={{textAlign:"center",padding:12}}><div style={{fontFamily:F1,fontSize:20,fontWeight:700,color:T.accent}}>{s.v}</div>
          <div style={{fontFamily:F2,fontSize:10,color:T.textMuted,marginTop:2}}>{s.l}</div></Card>)}</div>
    <SectionTitle>Останні 7 днів</SectionTitle><WeekDots completions={habit.completions}/>
    <div style={{marginTop:28}}><Btn variant="danger" onClick={()=>onDelete(habit.id)}>Видалити звичку</Btn></div></div>);
}

function AddHabitForm({onAdd,onCancel}){
  const [name,setName]=useState(""),[ category,setCategory]=useState("sport"),[goal,setGoal]=useState(""),[motivation,setMotivation]=useState(""),[step,setStep]=useState(0);
  return(<div style={{animation:"slideIn 0.3s"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
      <button onClick={onCancel} style={{background:"none",border:"none",color:T.textMuted,fontFamily:F2,fontSize:14,fontWeight:600,cursor:"pointer"}}>Скасувати</button>
      <div style={{fontFamily:F1,fontSize:16,fontWeight:700,color:T.text}}>Нова звичка</div><div style={{width:60}}/></div>
    <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:22}}>
      {[0,1,2].map(i=><div key={i} style={{width:i===step?24:8,height:6,borderRadius:3,background:i<=step?T.accent:"#E5E7EB",transition:"all 0.3s"}}/>)}</div>
    {step===0&&<div><Label>Назва звички</Label><Input value={name} onChange={setName} placeholder="Наприклад: Біг 30 хвилин"/>
      <div style={{marginTop:14}}><Label>Категорія</Label>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:4}}>
          {HABIT_CATEGORIES.map(c=><button key={c.id} onClick={()=>setCategory(c.id)} style={{padding:"10px 12px",borderRadius:10,cursor:"pointer",textAlign:"left",
            border:category===c.id?`2px solid ${T.accent}`:`1.5px solid ${T.border}`,background:category===c.id?T.accentLight:"#fff",
            color:category===c.id?T.accent:T.textSec,fontFamily:F2,fontSize:13,fontWeight:600}}>{c.emoji} {c.label}</button>)}</div></div></div>}
    {step===1&&<div style={{textAlign:"center"}}><div style={{fontSize:40}}>🎯</div>
      <div style={{fontFamily:F1,fontSize:16,fontWeight:700,color:T.text,margin:"8px 0 4px"}}>Яка твоя ціль?</div>
      <div style={{fontFamily:F2,fontSize:12,color:T.textMuted,marginBottom:14}}>Що хочеш досягти?</div>
      <TextArea value={goal} onChange={setGoal} placeholder="Наприклад: Пробігти марафон до кінця року"/></div>}
    {step===2&&<div style={{textAlign:"center"}}><div style={{fontSize:40}}>💡</div>
      <div style={{fontFamily:F1,fontSize:16,fontWeight:700,color:T.text,margin:"8px 0 4px"}}>Чому це важливо?</div>
      <div style={{fontFamily:F2,fontSize:12,color:T.textMuted,marginBottom:14}}>Мотивація для складних днів</div>
      <TextArea value={motivation} onChange={setMotivation} placeholder="Наприклад: Хочу бути здоровим для сім'ї"/></div>}
    <div style={{display:"flex",gap:10,marginTop:22}}>
      {step>0&&<Btn variant="ghost" onClick={()=>setStep(step-1)}>Назад</Btn>}
      <Btn disabled={step===0&&!name.trim()} onClick={()=>{if(step<2)setStep(step+1);else onAdd({name:name.trim(),category,goal:goal.trim(),motivation:motivation.trim()})}}>{step<2?"Далі →":"Створити ✓"}</Btn></div></div>);
}

function HabitsStats({habits}){
  const today=todayStr(),total=habits.length,doneToday=habits.filter(h=>h.completions[today]).length;
  const pct=total>0?Math.round(doneToday/total*100):0;
  const best=habits.reduce((b,h)=>{const s=calcStreak(h.completions);return s>b.s?{n:h.name,s}:b},{n:"—",s:0});
  const days=last7(),rates=days.map(d=>{const done=habits.filter(h=>h.completions[d]).length;return total>0?Math.round(done/total*100):0});
  return(<div style={{animation:"slideIn 0.3s"}}>
    <h2 style={{fontFamily:F1,fontSize:18,fontWeight:700,color:T.text,textAlign:"center",margin:"0 0 18px"}}>Статистика</h2>
    <div style={{textAlign:"center",marginBottom:20}}>
      <div style={{position:"relative",width:100,height:100,margin:"0 auto"}}>
        <svg width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="none" stroke="#E5E7EB" strokeWidth="8"/>
          <circle cx="50" cy="50" r="44" fill="none" stroke={T.accent} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${pct/100*276.5} 276.5`} transform="rotate(-90 50 50)" style={{transition:"stroke-dasharray 1s"}}/></svg>
        <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
          <div style={{fontFamily:F1,fontSize:24,fontWeight:700,color:T.text}}>{pct}%</div></div></div>
      <div style={{fontFamily:F2,fontSize:13,color:T.textMuted,marginTop:6}}>{doneToday} з {total} сьогодні</div></div>
    <Card style={{marginBottom:12}}>
      <div style={{fontFamily:F2,fontSize:12,fontWeight:600,color:T.textMuted,marginBottom:10}}>Тиждень</div>
      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",height:60,gap:4}}>
        {rates.map((r,i)=><div key={i} style={{textAlign:"center",flex:1}}>
          <div style={{height:Math.max(4,r/100*45),borderRadius:4,marginBottom:4,background:r>=80?T.green:r>=50?T.accent:r>0?"#F59E0B":"#E5E7EB",transition:"height 0.5s"}}/>
          <div style={{fontFamily:F2,fontSize:9,color:days[i]===todayStr()?T.accent:T.textMuted,fontWeight:days[i]===todayStr()?700:400}}>{dayOfWeek(days[i])}</div></div>)}</div></Card>
    {best.s>0&&<Card style={{textAlign:"center"}}><div style={{fontSize:24}}>🏆</div>
      <div style={{fontFamily:F1,fontSize:13,fontWeight:600,color:T.accent,marginTop:4}}>Найкращий streak</div>
      <div style={{fontFamily:F2,fontSize:13,color:T.text,marginTop:2}}>{best.n} — {best.s} {best.s===1?"день":best.s<5?"дні":"днів"}</div></Card>}</div>);
}

// ===================== FINANCE COMPONENTS =====================
function AddTransactionForm({onAdd,onCancel}){
  const [type,setType]=useState("expense"),[amount,setAmount]=useState(""),[desc,setDesc]=useState(""),[category,setCategory]=useState("products"),[date,setDate]=useState(todayStr());
  return(<div style={{animation:"slideIn 0.3s"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
      <button onClick={onCancel} style={{background:"none",border:"none",color:T.textMuted,fontFamily:F2,fontSize:14,fontWeight:600,cursor:"pointer"}}>Скасувати</button>
      <div style={{fontFamily:F1,fontSize:16,fontWeight:700,color:T.text}}>Новий запис</div><div style={{width:60}}/></div>
    <div style={{display:"flex",gap:4,marginBottom:16,background:"#F3F4F6",borderRadius:10,padding:3}}>
      {[{id:"expense",label:"Витрата"},{id:"income",label:"Дохід"}].map(t=>
        <button key={t.id} onClick={()=>setType(t.id)} style={{flex:1,padding:"10px 0",borderRadius:8,border:"none",cursor:"pointer",
          background:type===t.id?"#fff":"transparent",color:type===t.id?T.text:T.textMuted,fontFamily:F2,fontSize:14,fontWeight:600,
          boxShadow:type===t.id?T.shadow:"none",transition:"all 0.2s"}}>{t.label}</button>)}</div>
    <Label>📅 Дата</Label>
    <input type="date" value={date} onChange={e=>setDate(e.target.value)} max={todayStr()} style={{width:"100%",padding:"11px 14px",borderRadius:12,border:`1.5px solid ${T.border}`,background:"#fff",color:T.text,fontFamily:F2,fontSize:14,outline:"none",boxSizing:"border-box",marginBottom:12}}/>
    <Label>Сума (₴)</Label>
    <Input value={amount} onChange={setAmount} placeholder="0" type="number" style={{fontSize:22,fontWeight:700,fontFamily:F1,textAlign:"center",marginBottom:12}}/>
    <Label>Опис</Label>
    <Input value={desc} onChange={setDesc} placeholder={type==="income"?"Зарплата":"Обід у кафе"} style={{marginBottom:12}}/>
    {type==="expense"&&<><Label>Категорія</Label>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:14}}>
        {EXPENSE_CATEGORIES.map(c=><button key={c.id} onClick={()=>setCategory(c.id)} style={{padding:"8px 4px",borderRadius:10,cursor:"pointer",textAlign:"center",
          border:category===c.id?`2px solid ${T.accent}`:`1.5px solid ${T.border}`,background:category===c.id?T.accentLight:"#fff",
          color:category===c.id?T.accent:T.textSec,fontFamily:F2,fontSize:10,fontWeight:600,lineHeight:1.3}}>
          <div style={{fontSize:18,marginBottom:2}}>{c.emoji}</div>{c.label}</button>)}</div></>}
    <Btn disabled={!amount||parseFloat(amount)<=0} onClick={()=>{onAdd({id:Date.now().toString(),type,amount:parseFloat(amount),description:desc.trim(),category:type==="expense"?category:"income",date})}}>Додати ✓</Btn></div>);
}

function TransactionItem({tx,onDelete}){
  const isExp=tx.type==="expense";
  const cat=isExp?(EXPENSE_CATEGORIES.find(c=>c.id===tx.category)||{emoji:"📦",label:tx.category}):{emoji:"💰",label:"Дохід"};
  return(<div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:12,background:"#fff",border:`1px solid ${T.border}`,marginBottom:6}}>
    <div style={{width:36,height:36,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",background:"#F3F4F6",fontSize:18,flexShrink:0}}>{cat.emoji}</div>
    <div style={{flex:1,minWidth:0}}><div style={{fontFamily:F2,fontSize:13,fontWeight:600,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{tx.description||cat.label}</div>
      <div style={{fontFamily:F2,fontSize:11,color:T.textMuted}}>{cat.label} · {tx.date.slice(5).replace("-","/")}</div></div>
    <div style={{fontFamily:F1,fontSize:14,fontWeight:700,color:isExp?T.red:T.green,flexShrink:0}}>{isExp?"−":"+"}{fmt(tx.amount)}₴</div>
    <button onClick={()=>onDelete(tx.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:T.textMuted,padding:4,flexShrink:0}}>✕</button></div>);
}

// ===================== AI ANALYSIS =====================
function AIAnalysis({transactions}){
  const [loading,setLoading]=useState(false);
  const [result,setResult]=useState(null);
  const [period,setPeriod]=useState("next_month");
  const [extraContext,setExtraContext]=useState("");
  const [step,setStep]=useState("setup"); // setup | loading | result

  const analyze=async()=>{
    setStep("loading");setLoading(true);
    const last3months=[];
    for(let i=2;i>=0;i--){const d=new Date();d.setMonth(d.getMonth()-i);const m=monthStr(d);
      const txs=transactions.filter(t=>t.date.startsWith(m));
      const exp=txs.filter(t=>t.type==="expense");const inc=txs.filter(t=>t.type==="income");
      const byCat={};exp.forEach(t=>{byCat[t.category]=(byCat[t.category]||0)+t.amount});
      last3months.push({month:m,totalExpense:exp.reduce((s,t)=>s+t.amount,0),totalIncome:inc.reduce((s,t)=>s+t.amount,0),byCategory:byCat,transactionCount:exp.length});}
    const prompt=`Ти — фінансовий AI-аналітик. Проаналізуй витрати користувача за останні місяці та дай відповідь УКРАЇНСЬКОЮ мовою.

Дані витрат за останні 3 місяці (у гривнях):
${JSON.stringify(last3months,null,2)}

Категорії витрат: ${EXPENSE_CATEGORIES.map(c=>`${c.id}=${c.label}`).join(", ")}

Період для прогнозу: ${period==="next_month"?"наступний місяць":"наступні 3 місяці"}
${extraContext?`Додатковий контекст від користувача: "${extraContext}"`:"Користувач не вказав особливих змін у витратах."}

Дай відповідь у форматі:
1. ПРОГНОЗ ВИТРАТ — конкретні цифри по кожній категорії на обраний період
2. ЗАГАЛЬНА ПРОГНОЗОВАНА СУМА
3. ПАТЕРНИ — 2-3 цікавих спостережень про структуру витрат
4. РЕКОМЕНДАЦІЇ — 2-3 конкретних поради як оптимізувати витрати

Будь конкретним, використовуй цифри. Відповідай стисло, без зайвої води.`;

    try{
      const response=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:prompt}]})});
      const data=await response.json();
      const text=data.content?.map(b=>b.text||"").join("\n")||"Не вдалося отримати відповідь";
      setResult(text);setStep("result");
    }catch(err){setResult("Помилка з'єднання з AI. Спробуй ще раз.");setStep("result")}
    setLoading(false);
  };

  if(step==="result"&&result){
    return(<div style={{animation:"slideIn 0.3s"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <div style={{fontFamily:F1,fontSize:16,fontWeight:700,color:T.text}}>🤖 AI-аналіз</div>
        <Btn small variant="ghost" onClick={()=>{setStep("setup");setResult(null)}}>Новий аналіз</Btn></div>
      <Card><div style={{fontFamily:F2,fontSize:14,color:T.text,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{result}</div></Card></div>);
  }

  return(<div style={{animation:"slideIn 0.3s"}}>
    <div style={{fontFamily:F1,fontSize:16,fontWeight:700,color:T.text,marginBottom:14}}>🤖 AI-прогноз витрат</div>
    <Card style={{marginBottom:12}}>
      <Label>Період прогнозу</Label>
      <div style={{display:"flex",gap:6}}>
        {[{id:"next_month",label:"Наступний місяць"},{id:"next_3months",label:"3 місяці"}].map(p=>
          <button key={p.id} onClick={()=>setPeriod(p.id)} style={{flex:1,padding:"10px 0",borderRadius:8,border:period===p.id?`2px solid ${T.accent}`:`1.5px solid ${T.border}`,
            background:period===p.id?T.accentLight:"#fff",color:period===p.id?T.accent:T.textSec,fontFamily:F2,fontSize:13,fontWeight:600,cursor:"pointer"}}>{p.label}</button>)}</div>
    </Card>
    <Card style={{marginBottom:12}}>
      <Label>Чи плануються великі витрати/зміни?</Label>
      <TextArea value={extraContext} onChange={setExtraContext} placeholder="Наприклад: планую відпустку, або збільшиться оренда..." rows={2}/>
    </Card>
    <Btn onClick={analyze} disabled={loading}>{loading?"Аналізую... 🔄":"Спрогнозувати витрати 🤖"}</Btn>
    {transactions.filter(t=>t.type==="expense").length<3&&
      <div style={{fontFamily:F2,fontSize:12,color:T.textMuted,textAlign:"center",marginTop:10}}>💡 Для кращого прогнозу додай більше записів витрат</div>}
  </div>);
}

// ===================== FINANCE DASHBOARD =====================
function FinanceDashboard({transactions,onAdd,onDelete}){
  const [subView,setSubView]=useState("overview");
  const [selectedMonth,setSelectedMonth]=useState(monthStr());
  const firstOfMonth=selectedMonth+"-01";
  const lastDay=new Date(parseInt(selectedMonth.slice(0,4)),parseInt(selectedMonth.slice(5,7)),0).getDate();
  const lastOfMonth=selectedMonth+"-"+String(lastDay).padStart(2,"0");
  const [dateFrom,setDateFrom]=useState(firstOfMonth);
  const [dateTo,setDateTo]=useState(lastOfMonth);
  const [showFilter,setShowFilter]=useState(false);

  const prevMonth=()=>{const d=new Date(selectedMonth+"-01");d.setMonth(d.getMonth()-1);const m=monthStr(d);setSelectedMonth(m);const ld=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();setDateFrom(m+"-01");setDateTo(m+"-"+String(ld).padStart(2,"0"));setShowFilter(false)};
  const nextMonth=()=>{const d=new Date(selectedMonth+"-01");d.setMonth(d.getMonth()+1);if(d<=new Date()){const m=monthStr(d);setSelectedMonth(m);const ld=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();setDateFrom(m+"-01");setDateTo(m+"-"+String(ld).padStart(2,"0"));setShowFilter(false)}};

  if(subView==="add")return <AddTransactionForm onAdd={tx=>{onAdd(tx);setSubView("overview")}} onCancel={()=>setSubView("overview")}/>;
  if(subView==="ai")return <div><button onClick={()=>setSubView("overview")} style={{background:"none",border:"none",color:T.accent,fontFamily:F2,fontSize:14,fontWeight:600,cursor:"pointer",padding:"8px 0",marginBottom:8}}>← Назад</button><AIAnalysis transactions={transactions}/></div>;

  const filtered=transactions.filter(t=>t.date>=dateFrom&&t.date<=dateTo);
  const totalIncome=filtered.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
  const totalExpense=filtered.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
  const balance=totalIncome-totalExpense;
  const byCat={};filtered.filter(t=>t.type==="expense").forEach(t=>{byCat[t.category]=(byCat[t.category]||0)+t.amount});
  const catEntries=Object.entries(byCat).sort((a,b)=>b[1]-a[1]);
  const maxCatVal=catEntries.length>0?catEntries[0][1]:1;
  const monthName=new Date(selectedMonth+"-01").toLocaleDateString("uk-UA",{month:"long",year:"numeric"});
  const fmtShort=d=>{const p=d.split("-");return `${p[2]}/${p[1]}`};

  return(<div style={{animation:"slideIn 0.3s"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
      <button onClick={prevMonth} style={{background:"none",border:"none",color:T.accent,fontSize:20,cursor:"pointer",padding:8}}>‹</button>
      <div style={{fontFamily:F1,fontSize:15,fontWeight:700,color:T.text,textTransform:"capitalize"}}>{monthName}</div>
      <button onClick={nextMonth} style={{background:"none",border:"none",color:monthStr()===selectedMonth?T.textMuted:T.accent,fontSize:20,cursor:"pointer",padding:8}}>›</button></div>

    <button onClick={()=>setShowFilter(!showFilter)} style={{width:"100%",padding:"8px 12px",borderRadius:10,border:`1px solid ${T.border}`,background:showFilter?T.accentLight:"#fff",cursor:"pointer",marginBottom:10,
      display:"flex",alignItems:"center",justifyContent:"center",gap:6,fontFamily:F2,fontSize:12,fontWeight:600,color:showFilter?T.accent:T.textMuted}}>
      📅 {fmtShort(dateFrom)} — {fmtShort(dateTo)} {showFilter?"▲":"▼"}</button>

    {showFilter&&<Card style={{marginBottom:12,animation:"fadeIn 0.2s"}}>
      <div style={{display:"flex",gap:10,alignItems:"center"}}>
        <div style={{flex:1}}><div style={{fontFamily:F2,fontSize:11,color:T.textMuted,marginBottom:4}}>Від</div>
          <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{width:"100%",padding:"8px",borderRadius:8,border:`1px solid ${T.border}`,background:"#fff",color:T.text,fontFamily:F2,fontSize:12,outline:"none",boxSizing:"border-box"}}/></div>
        <div style={{flex:1}}><div style={{fontFamily:F2,fontSize:11,color:T.textMuted,marginBottom:4}}>До</div>
          <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} max={todayStr()} style={{width:"100%",padding:"8px",borderRadius:8,border:`1px solid ${T.border}`,background:"#fff",color:T.text,fontFamily:F2,fontSize:12,outline:"none",boxSizing:"border-box"}}/></div></div>
      <div style={{display:"flex",gap:6,marginTop:8}}>
        {[{label:"Сьогодні",fn:()=>{setDateFrom(todayStr());setDateTo(todayStr())}},{label:"Тиждень",fn:()=>{const d=new Date();d.setDate(d.getDate()-6);setDateFrom(d.toISOString().slice(0,10));setDateTo(todayStr())}},{label:"Місяць",fn:()=>{setDateFrom(firstOfMonth);setDateTo(lastOfMonth)}}].map(p=>
          <button key={p.label} onClick={p.fn} style={{padding:"5px 10px",borderRadius:6,border:`1px solid ${T.border}`,background:"#fff",color:T.textMuted,fontFamily:F2,fontSize:11,fontWeight:600,cursor:"pointer"}}>{p.label}</button>)}</div></Card>}

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
      <Card style={{padding:12}}><div style={{fontFamily:F2,fontSize:11,color:T.textMuted}}>Дохід</div>
        <div style={{fontFamily:F1,fontSize:17,fontWeight:700,color:T.green}}>+{fmt(totalIncome)}₴</div></Card>
      <Card style={{padding:12}}><div style={{fontFamily:F2,fontSize:11,color:T.textMuted}}>Витрати</div>
        <div style={{fontFamily:F1,fontSize:17,fontWeight:700,color:T.red}}>−{fmt(totalExpense)}₴</div></Card></div>
    <Card style={{marginBottom:14,textAlign:"center",padding:12}}>
      <div style={{fontFamily:F2,fontSize:11,color:T.textMuted}}>Баланс</div>
      <div style={{fontFamily:F1,fontSize:22,fontWeight:800,color:balance>=0?T.green:T.red}}>{balance>=0?"+":"−"}{fmt(Math.abs(balance))}₴</div></Card>

    {catEntries.length>0&&<Card style={{marginBottom:12}}>
      <div style={{fontFamily:F2,fontSize:12,fontWeight:600,color:T.textMuted,marginBottom:10}}>По категоріях</div>
      {catEntries.map(([catId,val])=>{const cat=EXPENSE_CATEGORIES.find(c=>c.id===catId)||{emoji:"📦",label:catId};const pct=totalExpense>0?Math.round(val/totalExpense*100):0;
        return(<div key={catId} style={{marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
            <span style={{fontFamily:F2,fontSize:12,fontWeight:600,color:T.text}}>{cat.emoji} {cat.label}</span>
            <span style={{fontFamily:F1,fontSize:12,fontWeight:600,color:T.accent}}>{fmt(val)}₴ ({pct}%)</span></div>
          <div style={{height:5,borderRadius:3,background:"#E5E7EB",overflow:"hidden"}}>
            <div style={{height:"100%",width:`${val/maxCatVal*100}%`,borderRadius:3,background:T.accent,transition:"width 0.5s"}}/></div></div>)})}</Card>}

    <SectionTitle>Записи ({filtered.length})</SectionTitle>
    {filtered.length===0?<div style={{textAlign:"center",padding:"20px 0",color:T.textMuted,fontFamily:F2,fontSize:13}}>Немає записів</div>:
      filtered.sort((a,b)=>b.date.localeCompare(a.date)||parseInt(b.id)-parseInt(a.id)).map(tx=><TransactionItem key={tx.id} tx={tx} onDelete={onDelete}/>)}

    <div style={{display:"flex",gap:8,marginTop:16,paddingBottom:20}}>
      <Btn onClick={()=>setSubView("add")}>+ Додати</Btn>
      <Btn variant="secondary" onClick={()=>setSubView("ai")} style={{width:"auto",minWidth:50}}>🤖</Btn></div></div>);
}

// ===================== MAIN APP =====================
export default function LifeTrack(){
  const [tab,setTab]=useState("habits");
  const [habits,setHabits]=useState([]);
  const [transactions,setTransactions]=useState([]);
  const [habitView,setHabitView]=useState("home");
  const [selectedHabit,setSelectedHabit]=useState(null);
  const [loaded,setLoaded]=useState(false);

  useEffect(()=>{const d=load();if(d){setHabits(d.habits||[]);setTransactions(d.transactions||[])}setLoaded(true)},[]);
  useEffect(()=>{if(loaded)save({habits,transactions})},[habits,transactions,loaded]);

  const toggleHabit=useCallback(id=>{setHabits(p=>p.map(h=>{if(h.id!==id)return h;const c={...h.completions};c[todayStr()]=!c[todayStr()];return{...h,completions:c}}))},[]);
  const addHabit=useCallback(d=>{setHabits(p=>[...p,{id:Date.now().toString(),...d,completions:{},createdAt:todayStr()}]);setHabitView("home")},[]);
  const deleteHabit=useCallback(id=>{setHabits(p=>p.filter(h=>h.id!==id));setHabitView("home")},[]);
  const addTransaction=useCallback(tx=>setTransactions(p=>[...p,tx]),[]);
  const deleteTransaction=useCallback(id=>setTransactions(p=>p.filter(t=>t.id!==id)),[]);

  const today=todayStr(),doneToday=habits.filter(h=>h.completions[today]).length,allDone=habits.length>0&&doneToday===habits.length;
  const greeting=(()=>{const h=new Date().getHours();if(h<6)return "Доброї ночі";if(h<12)return "Доброго ранку";if(h<18)return "Доброго дня";return "Доброго вечора"})();

  return(
    <div style={{maxWidth:420,margin:"0 auto",minHeight:"100vh",background:T.bg,fontFamily:F2,position:"relative"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        *{box-sizing:border-box}
        input::placeholder,textarea::placeholder{color:#9CA3AF}
        input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none}
        input[type=number]{-moz-appearance:textfield}
        body{background:${T.bg}}
      `}</style>

      <div style={{padding:"12px 16px 30px"}}>
        {/* Header + Tabs */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <div><div style={{fontFamily:F2,fontSize:13,color:T.textMuted}}>{greeting} 👋</div>
            <div style={{fontFamily:F1,fontSize:20,fontWeight:800,color:T.text}}>LifeTrack</div></div></div>

        {/* Tab switcher */}
        <div style={{display:"flex",gap:4,marginBottom:18,background:"#F3F4F6",borderRadius:12,padding:3}}>
          {[{id:"habits",label:"🎯 Звички"},{id:"finance",label:"💳 Фінанси"}].map(t=>
            <button key={t.id} onClick={()=>{setTab(t.id);setHabitView("home")}} style={{flex:1,padding:"10px 0",borderRadius:10,border:"none",cursor:"pointer",
              background:tab===t.id?"#fff":"transparent",color:tab===t.id?T.text:T.textMuted,fontFamily:F2,fontSize:14,fontWeight:600,
              boxShadow:tab===t.id?T.shadow:"none",transition:"all 0.2s",WebkitTapHighlightColor:"transparent"}}>{t.label}</button>)}</div>

        {/* HABITS */}
        {tab==="habits"&&<>
          {habitView==="home"&&<div style={{animation:"fadeIn 0.3s"}}>
            {habits.length>0&&<Card style={{marginBottom:14,textAlign:"center",background:allDone?T.greenBg:"#fff",border:allDone?`1px solid #A7F3D0`:`1px solid ${T.border}`}}>
              {allDone?<><div style={{fontSize:26}}>🎉</div><div style={{fontFamily:F1,fontSize:14,fontWeight:700,color:T.green,marginTop:2}}>Всі виконано!</div></>:
                <><div style={{fontFamily:F1,fontSize:15,fontWeight:700,color:T.text}}>{doneToday} / {habits.length}</div>
                  <div style={{fontFamily:F2,fontSize:12,color:T.textMuted}}>виконано сьогодні</div>
                  <div style={{height:4,borderRadius:2,background:"#E5E7EB",marginTop:8,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${doneToday/habits.length*100}%`,borderRadius:2,background:T.accent,transition:"width 0.5s"}}/></div></>}</Card>}

            {habits.length===0?<div style={{textAlign:"center",padding:"50px 20px",color:T.textMuted}}>
              <div style={{fontSize:48,marginBottom:14}}>🌱</div>
              <div style={{fontFamily:F1,fontSize:17,fontWeight:700,color:T.text,marginBottom:6}}>Почни свій шлях</div>
              <div style={{fontFamily:F2,fontSize:14}}>Додай першу звичку!</div></div>:
              habits.map(h=><HabitCard key={h.id} habit={h} onToggle={toggleHabit} onTap={id=>{setSelectedHabit(id);setHabitView("detail")}}/>)}

            <div style={{display:"flex",gap:8,marginTop:16,paddingBottom:20}}>
              <Btn onClick={()=>setHabitView("add")}>+ Нова звичка</Btn>
              {habits.length>0&&<Btn variant="secondary" onClick={()=>setHabitView("stats")} style={{width:"auto",minWidth:50}}>📊</Btn>}</div></div>}

          {habitView==="add"&&<AddHabitForm onAdd={addHabit} onCancel={()=>setHabitView("home")}/>}
          {habitView==="detail"&&selectedHabit&&habits.find(h=>h.id===selectedHabit)&&
            <HabitDetail habit={habits.find(h=>h.id===selectedHabit)} onBack={()=>setHabitView("home")} onDelete={deleteHabit}/>}
          {habitView==="stats"&&<div>
            <button onClick={()=>setHabitView("home")} style={{background:"none",border:"none",color:T.accent,fontFamily:F2,fontSize:14,fontWeight:600,cursor:"pointer",padding:"8px 0",marginBottom:8}}>← Назад</button>
            <HabitsStats habits={habits}/></div>}</>}

        {/* FINANCE */}
        {tab==="finance"&&<FinanceDashboard transactions={transactions} onAdd={addTransaction} onDelete={deleteTransaction}/>}
      </div>
    </div>);
}
