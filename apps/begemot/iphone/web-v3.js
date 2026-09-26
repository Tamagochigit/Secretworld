'use strict';
(()=>{
 document.getElementById('archiveButton').addEventListener('click',()=>BegemotArchiveUI.archive());
 document.getElementById('memoryButton').addEventListener('click',()=>BegemotArchiveUI.settings());
 document.getElementById('moreArchive').addEventListener('click',()=>BegemotArchiveUI.archive());
 document.getElementById('moreMemory').addEventListener('click',()=>BegemotArchiveUI.settings());
})();
