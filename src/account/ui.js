import {accountClient,googleConfigured,accountError} from './firebase.js';
import {localLibrary} from './local.js';
import {courseDate} from './course.js';
export async function mountAccount(editor,{configured=googleConfigured,connect=accountClient}={}) {
  const account=document.createElement('div');account.className='account-controls';
  account.innerHTML='<span id="account-name"></span><button id="google-login" class="button secondary">Connexion Google</button><button id="google-logout" class="link" hidden>Se déconnecter</button>';
  document.querySelector('header .badge').replaceWith(account);
  const toolbar=document.createElement('div');toolbar.className='course-toolbar';
  toolbar.innerHTML='<label>Titre du cours<input id="course-title" maxlength="120" placeholder="Ex. Biologie — La photosynthèse"></label><button id="save-course" class="button secondary">Enregistrer sur cet appareil</button><p id="account-status" class="hint" role="status" aria-live="polite"></p>';
  document.querySelector('.workspace .panel').prepend(toolbar);
  const navigation=document.createElement('div');navigation.className='library-navigation';navigation.innerHTML='<button id="new-course" class="nav active">＋ Nouveau cours</button><button id="show-library" class="nav">▤ Mes cours</button>';
  document.querySelector('aside .nav').replaceWith(navigation);
  const dialog=document.createElement('dialog');dialog.className='library-dialog';
  dialog.innerHTML='<div class="library-header"><div><h2>Mes cours enregistrés</h2><p id="library-scope" class="hint"></p></div><button class="button secondary" id="close-library">Fermer</button></div><p id="library-status" class="hint" role="status"></p><div id="course-list"></div><div class="library-footer"><button id="refresh-library" class="button secondary">Actualiser</button><button id="more-courses" class="button secondary" hidden>Voir les suivants</button></div>';
  document.body.append(dialog);
  const $=selector=>document.querySelector(selector);
  let user=null,cloud=null,ready=!configured,pending=false,initializing=false,connecting=false,unsubscribe=null,currentId=null,currentOwner=null,epoch=0,cursor=null;
  const feedback=document.createElement('section');feedback.id='auth-feedback';feedback.hidden=true;
  feedback.innerHTML='<button id="close-auth-feedback" class="link" aria-label="Fermer le message de connexion">×</button><strong id="auth-feedback-title"></strong><p id="auth-feedback-text"></p>';
  feedback.setAttribute('aria-live','polite');document.querySelector('header').after(feedback);
  $('#close-auth-feedback').onclick=()=>{feedback.hidden=true;};
  const showAuth=(message,type='info')=>{
    feedback.hidden=false;feedback.dataset.type=type;feedback.setAttribute('role',type==='error'?'alert':'status');
    $('#auth-feedback-title').textContent=type==='error'?'Connexion Google impossible':type==='success'?'Connexion Google':'Connexion Google en cours';
    $('#auth-feedback-text').textContent=message;
  };
  const showAuthError=error=>{const message=accountError(error)+(error?.code?` [${error.code}]`:'');showAuth(message,'error');say(message);};
  const owner=()=>user?.uid||'device';
  const say=message=>{$('#account-status').textContent=message;};
  const update=()=>{
    $('#google-login').hidden=!!user;$('#google-login').disabled=initializing||pending||!ready;
    $('#google-login').setAttribute('aria-busy',String(initializing||connecting));
    $('#google-login').textContent=connecting?'Connexion en cours…':initializing||!ready?'Chargement de Google…':configured&&!cloud?'Réessayer Google':'Connexion Google';
    $('#account-name').textContent=user?(user.displayName||user.email||'Mon compte'):'';
    $('#google-logout').hidden=!user;$('#google-logout').disabled=pending;
    $('#save-course').textContent=user?'Enregistrer dans mon compte':'Enregistrer sur cet appareil';
    $('#save-course').disabled=!ready||pending||editor.isBusy()||!editor.snapshot().source.trim();
    $('#new-course').disabled=pending||editor.isBusy();
    $('#library-scope').textContent=user?'Cours privés synchronisés avec ton compte Google.':'Sur cet appareil uniquement. Ces cours ne sont pas synchronisés avec un compte Google. Effacer les données du navigateur les supprimera.';
    $('#more-courses').disabled=pending;
  };
  const resetCurrent=(clearTitle=true)=>{currentId=null;currentOwner=null;if(clearTitle)$('#course-title').value='';};
  const entries=(courses,append)=>{
    if(!append)$('#course-list').replaceChildren();
    for(const course of courses){
      const item=document.createElement('article');item.className='saved-course';
      const info=document.createElement('div'),title=document.createElement('h3'),date=document.createElement('p');title.textContent=course.title;date.textContent=`Modifié le ${courseDate(course.updatedAt)}`;info.append(title,date);
      const open=document.createElement('button');open.className='button secondary';open.textContent='Ouvrir';
      open.onclick=()=>run(async(token)=>{
        if(editor.isBusy())throw Error('Termine ou annule le traitement en cours avant d’ouvrir un autre cours.');
        const value=user?await cloud.get(user.uid,course.id):await localLibrary.get(course.id);if(token!==epoch)return;
        editor.open(value);currentId=value.id;currentOwner=owner();$('#course-title').value=value.title;dialog.close();say('Cours restauré : texte, révisions et carte mentale.');
      });
      const remove=document.createElement('button');remove.className='link delete-course';remove.textContent='Supprimer';
      remove.onclick=()=>{if(confirm(`Supprimer définitivement « ${course.title} » ?`))run(async(token)=>{if(user)await cloud.remove(user.uid,course.id);else await localLibrary.remove(course.id);if(token!==epoch)return;if(currentId===course.id)resetCurrent();await load(false,token);say('Cours supprimé.');});};
      item.append(info,open,remove);$('#course-list').append(item);
    }
  };
  async function load(append=false,token=epoch){
    $('#library-status').textContent='Chargement des cours…';
    if(!append)cursor=null;
    const result=user?await cloud.list(user.uid,append?cursor:null):{courses:await localLibrary.list(),more:false,cursor:null};
    if(token!==epoch)return;
    cursor=result.cursor;entries(result.courses,append);$('#more-courses').hidden=!result.more;
    $('#library-status').textContent=$('#course-list').children.length?'':'Aucun cours enregistré pour le moment.';
  }
  async function run(action){
    if(pending||!ready)return;pending=true;update();const token=epoch;
    try{await action(token);}catch(error){if(token===epoch){const message=accountError(error);say(message);if(dialog.open)$('#library-status').textContent=message;}}
    finally{pending=false;update();}
  }
  $('#save-course').onclick=()=>run(async(token)=>{
    if(editor.isBusy())throw Error('Attends la fin du traitement avant d’enregistrer.');
    const snapshot=editor.snapshot();const title=$('#course-title').value.trim();
    const payload={...snapshot,title};
    const id=currentOwner===owner()?currentId:null;
    const saved=user?await cloud.save(user.uid,payload,id):await localLibrary.save(payload,id);
    if(token!==epoch)return;currentId=saved.id;currentOwner=owner();$('#course-title').value=saved.title;
    say(user?'Cours enregistré dans ton compte Google.':'Cours enregistré sur cet appareil. Il reste disponible après fermeture de la page.');
  });
  $('#new-course').onclick=()=>{if(editor.isBusy()||pending)return;if(editor.snapshot().source.trim()&&!confirm('Créer un nouveau cours ? Les modifications non enregistrées du cours actuel seront perdues.'))return;editor.clear();resetCurrent();say('Nouveau cours.');update();};
  $('#show-library').onclick=()=>{if(!ready)return;dialog.showModal();run(token=>load(false,token));};
  $('#close-library').onclick=()=>dialog.close();dialog.onclick=event=>{if(event.target===dialog)dialog.close();};
  $('#refresh-library').onclick=()=>run(token=>load(false,token));$('#more-courses').onclick=()=>run(token=>load(true,token));
  $('#google-login').onclick=async()=>{
    if(!configured){showAuth('La connexion Google n’est pas configurée dans cette version. Actualise la page pour charger la dernière version de Déclic.','error');return;}
    if(pending||initializing)return;
    if(!cloud){await initializeCloud(false);return;}
    if(editor.isBusy()){showAuth('Termine ou annule le traitement du cours avant de te connecter.','error');return;}
    pending=true;connecting=true;update();showAuth('La fenêtre Google va s’ouvrir. Choisis ton compte pour continuer.');
    try{await cloud.login();showAuth(cloud.temporarySession?'Tu es connecté. Ce navigateur ne conserve pas la connexion après fermeture ; tes cours restent dans ton compte Google.':'Tu es connecté à ton compte Google.','success');}
    catch(error){showAuthError(error);}
    finally{pending=false;connecting=false;update();}
  };
  $('#google-logout').onclick=()=>run(async()=>{
    try{if(editor.isBusy())throw Error('Termine ou annule le traitement en cours avant de te déconnecter.');await cloud.logout();showAuth('Tu es déconnecté. Les cours de ton compte sont masqués.','success');}
    catch(error){showAuthError(error);throw error;}
  });
  document.addEventListener('declic-contentchange',update);$('#course-title').oninput=update;
  if(!configured)say('La connexion Google sera bientôt activée. Tu peux déjà enregistrer tes cours sur cet appareil.');
  update();
  async function initializeCloud(silent=true){
    if(initializing||!configured)return;
    initializing=true;ready=false;update();
    if(!silent)showAuth('Préparation de la connexion Google…');
    let timer;
    try{
      cloud=await Promise.race([connect(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Le chargement de Google prend trop de temps. Vérifie ta connexion et clique sur Réessayer Google.')),20000);})]);
      unsubscribe?.();
      unsubscribe=cloud.listen(value=>{
        const previous=user?.uid;
        epoch++;user=value;ready=true;cursor=null;
        if(previous&&previous!==value?.uid){editor.clear();resetCurrent();dialog.close();}
        else if(currentOwner&&currentOwner!==owner())resetCurrent(false);
        $('#course-list').replaceChildren();$('#more-courses').hidden=true;
        say(user?'Connecté. Les prochains enregistrements seront sauvegardés dans ton compte. Tes cours locaux restent sur cet appareil.':'Déconnecté. Les cours de ton compte sont masqués.');update();
        if(dialog.open)run(token=>load(false,token));
      },error=>{ready=true;cloud=null;showAuthError(error);update();});
      if(!silent)showAuth('La connexion est prête. Clique à nouveau sur Connexion Google pour ouvrir la fenêtre.');
    }catch(error){ready=true;cloud=null;showAuthError(error);}
    finally{clearTimeout(timer);initializing=false;update();}
  }
  if(configured)await initializeCloud();
}
