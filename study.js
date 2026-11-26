// Each entry contains the USCIS question number, prompt, accepted answers, and quiz distractors.
const deck = [
 [2,'What is the supreme law of the land?',['The U.S. Constitution'],['The Declaration of Independence','The Articles of Confederation']],
 [5,'How are changes made to the U.S. Constitution?',['Amendments','The amendment process'],['Executive orders','Presidential pardons']],
 [7,'How many amendments does the U.S. Constitution have?',['27'],['10','50']],
 [9,'What founding document said the American colonies were free from Britain?',['Declaration of Independence'],['The Mayflower Compact','The Bill of Rights']],
 [17,'The President of the United States is in charge of which branch of government?',['Executive branch'],['Legislative branch','Judicial branch']],
 [19,'What are the two parts of the U.S. Congress?',['Senate and House of Representatives'],['Senate and Supreme Court','House of Representatives and Cabinet']],
 [21,'How many U.S. senators are there?',['100'],['50','435']],
 [22,'How long is a term for a U.S. senator?',['6 years'],['2 years','4 years']],
 [24,'How many voting members are in the House of Representatives?',['435'],['100','538']],
 [27,'How many senators does each state have?',['2'],['1','4']]
];
const key = 'civics-practice-v1';
const ids = deck.map(row => row[0]);
function shuffle(items) {
 const copy = [...items];
 for (let i = copy.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [copy[i], copy[j]] = [copy[j], copy[i]];
 }
 return copy;
}
const modes = ['Flashcards','Random quiz','Review'];
const state = { mode:modes[0], marks:{}, sessions:{} };
try { Object.assign(state, JSON.parse(localStorage.getItem(key)) || {}); } catch {}
function save() {
 try { localStorage.setItem(key,JSON.stringify(state)); }
 catch { document.querySelector('#storage').textContent = 'Storage is unavailable. Progress lasts for this visit.'; }
}
function start(mode,questions) {
 state.sessions[mode] = {order:questions,index:0,revealed:false,choices:[],picked:null,score:0,missed:[]};
}
function element(tag,message,parent) {
 const el = document.createElement(tag);
 el.textContent = message;
 parent.append(el);
 return el;
}
function button(parent,label,action,style='') {
 const el = element('button',label,parent);
 el.className = style;
 el.onclick = () => { action(); render(); };
 return el;
}
function render() {
 const nav = document.querySelector('nav');
 const card = document.querySelector('#card');
 nav.replaceChildren(); card.replaceChildren();
 for (const mode of modes) {
  button(nav,mode,() => { state.mode = mode; }).setAttribute('aria-pressed',String(mode===state.mode));
 }
 const review = ids.filter(id => state.marks[id]==='again');
 const known = ids.filter(id => state.marks[id]==='known');
 document.querySelector('#summary').textContent = known.length+' of 10 learned · '+review.length+' to review';
 const mode = state.mode;
 if (!state.sessions[mode] && mode===modes[0]) start(mode,[...ids]);
 const session = state.sessions[mode];
 const quiz = mode===modes[1];
 if (!session || session.index>=session.order.length) {
  const label = session ? (quiz ? 'Quiz complete' : 'Round complete') : mode;
  element('h2',label,card);
  if (quiz) {
   if (session) element('p','You answered '+session.score+' of '+session.order.length+' correctly.',card);
   else element('p','Choose a round length. Questions are shuffled each time.',card);
   const actions = element('div','',card); actions.className='actions';
   if (session?.missed.length) button(actions,'Retry missed ('+session.missed.length+')',()=>start(mode,shuffle(session.missed)),'primary');
   for (const n of [5,10]) button(actions,n+' questions',()=>start(mode,shuffle(ids).slice(0,n)));
  } else if (mode===modes[2]) {
   element('p',review.length ? review.length+' cards are ready to practice.' : 'Cards marked “Practice again” and missed quiz questions appear here.',card);
   if (review.length) button(card,'Practice review cards',()=>start(mode,shuffle(review)),'primary');
  } else button(card,'Shuffle and study again',()=>start(mode,shuffle(ids)),'primary');
  save(); return;
 }
 const id = session.order[session.index];
 const [,prompt,answers,distractors] = deck.find(row=>row[0]===id);
 element('div',mode+' · '+(session.index+1)+' of '+session.order.length,card).className='meta';
 const bar=element('progress','',card); bar.max=session.order.length; bar.value=session.index; bar.setAttribute('aria-label','Questions completed');
 element('h2',prompt,card);
 function advance() {
  session.index++; session.revealed=false; session.choices=[]; session.picked=null;
 }
 if (quiz) {
  if (!session.choices.length) session.choices=shuffle([answers[0],...distractors]);
  const choices=element('div','',card); choices.className='choices';
  for (const choice of session.choices) {
   const picked=session.picked!==null;
   const option=button(choices,choice,()=>{
    session.picked=choice;
    if(choice===answers[0]) { session.score++; }
    else { session.missed.push(id); state.marks[id]='again'; }
   },picked&&choice===answers[0]?'correct':picked&&choice===session.picked?'wrong':'');
   option.disabled=picked;
  }
  if(session.picked!==null) {
   element('p',session.picked===answers[0]?'Correct.':'Correct answer: '+answers[0],card);
   button(card,session.index+1===session.order.length?'See result':'Next question',advance,'primary');
  }
 } else if (!session.revealed) {
  button(card,'Show answer',()=>{session.revealed=true;},'primary');
 } else {
  element('div',answers.join(' / '),card).className='answer';
  const actions=element('div','',card); actions.className='actions';
  button(actions,'Got it',()=>{state.marks[id]='known';advance();},'primary');
  button(actions,'Practice again',()=>{state.marks[id]='again';advance();});
 }
 save();
}
render();
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
 navigator.serviceWorker.register('./sw.js').catch(()=>{document.querySelector('#storage').textContent='Offline mode could not start. Reopen while online to retry.';});
}
