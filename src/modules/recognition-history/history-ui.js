'use strict';
const historyStatus = document.getElementById('history-status');
function download(rows, name) {
  const url = URL.createObjectURL(new Blob([JSON.stringify({schemaVersion:1,exportedAt:new Date().toISOString(),examples:rows}, null, 2)], {type:'application/json'}));
  const link = document.createElement('a'); link.href=url; link.download=name+'.json'; link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function action(work) {try {await work();} catch {historyStatus.textContent='Operacja nie powiodła się. Spróbuj ponownie.';}}
async function renderHistory() {
  const rows=await RecognitionHistory.list();
  historyStatus.textContent=rows.length+' zapisanych przykładów';
  const container=document.getElementById('history-rows'); container.replaceChildren();
  for (const row of rows) {
    const details=document.createElement('details'), summary=document.createElement('summary');
    summary.textContent=row.createdAt.slice(0,16).replace('T',' ');
    const rawLabel=document.createElement('label'); rawLabel.textContent='Tekst źródłowy (możesz zanonimizować)';
    const raw=document.createElement('textarea'); raw.value=row.text; raw.maxLength=50000; rawLabel.append(raw);
    const save=document.createElement('button');save.textContent='Zapisz tekst';
    save.onclick=()=>action(async()=>{await RecognitionHistory.update(row.id,{text:raw.value});await renderHistory();});
    const remove=document.createElement('button'); remove.textContent='Usuń'; remove.onclick=()=>action(async()=>{await RecognitionHistory.remove(row.id);await renderHistory();});
    details.append(summary,rawLabel,save,remove);container.append(details);
  }
}
document.getElementById('export-history').onclick=()=>action(async()=>download(await reviewExamples(),'route-planner-history'));
document.getElementById('export-seeds').onclick=()=>action(async()=>{const response=await fetch('src/modules/recognition-history/examples.json');const data=await response.json();download(data.examples,'route-planner-synthetic-examples');});
document.getElementById('clear-history').onclick=()=>action(async()=>{if(confirm('Usunąć wszystkie lokalne przykłady i korekty?')) {await RecognitionHistory.clear();await renderHistory();}});
action(renderHistory);

async function reviewExamples() {
  // Earlier history entries were also collected exclusively from AI recognition clicks.
  return (await RecognitionHistory.list()).filter(row=>row.source === 'user').map(row=>({id:row.id,createdAt:row.createdAt,text:row.text,trigger:'recognize_ai_click'}));
}
document.getElementById('export-review').onclick=()=>action(async()=>download(await reviewExamples(),'route-planner-parser-review'));
document.getElementById('copy-review').onclick=()=>action(async()=>{
  const examples=await reviewExamples();
  await navigator.clipboard.writeText(JSON.stringify({schemaVersion:1,purpose:'Raw input examples collected on AI recognition clicks. Improve local route parsing; expected outputs are not supplied.',examples},null,2));
  historyStatus.textContent='Skopiowano zestawienie: '+examples.length+' przykładów. Możesz wkleić je do rozmowy.';
});
