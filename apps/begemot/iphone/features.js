'use strict';
(()=>{
 const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const cache={};
 async function getJSON(path,timeout=12000){
  if(cache[path])return cache[path];
  const c=new AbortController(),timer=setTimeout(()=>c.abort(),timeout);
  try{const r=await fetch(path,{cache:'no-store',credentials:'same-origin',signal:c.signal});if(!r.ok)throw new Error('Источник временно недоступен.');return cache[path]=await r.json();}
  catch(e){if(e.name==='AbortError')throw new Error('Запрос не успел завершиться. Проверьте интернет и повторите.');throw e;}
  finally{clearTimeout(timer);}
 }
 function normalPhone(raw){let n=String(raw||'').replace(/\D/g,'');if(n.length===11&&n[0]==='8')n='7'+n.slice(1);if(n.length===10)n='7'+n;return n;}
 const phoneInput=$('#webPhone'),phoneResult=$('#webPhoneResult'),phoneButton=$('#webPhoneFind');
 async function findPhone(){
  const n=normalPhone(phoneInput.value);
  if(!/^\d{11,15}$/.test(n)){phoneResult.textContent='Введите номер целиком, с кодом страны. Для российского номера подойдёт +7 или 8.';return;}
  phoneButton.disabled=true;phoneResult.textContent='Сверяю с локальным справочником…';
  try{const d=await getJSON('../data/directory.json'),x=(d.items||[]).find(i=>i.number===n);
   if(x)phoneResult.textContent=x.label+' · '+x.category+'\nИсточник: '+x.source+'\nПроверено: '+new Date(x.checked).toLocaleDateString('ru-RU')+'. Звонящий может подменить номер.';
   else phoneResult.textContent='Номера нет в опубликованном справочнике. Это не означает, что звонок безопасен.';
  }catch(e){phoneResult.textContent=e.message;}
  finally{phoneButton.disabled=false;}
 }
 phoneButton.addEventListener('click',findPhone);phoneInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();findPhone();}});
 const plans={
  connection:{title:'Сайт или интернет не открывается',steps:['Откройте ещё два знакомых сайта. Если не работает только один, вероятнее всего проблема у него.','Сравните Wi‑Fi и мобильную сеть. Если сбой только в Wi‑Fi, перезапустите роутер или подойдите ближе.','Если сами настраивали VPN или профиль DNS, временно отключите один из них, проверьте и верните настройку. Не удаляйте рабочие профили наугад.']},
  permission:{title:'Приложение просит странный доступ',steps:['Не разрешайте доступ под давлением или ради «проверки аккаунта». Закройте запрос и уточните, зачем приложению этот доступ.','В Настройках iPhone откройте «Конфиденциальность и безопасность» и проверьте доступ к камере, микрофону, фото и контактам. Названия пунктов могут немного отличаться по версии iOS.','Если приложению больше не доверяете, выключите ненужное разрешение. Сначала сохраните важные данные, если собираетесь удалять приложение.']},
  profile:{title:'Нашёлся неизвестный профиль или VPN',steps:['Откройте Настройки → Основные → VPN и управление устройством. Проверьте, кому принадлежит профиль и когда вы его устанавливали.','Не удаляйте профиль работы или учёбы, пока не уточнили у администратора.','Если профиль вам незнаком и устройство личное, отключите неизвестный VPN и свяжитесь с поддержкой Apple или оператором через официальный канал.']}
 };
 $('#runIosGuide').addEventListener('click',()=>{const plan=plans[$('#iosIssue').value];$('#iosPlan').innerHTML='<strong>'+esc(plan.title)+'</strong><ol>'+plan.steps.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ol>';});
 let player=null,choice='purr';try{choice=localStorage.getItem('begemot-sound')==='meow'?'meow':'purr';}catch{}
 $('#soundChoice').value=choice;$('#previewSound').addEventListener('click',()=>{player?.pause();player=new Audio('./assets/'+$('#soundChoice').value+'.mp3');player.play().catch(()=>{$('#soundState').textContent='Safari не разрешил звук. Нажмите «Послушать» ещё раз.';});});
 $('#stopSound').addEventListener('click',()=>player?.pause());$('#soundChoice').addEventListener('change',()=>{try{localStorage.setItem('begemot-sound',$('#soundChoice').value);}catch{}$('#soundState').textContent='Выбор сохранён в этом браузере. Звук работает только после нажатия на странице.';});
 $('#checkUpdate').addEventListener('click',async()=>{const button=$('#checkUpdate');button.disabled=true;$('#updateState').textContent='Проверяю обновление…';try{const reg=await navigator.serviceWorker?.getRegistration();if(reg)await reg.update();$('#updateState').textContent='Проверка завершена. Если страница не обновилась, закройте и снова откройте Бегемота.';}catch{$('#updateState').textContent='Не удалось проверить обновление. Повторите, когда появится сеть.';}finally{button.disabled=false;}});
 navigator.serviceWorker?.addEventListener('controllerchange',()=>{$('#updateState').textContent='Офлайн-версия обновлена. Можно снова открыть страницу.';});
})();
