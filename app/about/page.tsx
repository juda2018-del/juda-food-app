import Link from "next/link";

export default function AboutPage() {
  return (
    <main dir="rtl" style={{minHeight:"100dvh",background:"linear-gradient(180deg,#fff8f1,#fff)",fontFamily:'Arial,"Cairo",sans-serif',color:"#171717",padding:"18px 16px 60px"}}>
      <section style={{width:"100%",maxWidth:430,margin:"0 auto"}}>
        <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
          <Link href="/profile" style={{width:44,height:44,borderRadius:16,background:"#fff",display:"grid",placeItems:"center",textDecoration:"none",color:"#171717",fontSize:28,boxShadow:"0 10px 26px rgba(0,0,0,.08)"}}>‹</Link>
          <div style={{textAlign:"center"}}><h1 style={{margin:0,fontSize:24}}>حول FUSE</h1><p style={{margin:"4px 0 0",fontSize:12,color:"#777"}}>منصة طلب وتوصيل عراقية</p></div>
          <div style={{width:44}} />
        </header>

        <section style={{background:"linear-gradient(135deg,#181818,#343434)",color:"#fff",borderRadius:30,padding:24,boxShadow:"0 18px 42px rgba(0,0,0,.18)"}}>
          <div style={{width:74,height:74,borderRadius:24,display:"grid",placeItems:"center",fontSize:32,fontWeight:900,background:"linear-gradient(135deg,#ff8a00,#ff3d00)",marginBottom:18}}>F</div>
          <h2 style={{margin:"0 0 10px",fontSize:27}}>FUSE Iraq</h2>
          <p style={{margin:0,color:"rgba(255,255,255,.76)",lineHeight:1.9,fontSize:14}}>تطبيق يجمع الزبائن والمطاعم والسائقين في تجربة طلب واحدة، مع متابعة واضحة للطلب من لحظة الإرسال إلى التسليم.</p>
        </section>

        <section style={{marginTop:16,background:"#fff",borderRadius:26,padding:20,boxShadow:"0 12px 32px rgba(0,0,0,.07)"}}>
          <h2 style={{margin:"0 0 14px",fontSize:19}}>شنو يوفر FUSE؟</h2>
          {["تصفح المطاعم والقوائم المتاحة فعلياً.","طلب آمن مرتبط بحساب الزبون.","متابعة حالة الطلب والتقييم بعد التسليم.","بوابات منفصلة للمطاعم والسائقين والإدارة.","طلبات انضمام رسمية للمطاعم والسائقين."].map((item)=><div key={item} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"10px 0",borderBottom:"1px solid #f2ece6",fontSize:14,lineHeight:1.7}}><span style={{color:"#ff5500",fontWeight:900}}>✓</span><span>{item}</span></div>)}
        </section>

        <section style={{marginTop:16,background:"#fff7ee",border:"1px solid #ffd9c2",borderRadius:24,padding:18}}>
          <h2 style={{margin:"0 0 8px",fontSize:17}}>الدعم والخصوصية</h2>
          <p style={{margin:0,color:"#666",lineHeight:1.8,fontSize:13}}>تواصل مع الدعم بخصوص حسابك أو طلباتك، وراجع سياسة الخصوصية وشروط الاستخدام من الروابط أدناه.</p>
          <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:14}}>
            <Link href="/support" style={{padding:"11px 14px",borderRadius:14,background:"#ff5500",color:"#fff",textDecoration:"none",fontWeight:900,fontSize:13}}>الدعم</Link>
            <Link href="/privacy" style={{padding:"11px 14px",borderRadius:14,background:"#fff",color:"#222",textDecoration:"none",fontWeight:900,fontSize:13}}>الخصوصية</Link>
            <Link href="/terms" style={{padding:"11px 14px",borderRadius:14,background:"#fff",color:"#222",textDecoration:"none",fontWeight:900,fontSize:13}}>الشروط</Link>
          </div>
        </section>
      </section>
    </main>
  );
}
