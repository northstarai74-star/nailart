const $=s=>document.querySelector(s);
$('#yr').textContent=new Date().getFullYear();
document.querySelectorAll('#menu a').forEach(a=>a.onclick=()=>$('#menu').classList.remove('open'));

// animated counters
const io=new IntersectionObserver(es=>es.forEach(e=>{
  if(!e.isIntersecting)return;io.unobserve(e.target);
  const end=+e.target.dataset.n,t0=performance.now();
  (function tick(t){const p=Math.min((t-t0)/1200,1);e.target.textContent=Math.round(end*p).toLocaleString();if(p<1)requestAnimationFrame(tick)})(t0);
}),{threshold:.6});
document.querySelectorAll('[data-n]').forEach(el=>io.observe(el));

// invoice calculator
const items=$('#items');
function addLine(d='',q=1,p=0){
  const r=document.createElement('div');r.className='line';
  r.innerHTML='<input placeholder="Description" value="'+d+'"><input type="number" min="1" value="'+q+'"><input type="number" min="0" step="0.01" value="'+p+'"><button class="del" aria-label="Remove">✕</button>';
  r.oninput=calc;r.querySelector('.del').onclick=()=>{r.remove();calc()};items.appendChild(r);
}
function calc(){
  let sum=0;items.querySelectorAll('.line').forEach(r=>{const i=r.querySelectorAll('input');sum+=(+i[1].value||0)*(+i[2].value||0)});
  sum*=1+(+$('#tax').value||0)/100;
  $('#total').textContent=sum.toLocaleString('en-US',{style:'currency',currency:'USD'});
}
$('#add').onclick=()=>addLine();$('#tax').oninput=calc;
addLine('Website design',1,1800);addLine('Logo & brand guide',1,650);calc();

// signup
$('#signup').onsubmit=e=>{e.preventDefault();$('#msg').textContent='Thanks! We\'ll email '+$('#email').value+' shortly.';e.target.reset()};
