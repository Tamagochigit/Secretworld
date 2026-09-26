'use strict';
(()=>{
 const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const cache={};
 async function getJSON(path,timeout=12000){
  if(cache[path])return cache[path];
  const c=new AbortController(),timer=setTimeout(()=>c.abort(),timeout);
  try{
   const r=await fetch(path,{cache:'no-store',credentials:'same-origin',signal:c.signal});
   if(!r.ok)throw new Error('Источник временно недоступен.');
   return cache[path]=await r.json();
  }catch(e){if(e.name==='AbortError')throw new Error('Запрос не успел завершиться. Проверьте интернет и повторите.');throw e;}
  finally{clearTimeout(timer);}
 }
 let items=[],postsLoaded=false;
 async function posts(){
  if(postsLoaded)return;
  const button=$('#loadPosts');button.disabled=true;$('#usStatus').textContent='Загружаю материалы…';
  try{
   const d=await getJSON('../data/us.json');
   items=(d.items||[]).filter(x=>x.active!==false&&x.translations?.ru?.title&&x.translations?.ru?.body&&x.published<=new Date().toISOString()).sort((a,b)=>b.published.localeCompare(a.published));
   postsLoaded=true;renderPosts();
  }catch(e){$('#usStatus').textContent=e.message;button.hidden=false;}
  finally{button.disabled=false;}
 }
 function renderPosts(){
  const category=$('#usCategory').value;
  const list=items.filter(x=>!category||x.translations.ru.category===category);
  $('#usList').innerHTML=list.map((x,i)=>'<article class="us-card"><span class="us-number">'+String(i+1).padStart(2,'0')+'</span><p class="us-meta">'+esc(x.translations.ru.category)+' · '+new Date(x.published).toLocaleDateString('ru-RU')+'</p><h3>'+esc(x.translations.ru.title)+'</h3><p>'+esc(x.translations.ru.body.slice(0,150))+'…</p><button class="secondary" data-read-post="'+esc(x.id)+'">Читать</button></article>').join('')||'<p>Пока нет материалов по этой категории.</p>';
  $('#usStatus').textContent='Материалы загружаются из открытого справочника Secretworld. Ваши сообщения к запросу не добавляются.';
  $('#loadPosts').hidden=true;
 }
 $('#usCategory').addEventListener('change',()=>{if(postsLoaded)renderPosts();});
 $('#loadPosts').addEventListener('click',posts);
 document.addEventListener('click',e=>{
  if(e.target.closest('[data-view="us"]'))posts();
  const b=e.target.closest('[data-read-post]');if(!b)return;
  const x=items.find(q=>q.id===b.dataset.readPost);if(!x)return;
  const v=x.translations.ru;$('#infoTitle').textContent=v.title;$('#infoBody').innerHTML='<div class="us-reader">'+BegemotRich.html(v.body)+'</div>';$('#infoDialog').showModal();
 });
 const phoneInput=$('#webPhone'),phoneResult=$('#webPhoneResult');
 function normalPhone(raw){let n=String(raw||'').replace(/\D/g,'');if(n.length===11&&n[0]==='8')n='7'+n.slice(1);if(n.length===10)n='7'+n;return n;}
 $('#webPhoneFind').addEventListener('click',async()=>{
  const n=normalPhone(phoneInput.value);
  if(!/^\d{11,15}$/.test(n)){phoneResult.textContent='Введите номер целиком, с кодом страны. Для российских номеров подойдёт формат +7 или 8.';return;}
  const b=$('#webPhoneFind');b.disabled=true;phoneResult.textContent='Сверяю с локальным справочником…';
  try{
   const d=await getJSON('../data/directory.json'),x=(d.items||[]).find(i=>i.number===n);
   if(x){phoneResult.textContent=x.label+' · '+x.category+'\nИсточник: '+x.source+'\nПроверено: '+new Date(x.checked).toLocaleDateString('ru-RU')+'. Звонящий может подменить номер.';}
   else phoneResult.textContent='В проверенном справочнике нет подписи для этого номера. Это не означает, что он безопасен.';
  }catch(e){phoneResult.textContent=e.message;}
  finally{b.disabled=false;}
 });
 let player=null;let choice='purr';try{choice=localStorage.getItem('begemot-sound')==='meow'?'meow':'purr';}catch{}
 $('#soundChoice').value=choice;
 $('#previewSound').addEventListener('click',()=>{
  player?.pause();player=new Audio('./assets/'+$('#soundChoice').value+'.mp3');
  player.play().catch(()=>{$('#soundState').textContent='Safari не разрешил звук. Нажмите «Послушать» ещё раз.';});
 });
 $('#stopSound').addEventListener('click',()=>{player?.pause();});
 $('#soundChoice').addEventListener('change',()=>{
  try{localStorage.setItem('begemot-sound',$('#soundChoice').value);}catch{}
  $('#soundState').textContent='Выбор сохранён в этом браузере. Звук воспроизводится только после нажатия на странице.';
 });
 $('#networkTest').addEventListener('click',async()=>{
  const button=$('#networkTest');button.disabled=true;$('#networkResult').textContent='Проверяю HTTPS-соединение с Secretworld…';
  const timed=async(path,limit,read)=>{
   const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),limit),started=performance.now();
   try{const r=await fetch(path,{cache:'no-store',signal:ctl.signal,credentials:'same-origin'});if(!r.ok)throw new Error('Сайт ответил с ошибкой.');const body=await read(r);return {ms:performance.now()-started,body};}
   finally{clearTimeout(timer);}
  };
  try{
   if(!navigator.onLine)throw new Error('Safari сообщает, что сети нет. Проверьте Wi-Fi или мобильные данные.');
   const times=[];for(let i=0;i<3;i++){const x=await timed('./ping.txt?check='+Date.now()+'-'+i,8000,r=>r.text());times.push(Math.round(x.ms));}
   const p=await timed('./probe.bin?check='+Date.now(),12000,r=>r.arrayBuffer()),bytes=p.body.byteLength;
   const median=[...times].sort((x,y)=>x-y)[1],mbps=(bytes*8/1e6)/(Math.max(1,p.ms)/1000);
   $('#networkResult').textContent='Ответы сайта: '+times.join(' / ')+' мс.\nТестовый файл: '+Math.round(bytes/1024)+' КБ · около '+mbps.toFixed(1)+' Мбит/с.\n'+(median>1000?'Отклик медленный.':'Сайт отвечает.')+' Это один маршрут, не скорость оператора и не измерение сигнала.';
  }catch(e){$('#networkResult').textContent=e.name==='AbortError'?'Проверка не успела завершиться.':'Проверка не прошла: '+e.message+' Сравните Wi-Fi и мобильную сеть и откройте ещё пару знакомых сайтов.';}
  finally{button.disabled=false;}
 });
 $('#checkUpdate').addEventListener('click',async()=>{
  const button=$('#checkUpdate');button.disabled=true;$('#updateState').textContent='Проверяю обновление веб-версии…';
  try{const reg=await navigator.serviceWorker?.getRegistration();if(reg)await reg.update();$('#updateState').textContent='Проверка завершена. Новая версия сайта загрузится автоматически; при необходимости закройте и снова откройте Бегемота.';}
  catch{$('#updateState').textContent='Не удалось проверить обновление. Когда появится сеть, закройте и снова откройте страницу.';}
  finally{button.disabled=false;}
 });
 navigator.serviceWorker?.addEventListener('controllerchange',()=>{$('#updateState').textContent='Офлайн-версия обновлена. После диалога можно открыть страницу заново.';});
})();