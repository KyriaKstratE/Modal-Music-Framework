(() => {
  const desk = document.getElementById('modal-writing-desk');
  const field = name => desk.querySelector('[data-field="'+name+'"]');
  const part = name => desk.querySelector('[data-part="'+name+'"]');
  const action = name => desk.querySelector('[data-action="'+name+'"]');
  const keys = ['C','D♭','D','E♭','E','F','F♯','G♭','G','A♭','A','B♭','B','C♯','C♭'];
  const fifths = [
    ['C','#cdebe0'], ['G','#ffe1b8'], ['D','#cddbf8'], ['A','#f5cdd7'],
    ['E','#dcebbf'], ['B','#decff3'], ['F♯','#f6edb5'], ['D♭','#bfe6e9'],
    ['A♭','#eccdb9'], ['E♭','#cecfee'], ['B♭','#efcde8'], ['F','#bcdff5']
  ];
  const scaleFamilies = {
    major: {
      label:'Major',
      intervals:[0,2,4,5,7,9,11],
      modes:['Ionian','Dorian','Phrygian','Lydian','Mixolydian','Aeolian','Locrian']
    },
    harmonicMinor: {
      label:'Harmonic minor',
      intervals:[0,2,3,5,7,8,11],
      modes:['Harmonic minor','Locrian ♮6','Ionian ♯5','Dorian ♯4','Phrygian dominant','Lydian ♯2','Ultralocrian']
    },
    melodicMinor: {
      label:'Melodic minor',
      intervals:[0,2,3,5,7,9,11],
      modes:['Melodic minor','Dorian ♭2','Lydian augmented','Lydian dominant','Mixolydian ♭6','Locrian ♮2','Altered']
    }
  };
  const major = scaleFamilies.major.intervals;
  const letters = 'CDEFGAB';
  const roman = ['I','II','III','IV','V','VI','VII'];
  const inversionNames = ['Root position','First inversion','Second inversion','Third inversion'];
  const minOctaveShift = -2, maxOctaveShift = 2;
  const voicingControlLabels = {
    octave: {label:'Octave', decrease:['↓','Lower one octave'], increase:['↑','Raise one octave']},
    inversion: {label:'Inversion', decrease:['←','Previous inversion'], increase:['→','Next inversion']}
  };
  const draftKey = 'modal-workbench-draft';
  const qualities = {
    '0,4,7':'','0,3,7':'m','0,3,6':'°','0,4,8':'+',
    '0,4,7,11':'maj7','0,3,7,10':'m7','0,4,7,10':'7','0,3,6,10':'ø7',
    '0,3,7,11':'m(maj7)','0,4,8,11':'maj7♯5','0,4,8,10':'7♯5',
    '0,3,6,9':'°7','0,3,6,11':'°(maj7)'
  };
  const compactWheelSuffixes = {'m(maj7)':'mM7','maj7♯5':'+M7'};
  const blackKeys = new Set([1,3,6,8,10]);
  const chromaticNames = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
  const extensionDegrees = [[1,9],[3,11],[5,13]];
  const eightBarExample = [
    [['C','r',0,0,3],null],
    [['C','r',0,3,3],null],
    [['C','p',5,3,3],['F',5,'single']],
    [['C','r',0,0,3],null],
    [['A','p',5,0,3],null],
    [['A','p',5,3,4],null],
    [['A','p',5,6,3],null],
    [['A','p',5,0,3],null]
  ];
  const modulo = (n,m) => ((n%m)+m)%m;
  const accidental = n => n<0?'♭'.repeat(-n):'♯'.repeat(n);
  function spelledPitch(note) {
    const alter = [...note.slice(1)].reduce((n,s) => n+(s==='♯'?1:-1),0);
    return major[letters.indexOf(note[0])]+alter;
  }
  const pitch = note => modulo(spelledPitch(note),12);
  const sectors = new Map(fifths.map(([name,color],index) => [pitch(name),{index,color}]));
  const sectorFor = note => sectors.get(pitch(note));

  function placeOnWheel(button, sector, radius) {
    const angle = sector * Math.PI / 6;
    button.style.setProperty('--wheel-x', (50 + radius * Math.sin(angle)) + '%');
    button.style.setProperty('--wheel-y', (50 - radius * Math.cos(angle)) + '%');
  }
  function buildWheel() {
    const wedges = fifths.map(([,color],i) => color+' '+(i*30)+'deg '+((i+1)*30)+'deg');
    const seams = 'repeating-conic-gradient(from -15deg, var(--mw-paper) 0deg .55deg, transparent .55deg 30deg)';
    part('wheel').style.setProperty('--wheel-fill',seams+', conic-gradient(from -15deg, '+wedges.join(',')+')');
    const buttons = fifths.map(([name],i) => {
      const button = document.createElement('button');
      button.type='button';button.className='mw-wheel-key';button.dataset.key=name;
      placeOnWheel(button,i,41.5);
      return button;
    });
    part('wheel-keys').replaceChildren(...buttons);
  }
  function spell(letter,pitchClass) {
    const difference=modulo(pitchClass-major[letter]+6,12)-6;
    return letters[letter]+accidental(difference);
  }
  function scale(tonic,mode,family='major') {
    const {intervals}=scaleFamilies[family];
    return intervals.map((_,d) => {
      const delta=modulo(intervals[(d+mode)%7]-intervals[mode],12);
      return spell((letters.indexOf(tonic[0])+d)%7,pitch(tonic)+delta);
    });
  }
  function keyName([tonic,mode,,family='major']) {
    return tonic+' '+scaleFamilies[family].modes[mode];
  }
  function parentScale([tonic,mode,,family='major']) {
    const parentLetter=modulo(letters.indexOf(tonic[0])-mode,7);
    const parentPitch=pitch(tonic)-scaleFamilies[family].intervals[mode];
    return [spell(parentLetter,parentPitch),0,'single',family];
  }
  function parentScaleTint(key) {
    const [tonic,,,family]=parentScale(key);
    const familyIndex=Object.keys(scaleFamilies).indexOf(family);
    const index=familyIndex*12+pitch(tonic);
    const hue=modulo(352+index*137.508,360);
    const lightness=83+(index%3)*2;
    return 'hsl('+hue+' 66% '+lightness+'%)';
  }
  function keyNotes([tonic,mode,,family='major']) {
    return scale(tonic,mode,family);
  }
  function keyPitches(key) {
    return new Set(keyNotes(key).map(pitch));
  }
  function chord(seed) {
    const [key,view,mode,degree,size,family='major']=seed;
    const tonic=view==='r'?scale(key,0,family)[mode]:key;
    const notes=scale(tonic,mode,family);
    const names=Array.from({length:size},(_,i) => notes[(degree+2*i)%7]);
    const pcs=names.map(pitch);
    const intervals=pcs.map(pc => modulo(pc-pcs[0],12));
    const suffix=qualities[intervals.join(',')];
    return {seed,tonic,mode,degree,names,pcs,suffix,symbol:names[0]+suffix,midi:intervals.map(n=>48+pcs[0]+n)};
  }
  function rootMidi(bar) {
    return bar.ch.midi[0]+12*(bar.octave ?? 0);
  }
  function coreVoicing(bar) {
    const {ch, octave = 0, inversion = 0} = bar;
    return ch.midi.map((_, index) => {
      const position = index + inversion;
      const tone = position % ch.midi.length;
      return {
        name: ch.names[tone],
        midi: ch.midi[tone] + 12 * (octave + Math.floor(position / ch.midi.length))
      };
    });
  }
  function chordHarmony(bar) {
    const {ch,added}=bar;
    if(ch.pcs.length!==3||!added?.length)return ch;
    const root=ch.pcs[0];
    const intervals=ch.pcs.map(pc=>modulo(pc-root,12));
    const possibleSevenths=new Map();
    for(const [offset] of added){
      const step=modulo(offset,12);
      if(step<10&&(step!==9||ch.suffix!=='°'))continue;
      const suffix=qualities[[...intervals,step].join(',')];
      if(suffix)possibleSevenths.set(step,suffix);
    }
    if(possibleSevenths.size!==1)return ch;
    const [step,suffix]=possibleSevenths.entries().next().value;
    const pc=modulo(root+step,12);
    const seventh=spell((letters.indexOf(ch.names[0][0])+6)%7,pc);
    return {...ch,suffix,symbol:ch.names[0]+suffix,pcs:[...ch.pcs,pc],seventh};
  }
  function voicing(bar,harmony=chordHarmony(bar)) {
    const tones=coreVoicing(bar);
    const corePitches=new Set(tones.map(note=>note.midi));
    for(const [offset,name] of bar.added ?? []){
      const midi=rootMidi(bar)+offset;
      if(!corePitches.has(midi)){
        const spelling=harmony.seventh&&pitch(harmony.seventh)===modulo(midi,12)?harmony.seventh:name;
        tones.push({name:spelling,midi});
      }
    }
    return tones.sort((a,b)=>a.midi-b.midi);
  }
  function barSymbol(bar) {
    const harmony=chordHarmony(bar);
    const root=harmony.names[0];
    const addedNames=new Set();
    for(const [offset,name] of bar.added ?? []){
      if(harmony.pcs.includes(pitch(name)))continue;
      const degree=modulo(letters.indexOf(name[0])-letters.indexOf(root[0]),7);
      const extension=extensionDegrees.find(([step])=>step===degree);
      const alteration=offset-12-major[degree];
      const label=offset>=12&&extension&&Math.abs(alteration)<=2?accidental(alteration)+extension[1]:name;
      addedNames.add('add'+label);
    }
    const bass=voicing(bar,harmony)[0].name;
    const additions=addedNames.size?'('+[...addedNames].join(', ')+')':'';
    return harmony.symbol+additions+(pitch(bass)===pitch(root)?'':'/'+bass);
  }
  function noteWithOctave({name,midi}) {
    return name + ((midi - spelledPitch(name)) / 12 - 1);
  }
  function numeral(ch,tonic,showQuality=true) {
    const degree=modulo(letters.indexOf(ch.names[0][0])-letters.indexOf(tonic[0]),7);
    const alter=modulo(ch.pcs[0]-pitch(tonic)-major[degree]+6,12)-6;
    const minor=ch.suffix.startsWith('m')&&!ch.suffix.startsWith('maj');
    const diminished=ch.suffix.startsWith('°')||ch.suffix.startsWith('ø');
    const base=minor||diminished?roman[degree].toLowerCase():roman[degree];
    const tail=minor?ch.suffix.slice(1):ch.suffix;
    return accidental(alter)+base+(showQuality?tail:'');
  }
  function outsideNotes(names, scalePitches) {
    return [...new Set(names.filter(name=>!scalePitches.has(pitch(name))))];
  }
  function scaleFitsAddedNotes(bar,key) {
    const pitches=keyPitches(key);
    return (bar.added??[]).every(([,name])=>pitches.has(pitch(name)));
  }
  function rotationForRoot(key, root) {
    const [,mode,,family='major']=key;
    const degree=keyNotes(key).findIndex(name=>pitch(name)===pitch(root));
    return degree<0?null:[root,(mode+degree)%7,'single',family];
  }
  function scaleIdeasForBar(bar,next,key,passagePitches) {
    const harmony=chordHarmony(bar);
    const root=harmony.names[0];
    const soundingNames=voicing(bar,harmony).map(note=>note.name);
    const ideas=[];
    const addIdea=(scale,description='',allowOutside=false)=>{
      if(!scale)return;
      const name=keyName(scale);
      if(ideas.some(idea=>idea.name===name))return;
      const outside=outsideNotes(soundingNames,keyPitches(scale));
      if(allowOutside||!outside.length)ideas.push({scale,name,outside,description});
    };
    addIdea(bar.preferredScale,'Your scale choice for this chord.',true);
    if(isChordLabel(bar.mark)&&scaleFitsAddedNotes(bar,bar.mark)){
      addIdea(bar.mark,'Your chord mode label.',true);
    }
    const target=next&&chordHarmony(next);
    const targetThird=target&&target.midi[1]-target.midi[0];
    const resolves=target&&['','7'].includes(harmony.suffix)&&
      modulo(pitch(root)-target.pcs[0],12)===7&&target.midi[2]-target.midi[0]===7&&[3,4].includes(targetThird);
    const chromaticDominant=harmony.pcs.some(pc=>!passagePitches.has(pc));
    const applied=resolves&&chromaticDominant&&pitch(target.names[0])!==pitch(key[0])&&
      target.pcs.every(pc=>passagePitches.has(pc))&&(!next.mark||isChordLabel(next.mark));
    const functionLabel=applied?(harmony.suffix==='7'?'V7':'V')+'/'+numeral(target,key[0],false):'';
    if(resolves&&targetThird===3){
      addIdea([root,4,'single','harmonicMinor'],'From '+target.names[0]+' harmonic minor. Leads to '+target.symbol+'.');
      const altered=[root,6,'single','melodicMinor'];
      if(harmony.suffix==='7'&&scaleFitsAddedNotes(bar,altered)){
        addIdea(altered,'More tension before '+target.symbol+'.',true);
      }
    }else if(applied){
      addIdea([root,4,'single','major'],'Dominant resolving to '+target.symbol+'.');
    }
    addIdea(rotationForRoot(key,root));
    const targetPitches=new Set(next?voicing(next).map(note=>pitch(note.name)):[]);
    const candidates=[];
    for(const [family,{modes}] of Object.entries(scaleFamilies)){
      for(const mode of modes.keys()){
        const choice=[root,mode,'single',family];
        const pc=keyPitches(choice);
        const score=[...pc].reduce((total,n)=>total+Number(passagePitches.has(n))+2*Number(targetPitches.has(n)),0);
        candidates.push({choice,score});
      }
    }
    candidates.sort((a,b)=>b.score-a.score);
    for(const {choice} of candidates){
      addIdea(choice);
    }
    return {ideas,functionLabel,target:applied?target.symbol:''};
  }
  for(const name of ['key','mark-key']){
    field(name).replaceChildren(...keys.map(key=>new Option(key,key)));
  }
  for(const name of ['scale','mark-scale']){
    field(name).replaceChildren(...Object.entries(scaleFamilies).map(([id,{label}])=>new Option(label,id)));
  }
  let selectedSeed=['C','r',0,0,3], bars=[], selectedId=null, nextId=1, activeKeys=[], barIdeas=[];
  let layout='circle';
  let drag=null, suppressClick=false, ctx=null, transport=null, frame=0, soundVersion=0;
  const voices=new Set(), melodyVoices=new Set();
  const validKey=k=>keys.includes(k);
  const integer=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
  const validFamily=family=>Object.hasOwn(scaleFamilies,family);
  const validNote=name=>typeof name==='string'&&/^[A-G](?:♯{1,4}|♭{1,4})?$/.test(name);
  const validPreferredScale=scale=>Array.isArray(scale)&&(scale.length===3||scale.length===4)&&
    validNote(scale[0])&&integer(scale[1],0,6)&&scale[2]==='single'&&(scale.length===3||validFamily(scale[3]));
  const validSeed=s=>Array.isArray(s)&&(s.length===5||(s.length===6&&validFamily(s[5])))&&validKey(s[0])&&['r','p'].includes(s[1])&&integer(s[2],0,6)&&integer(s[3],0,6)&&[3,4].includes(s[4]);
  const isChordLabel=mark=>mark?.[2]==='single';
  const validMark=m=>Array.isArray(m)&&validKey(m[0])&&integer(m[1],0,6)&&(
    m.length===2||(m.length===3&&isChordLabel(m))||
    (m.length===4&&['span','single'].includes(m[2])&&validFamily(m[3]))
  );
  function draft() {
    return {
      v:1, seed:selectedSeed, tempo:Number(field('bpm').value),
      bars:bars.map(b=>{
        const data=[b.ch.seed,b.mark,b.octave ?? 0,b.inversion ?? 0];
        if(b.added?.length||b.preferredScale)data.push(b.added??[]);
        if(b.preferredScale)data.push(b.preferredScale);
        return data;
      }),
      index:currentIndex(), layout
    };
  }
  function save() {
    const snapshot={modelContent:{bars:bars.length},privateContent:draft()};
    if (window.openai?.setWidgetState) {
      if (JSON.stringify(snapshot).length < 7500) window.openai.setWidgetState(snapshot)?.catch(()=>{});
      return;
    }
    try { localStorage.setItem(draftKey, JSON.stringify(snapshot)); } catch {}
  }
  function loadDraft() {
    if (window.openai) return window.openai.widgetState;
    try { return JSON.parse(localStorage.getItem(draftKey)); } catch { return null; }
  }
  function restore(snapshot) {
    const data=snapshot?.privateContent;
    if(data?.v!==1||!validSeed(data.seed)||!Array.isArray(data.bars)||!integer(data.tempo,40,240))return;
    if(!data.bars.every(b=>Array.isArray(b)&&validSeed(b[0])&&(b[1]===null||validMark(b[1]))))return;
    const restoredLayout=data.layout==='table'?'table':'circle';
    // Earlier copies of this exact example had an automatic A Aeolian marker.
    const oldExample=data.bars.length===eightBarExample.length&&data.bars.every(([seed,mark],index)=>{
      const [expectedSeed,expectedMark]=eightBarExample[index];
      return JSON.stringify(seed)===JSON.stringify(expectedSeed)&&
        JSON.stringify(mark)===JSON.stringify(index===4?['A',5]:expectedMark);
    });
    const restoredBars=oldExample?data.bars.map(([seed,mark,...voicing],index)=>[seed,index===4?null:mark,...voicing]):data.bars;
    if(JSON.stringify({...data,bars:restoredBars,layout:restoredLayout})===JSON.stringify(draft()))return;
    part('chord-settings').close();
    stop();layout=restoredLayout;selectedSeed=data.seed.slice();field('bpm').value=data.tempo;
    bars=restoredBars.map(([seed,mark,octave,inversion,added,preferredScale])=>{
      const ch=chord(seed);
      const start=blackKeys.has(ch.pcs[0])?-1:0;
      const validAdded=new Map();
      for(const entry of Array.isArray(added)?added:[]){
        if(!Array.isArray(entry))continue;
        const [offset,name]=entry;
        if(integer(offset,start,start+23)&&validNote(name)
          &&pitch(name)===modulo(ch.pcs[0]+offset,12))validAdded.set(offset,name);
      }
      return {
        id:nextId++,ch,mark,added:[...validAdded].sort((a,b)=>a[0]-b[0]),
        preferredScale:validPreferredScale(preferredScale)?preferredScale:null,
        octave:integer(octave,minOctaveShift,maxOctaveShift)?octave:0,
        inversion:integer(inversion,0,seed[4]-1)?inversion:0
      };
    });
    selectedId=bars[data.index]?.id??null;
    renderLibrary();renderBars();
  }
  function chordTile(ch,onWheel=false) {
    const button=document.createElement('button'),label=document.createElement('small');
    const rn=numeral(ch,ch.tonic);
    button.className='mw-tile';button.type='button';
    button.dataset.mode=ch.mode;button.dataset.degree=ch.degree;
    button.setAttribute('aria-label','Audition '+ch.symbol+', '+rn+', '+ch.names.join(' '));
    button.setAttribute('aria-pressed',ch.mode===selectedSeed[2]&&ch.degree===selectedSeed[3]);
    const symbol=document.createElement('span');
    symbol.className='mw-tile-symbol';
    symbol.append(ch.names[0],document.createElement('wbr'),ch.suffix);
    label.textContent=onWheel?numeral(ch,ch.tonic,false):rn;
    button.append(symbol);
    const compactSuffix=onWheel&&compactWheelSuffixes[ch.suffix];
    if(compactSuffix){
      const compact=document.createElement('span');
      compact.className='mw-wheel-compact-symbol';
      compact.append(ch.names[0],document.createElement('wbr'),compactSuffix);
      button.classList.add('has-compact-symbol');
      button.append(compact);
    }
    button.append(label);
    return button;
  }
  function renderTable() {
    const [key,view,,,size,family='major']=selectedSeed;
    const parentScale=scale(key,0,family);
    const rows=scaleFamilies[family].modes.map((modeName,mode)=>{
      const tr=document.createElement('tr'), th=document.createElement('th');
      const tonic=view==='r'?parentScale[mode]:key;
      const dot=document.createElement('span');
      dot.className='mw-dot';dot.style.setProperty('--key-color',sectorFor(tonic).color);
      th.scope='row';th.append(dot,tonic+' '+modeName);tr.append(th);
      for(let degree=0;degree<7;degree++){
        const ch=chord([key,view,mode,degree,size,family]);
        const td=document.createElement('td');
        td.append(chordTile(ch));tr.append(td);
      }
      return tr;
    });
    part('matrix').replaceChildren(...rows);
  }
  function renderCircle() {
    const [key,view,mode,,size,family='major']=selectedSeed;
    const {modes}=scaleFamilies[family];
    const parentScale=scale(key,0,family);
    const tonic=view==='r'?parentScale[mode]:key;
    const notes=scale(tonic,mode,family);
    for(const button of part('wheel-keys').children){
      const selected=pitch(button.dataset.key)===pitch(key);
      const name=selected?key:button.dataset.key;
      button.textContent=name;button.setAttribute('aria-label','Choose '+name);
      button.setAttribute('aria-pressed',selected);
    }
    field('wheel-mode').replaceChildren(...modes.map((name,i)=>new Option((view==='r'?parentScale[i]:key)+' '+name,i)));
    field('wheel-mode').value=mode;
    part('scale-notes').textContent=notes.join(' ');
    part('hub-tonic').textContent=tonic;part('hub-mode').textContent=modes[mode];
    const tiles=notes.map((note,degree)=>{
      const ch=chord([key,view,mode,degree,size,family]);
      const tile=chordTile(ch,true);
      tile.classList.add('mw-wheel-note');
      tile.classList.toggle('long-symbol',ch.symbol.length>5);
      placeOnWheel(tile,sectorFor(note).index,27);
      return tile;
    });
    part('wheel-chords').replaceChildren(...tiles);
  }
  function renderLibrary() {
    const [key,view,,,size,family='major']=selectedSeed;
    field('key').value=key;field('view').value=view;field('size').value=size;field('scale').value=family;
    part('key-label').textContent=view==='r'?'Parent tonic':'Shared tonic';
    const circle=layout==='circle';
    part('library').classList.toggle('circle',circle);
    part('table').hidden=circle;part('circle').hidden=!circle;part('wheel-context').hidden=!circle;
    for(const button of desk.querySelectorAll('button[data-layout]')){
      button.setAttribute('aria-pressed',button.dataset.layout===layout);
    }
    if(circle){part('matrix').replaceChildren();renderCircle()}
    else{part('wheel-chords').replaceChildren();renderTable()}
    renderChoice();
  }
  function renderChoice() {
    const ch=chord(selectedSeed);
    part('choice').textContent=ch.symbol+' · '+ch.names.join(' ');
  }
  function currentIndex(){return bars.findIndex(b=>b.id===selectedId)}
  function voicingControls(bar, setting, min, max) {
    const {label,decrease,increase}=voicingControlLabels[setting];
    const value=bar[setting] ?? 0;
    const group=document.createElement('div');
    group.className='mw-voice-pair';
    group.setAttribute('role','group');
    group.setAttribute('aria-label',label);
    const caption=document.createElement('span');
    caption.textContent=label;
    caption.setAttribute('aria-hidden','true');
    group.append(caption);
    for(const [[arrow,description],step] of [[decrease,-1],[increase,1]]){
      const button=document.createElement('button');
      button.type='button';
      button.textContent=arrow;
      button.title=description;
      button.setAttribute('aria-label',description);
      button.dataset.voicing=setting;
      button.dataset.step=step;
      button.disabled=!integer(value+step,min,max);
      group.append(button);
    }
    return group;
  }
  function renderBars() {
    let key=['C',0];
    let scalePitches=keyPitches(key);
    activeKeys=[];barIdeas=[];
    const outsideByBar=[];
    part('track').replaceChildren(...bars.map((b,i)=>{
      const chordLabel=isChordLabel(b.mark);
      if(b.mark&&!chordLabel){
        key=b.mark;
        scalePitches=keyPitches(key);
      }
      activeKeys.push(key);
      const outside=outsideNotes(voicing(b).map(note=>note.name),scalePitches);
      outsideByBar.push(outside);
      const analysis=scaleIdeasForBar(b,bars[i+1],key,scalePitches);
      barIdeas.push(analysis);
      const card=document.createElement('div');
      card.className='mw-bar';card.dataset.id=b.id;
      card.dataset.selected=b.id===selectedId;
      const button=document.createElement('button'), lane=document.createElement('span'),name=document.createElement('strong'),bass=document.createElement('small');
      button.type='button';button.className='mw-bar-play';
      button.setAttribute('aria-pressed',b.id===selectedId);
      lane.className='mw-key-slot';
      let modeLabel='';
      if(i===0||b.mark){
        modeLabel=keyName(b.mark ?? key);
        const scope=document.createElement('span');
        scope.className='mw-marker-scope';
        scope.textContent=chordLabel?'Chord mode · ':'Passage key · ';
        const heading=document.createElement('span');
        heading.className='mw-key';
        heading.textContent=modeLabel;
        lane.append(scope,heading);
      }
      const idea=analysis.ideas[0];
      const usesDifferentCollection=idea&&[...keyPitches(idea.scale)].some(pc=>!scalePitches.has(pc));
      const tintScale=usesDifferentCollection&&(outside.length||b.preferredScale||chordLabel);
      const passageColor=sectorFor(key[0]).color;
      const barColor=tintScale?parentScaleTint(idea.scale):outside.length?'#e6e2eb':passageColor;
      card.style.setProperty('--bar-color',barColor);
      name.textContent=barSymbol(b);
      bass.className='mw-bass';
      bass.textContent='Bass '+noteWithOctave(voicing(b)[0]);
      let description='Audition bar '+(i+1)+', '+name.textContent+', '+inversionNames[b.inversion ?? 0]+', '+bass.textContent+', '+keyName(key);
      if(chordLabel)description+=', chord label '+modeLabel;
      else if(b.mark)description+=', key marker';
      button.append(lane);
      if(analysis.ideas.length&&(!chordLabel||analysis.ideas[0].name!==modeLabel)){
        const suggestion=document.createElement('small');
        suggestion.className='mw-bar-scale';
        suggestion.textContent='Try '+analysis.ideas[0].name;
        button.append(suggestion);
        description+=', '+suggestion.textContent;
      }
      button.append(name,bass);
      if(analysis.functionLabel){
        const resolution=document.createElement('small');
        resolution.textContent=analysis.functionLabel+' → '+analysis.target;
        button.append(resolution);
        description+=', '+resolution.textContent;
      }
      if(outside.length){
        const label=document.createElement('small');
        label.textContent=(chordLabel?'Outside passage scale':'Outside scale')+' · '+outside.join(' ');
        button.append(label);
        description+=', '+label.textContent;
      }
      button.setAttribute('aria-label',description);
      const settings=document.createElement('button');
      settings.type='button';settings.className='mw-bar-settings';settings.dataset.action='open-settings';
      settings.setAttribute('aria-label','Chord settings for bar '+(i+1)+' · '+name.textContent);
      settings.setAttribute('aria-haspopup','dialog');
      settings.textContent='Settings';
      card.append(button,settings);
      return card;
    }));
    const i=currentIndex(),bar=bars[i];part('empty').hidden=bars.length>0;
    part('inspector').hidden=!bar;
    part('count').textContent=bars.length+(bars.length===1?' bar':' bars')+' · 4/4';
    action('play').disabled=!bars.length;action('play-scale').disabled=!bars.length;action('stop').disabled=!transport;
    if(!bar)return;
    const active=activeKeys[i],ch=chordHarmony(bar);
    const outside=outsideByBar[i];
    const scaleStatus=outside.length?'Outside scale · '+outside.join(' '):'In scale';
    const {ideas,functionLabel,target}=barIdeas[i];
    part('bar-detail').textContent='Bar '+(i+1)+' · '+barSymbol(bar)+' · '+(functionLabel||numeral(ch,active[0]))+' in '+keyName(active)+' · '+scaleStatus;
    part('scale-ideas').textContent=ideas.length?'Try '+ideas.slice(0,3).map(idea=>idea.name+(idea.outside.length?' ('+idea.outside.join(', ')+' outside)':'')).join(' or ')+'.':'';
    part('resolution').textContent=target?'Resolves to '+target+' · temporary tonicization in '+keyName(active):'';
    part('voicing-notes').textContent=inversionNames[bar.inversion ?? 0]+' · '+voicing(bar).map(noteWithOctave).join(' · ');
    const [markerTonic,markerMode,,markerFamily='major']=bar.mark ?? active;
    field('mark-key').value=markerTonic;field('mark-scale').value=markerFamily;
    renderMarkerModes(markerFamily,markerMode);
    action('unmark').disabled=!bar.mark;action('earlier').disabled=i===0;action('later').disabled=i===bars.length-1;
  }
  function renderMarkerModes(family,mode){
    field('mark-mode').replaceChildren(...scaleFamilies[family].modes.map((name,index)=>new Option(name,index)));
    field('mark-mode').value=mode;
  }
  function stop() {
    ++soundVersion;
    cancelAnimationFrame(frame);
    clearInterval(transport?.scheduler);
    transport=null;
    stopVoices(voices);
    melodyVoices.clear();
    showScalePlayback(false);
    part('track').querySelector('[data-sounding]')?.removeAttribute('data-sounding');
    action('stop').disabled=true;part('message').textContent='';part('settings-message').textContent='';
  }
  function stopVoices(group) {
    for(const voice of group){try{voice.stop()}catch{}}
    group.clear();
  }
  function showScalePlayback(enabled) {
    const button=action('play-scale');
    button.setAttribute('aria-pressed',enabled);
    button.textContent=enabled?'Stop scale':'Play scale';
  }
  async function soundReady() {
    try{ctx??=new (window.AudioContext||window.webkitAudioContext)();
      if(ctx.state!=='running')await ctx.resume();
      if(ctx.state!=='running')throw new Error();return true;
    }catch{
      const status=part('chord-settings').open?'settings-message':'message';
      part(status).textContent='Audio unavailable. Enable sound, then play the chord again.';
      return false;
    }
  }
  function voice(notes,start,length,melody=false) {
    const level=(melody ? .14 : .15)/notes.length;
    for(const note of notes){
      const osc=ctx.createOscillator(),amp=ctx.createGain();
      osc.type=melody?'sine':'triangle';osc.frequency.value=440*Math.pow(2,(note-69)/12);
      amp.gain.setValueAtTime(.0001,start);
      amp.gain.exponentialRampToValueAtTime(level,start+Math.min(.016,length*.24));
      amp.gain.exponentialRampToValueAtTime(level*.39,start+length*.74);
      amp.gain.exponentialRampToValueAtTime(.0001,start+length);
      osc.connect(amp);amp.connect(ctx.destination);voices.add(osc);
      if(melody)melodyVoices.add(osc);
      osc.onended=()=>{voices.delete(osc);melodyVoices.delete(osc);osc.disconnect();amp.disconnect()};
      osc.start(start);osc.stop(start+length+.01);
    }
  }
  async function audition(notes){
    stop();const token=soundVersion;if(await soundReady()&&token===soundVersion)voice(notes,ctx.currentTime+.014,.82);
  }
  function auditionBar(bar) {
    audition(voicing(bar).map(note=>note.midi));
  }
  function renderChordSettings() {
    const index=currentIndex();
    const bar=bars[index];
    const passageKey=activeKeys[index];
    const {ideas}=barIdeas[index];
    const choice=ideas[0];
    const key=choice?.scale??passageKey;
    const picker=field('settings-scale');
    picker.replaceChildren(...ideas.map(idea=>new Option(idea.name,idea.name)));
    picker.parentElement.hidden=!choice;
    picker.value=choice?.name??'';
    const outside=choice?.outside??[];
    const [parentTonic,,,family]=parentScale(key);
    part('settings-scale-parent').textContent='Parent scale · '+parentTonic+' '+scaleFamilies[family].label;
    part('settings-scale-note').textContent=choice
      ? [choice.description,outside.length?'Outside this scale: '+outside.join(', ')+'.':''].filter(Boolean).join(' ')
      : 'No matching scale for this voicing. The piano highlights the passage scale.';
    const root=rootMidi(bar);
    const notesInScale=keyNotes(key);
    const scaleByPitch=new Map(notesInScale.map(name=>[pitch(name),name]));
    const coreByMidi=new Map(coreVoicing(bar).map(({midi,name})=>[midi,name]));
    const soundingByMidi=new Map(voicing(bar).map(({midi,name})=>[midi,name]));
    const added=new Map(bar.added);
    const first=blackKeys.has(modulo(root,12))?root-1:root;
    const width=14+(blackKeys.has(modulo(first+23,12)) ? .33 : 0);
    let whiteCount=0;
    const pianoKeys=Array.from({length:24},(_,i)=>{
      const midi=first+i;
      const step=modulo(midi,12);
      const isBlack=blackKeys.has(step);
      const offset=midi-root;
      const name=soundingByMidi.get(midi)??scaleByPitch.get(step)??chromaticNames[step];
      const button=document.createElement('button');
      const note=noteWithOctave({name,midi});
      button.type='button';
      button.dataset.offset=offset;button.dataset.note=name;
      button.className='mw-piano-key '+(isBlack?'mw-black-key':'mw-white-key');
      button.dataset.inScale=scaleByPitch.has(step);
      button.setAttribute('aria-pressed',coreByMidi.has(midi)||added.has(offset));
      button.disabled=coreByMidi.has(midi)&&!added.has(offset);
      const status=button.disabled?'original chord tone':added.has(offset)?'remove note':'add note';
      button.setAttribute('aria-label',note+', '+status+(scaleByPitch.has(step)?', in scale':', out of scale'));
      button.textContent=note;
      const left=isBlack?whiteCount-.33:whiteCount++;
      button.style.setProperty('--piano-left',100*left/width+'%');
      button.style.setProperty('--piano-width',100*(isBlack ? .66 : 1)/width+'%');
      return button;
    });
    part('piano').replaceChildren(...pianoKeys);
    const rootLetter=letters.indexOf(bar.ch.names[0][0]);
    part('extensions').replaceChildren(...extensionDegrees.map(([degree,number])=>{
      const letter=letters[(rootLetter+degree)%7];
      const name=notesInScale.find(note=>note[0]===letter);
      const offset=12+modulo(pitch(name)-modulo(root,12),12);
      const button=document.createElement('button');
      button.type='button';button.dataset.offset=offset;button.dataset.note=name;
      button.dataset.extension=number;
      button.textContent=({9:'9th',11:'11th',13:'13th'})[number]+' · '+name;
      button.setAttribute('aria-pressed',added.has(offset)||coreByMidi.has(root+offset));
      button.disabled=!pianoKeys.some(k=>Number(k.dataset.offset)===offset)||(!added.has(offset)&&coreByMidi.has(root+offset));
      return button;
    }));
    part('settings-voicing').replaceChildren(
      voicingControls(bar,'octave',minOctaveShift,maxOctaveShift),
      voicingControls(bar,'inversion',0,bar.ch.midi.length-1)
    );
    part('settings-context').textContent='Bar '+(index+1)+' · Passage '+keyName(passageKey);
    part('settings-symbol').textContent=barSymbol(bar);
    part('settings-notes').textContent=voicing(bar).map(noteWithOctave).join(' · ');
    action('clear-extensions').disabled=!added.size;
  }
  function openChordSettings(button) {
    selectedId=Number(button.closest('.mw-bar').dataset.id);
    stop();
    renderBars();
    part('piano').parentElement.scrollLeft=0;
    renderChordSettings();
    save();
    part('chord-settings').showModal();
  }
  function editChordSettings(button) {
    const bar=bars[currentIndex()];
    const {voicing:setting,step,offset,extension,note,action:command}=button.dataset;
    let focusSelector='[data-action="preview-chord"]', fallbackSelector=null;
    if(setting){
      bar[setting]=(bar[setting] ?? 0)+Number(step);
      focusSelector='[data-voicing="'+setting+'"][data-step="'+step+'"]:enabled';
      fallbackSelector='[data-voicing="'+setting+'"]:enabled';
    }else if(offset!==undefined){
      const added=new Map(bar.added);
      const distance=Number(offset);
      if(added.has(distance)){
        added.delete(distance);
      }else{
        added.set(distance,note);
        if(bar.preferredScale&&!keyPitches(bar.preferredScale).has(pitch(note)))bar.preferredScale=null;
      }
      bar.added=[...added].sort((a,b)=>a[0]-b[0]);
      focusSelector=extension?'[data-extension="'+extension+'"]:enabled':'.mw-piano-key[data-offset="'+offset+'"]:enabled';
    }else if(command==='clear-extensions'){
      bar.added=[];
    }
    auditionBar(bar);
    renderBars();
    renderChordSettings();
    save();
    const dialog=part('chord-settings');
    const focusTarget=dialog.querySelector(focusSelector)??(fallbackSelector&&dialog.querySelector(fallbackSelector));
    (focusTarget??action('preview-chord')).focus({preventScroll:true});
  }
  part('chord-settings').addEventListener('close',()=>{
    part('track').children[currentIndex()]?.querySelector('.mw-bar-settings')?.focus({preventScroll:true});
  });
  function scaleRun(bass,key){
    const pitches=keyPitches(key);
    const ascent=[bass];
    for(let note=bass+1;note<bass+24;note++){
      if(pitches.has(modulo(note,12)))ascent.push(note);
    }
    ascent.push(bass+24);
    return ascent.concat(ascent.slice(0,-1).reverse());
  }
  function scheduleLoop(state){
    const now=ctx.currentTime;
    const horizon=now+1.1;
    const nextOpenBar=Math.max(0,Math.ceil((now+.004-state.start)/state.duration));
    for(const lane of state.lanes){
      if(lane.next===null)continue;
      lane.next=Math.max(lane.next,nextOpenBar);
      while(state.start+lane.next*state.duration<=horizon){
        const start=state.start+lane.next*state.duration;
        lane.schedule(state.chords[lane.next%state.chords.length],start);
        lane.next++;
      }
    }
  }
  function toggleScalePlayback(){
    if(!transport){play(true);return}
    const lane=transport.lanes[1];
    const enabled=lane.next===null;
    lane.next=enabled?Math.max(0,Math.ceil((ctx.currentTime+.01-transport.start)/transport.duration)):null;
    showScalePlayback(enabled);
    if(enabled)scheduleLoop(transport);
    else stopVoices(melodyVoices);
  }
  async function play(withScale=false){
    stop();if(!bars.length)return;
    const token=soundVersion;if(!await soundReady()||token!==soundVersion)return;
    const duration=240/Number(field('bpm').value),start=ctx.currentTime+.06;
    const chords=bars.map((bar,i)=>{
      const notes=voicing(bar).map(note=>note.midi);
      return {notes,scale:scaleRun(notes[0],barIdeas[i].ideas[0]?.scale??activeKeys[i])};
    });
    const lanes=[
      {next:0,schedule:({notes},time)=>voice(notes,time,duration)},
      {next:withScale?0:null,schedule:({scale},time)=>{
        const step=duration/scale.length;
        scale.forEach((note,i)=>voice([note],time+i*step,step,true));
      }}
    ];
    const state={start,duration,chords,lanes,bar:-1};
    transport=state;
    action('stop').disabled=false;
    showScalePlayback(withScale);
    scheduleLoop(state);
    state.scheduler=setInterval(()=>scheduleLoop(state),40);
    function tick(){
      if(transport!==state)return;
      const elapsed=Math.floor((ctx.currentTime-start)/duration);
      const i=elapsed%chords.length;
      if(elapsed>=0&&state.bar!==i){
        const last=part('track').children[state.bar];last?.removeAttribute('data-sounding');
        part('track').children[i].dataset.sounding=true;state.bar=i;
        part('message').textContent='Playing bar '+(i+1)+' of '+bars.length+' · '+barSymbol(bars[i])+' · '+keyName(activeKeys[i]);
      }
      frame=requestAnimationFrame(tick);
    }
    tick();
  }
  function add(seed,index){
    stop();const item={id:nextId++,ch:chord(seed.slice()),mark:null};bars.splice(index,0,item);selectedId=item.id;renderBars();save();
  }
  function move(id,gap){
    const from=bars.findIndex(b=>b.id===id);
    if(from<0)return;
    stop();const [item]=bars.splice(from,1);bars.splice(gap>from?gap-1:gap,0,item);
    selectedId=id;renderBars();save();
  }
  function example(){
    if(bars.length)return;
    stop();
    bars=eightBarExample.map(([seed,mark])=>({id:nextId++,ch:chord(seed),mark}));
    selectedId=bars[2].id;renderBars();save();
  }
  function tonicizationExample(){
    if(bars.length)return;
    stop();
    const seeds=[['C','r',0,0,3],['A','r',0,4,4,'harmonicMinor'],['C','r',0,5,3],['C','r',0,4,4]];
    bars=seeds.map(seed=>({id:nextId++,ch:chord(seed),mark:null}));
    selectedId=bars[1].id;renderBars();save();
  }
  function tileSeed(tile){
    const [key,view,,,size,family='major']=selectedSeed;
    return [key,view,Number(tile.dataset.mode),Number(tile.dataset.degree),size,family];
  }
  desk.addEventListener('change',e=>{
    const name=e.target.dataset.field;
    if(['view','key','size','wheel-mode','scale'].includes(name)){
      const mode=name==='wheel-mode'?Number(field(name).value):selectedSeed[2];
      const [nextMode,nextDegree]=name==='scale'?[0,0]:[mode,selectedSeed[3]];
      selectedSeed=[field('key').value,field('view').value,nextMode,nextDegree,Number(field('size').value),field('scale').value];
      renderLibrary();save();
    }else if(name==='settings-scale'){
      const index=currentIndex();
      const choice=barIdeas[index]?.ideas.find(idea=>idea.name===e.target.value);
      if(!choice)return;
      bars[index].preferredScale=choice.scale.slice();
      renderBars();renderChordSettings();save();
    }else if(name==='mark-scale'){
      renderMarkerModes(field('mark-scale').value,0);
    }else if(name==='bpm'){
      const value=Number(e.target.value);e.target.value=Number.isFinite(value)&&value>0?Math.max(40,Math.min(240,Math.round(value))):100;
      stop();save();
    }
  });
  desk.addEventListener('click',e=>{
    if(suppressClick&&e.detail>0){suppressClick=false;return}
    let button=e.target.closest('button');
    if(!button&&e.target.closest('[data-part=wheel]')){
      const box=part('wheel').getBoundingClientRect();
      const x=(e.clientX-box.left)/box.width-.5, y=(e.clientY-box.top)/box.height-.5;
      const radius=Math.hypot(x,y);
      if(radius<.33||radius>.5)return;
      const sector=modulo(Math.round(Math.atan2(x,-y)*6/Math.PI),12);
      button=part('wheel-keys').children[sector];
    }
    if(!button)return;
    if(button.dataset.layout){layout=button.dataset.layout;renderLibrary();save();return}
    if(button.matches('.mw-wheel-key')){
      if(pitch(selectedSeed[0])!==pitch(button.dataset.key)){
        selectedSeed=[button.dataset.key,...selectedSeed.slice(1)];renderLibrary();save();
      }
      return;
    }
    if(button.matches('.mw-tile')){
      selectedSeed=tileSeed(button);
      part('library').querySelector('.mw-tile[aria-pressed=true]')?.setAttribute('aria-pressed','false');
      button.setAttribute('aria-pressed','true');renderChoice();audition(chord(selectedSeed).midi);save();return;
    }
    if(button.closest('.mw-chord-settings')){
      if(button.dataset.action==='close-settings')part('chord-settings').close();
      else if(button.dataset.action==='preview-chord')auditionBar(bars[currentIndex()]);
      else editChordSettings(button);
      return;
    }
    if(button.dataset.action==='open-settings'){openChordSettings(button);return}
    if(button.matches('.mw-bar-play')){
      selectedId=Number(button.closest('.mw-bar').dataset.id);
      const index=currentIndex(),bar=bars[index];
      auditionBar(bar);
      renderBars();save();
      part('track').children[index].querySelector('.mw-bar-play').focus({preventScroll:true});
      return;
    }
    const i=currentIndex();
    switch(button.dataset.action){
      case 'example':example();return;
      case 'tonicization-example':tonicizationExample();return;
      case 'add':add(selectedSeed,bars.length);return;
      case 'play':play();return;
      case 'play-scale':toggleScalePlayback();return;
      case 'stop':stop();return;
      case 'earlier':if(i>0)move(selectedId,i-1);return;
      case 'later':if(i>=0&&i<bars.length-1)move(selectedId,i+2);return;
      case 'mark':
      case 'label-chord':
        if(i<0)return;
        stop();
        const scope=button.dataset.action==='label-chord'?'single':'span';
        bars[i].mark=[field('mark-key').value,Number(field('mark-mode').value),scope,field('mark-scale').value];
        break;
      case 'unmark':if(i<0)return;stop();bars[i].mark=null;break;
      case 'remove':if(i<0)return;stop();bars.splice(i,1);selectedId=bars[Math.min(i,bars.length-1)]?.id??null;break;
      default:return;
    }
    renderBars();save();
  });
  function clearCaret(){desk.querySelectorAll('[data-drop]').forEach(b=>delete b.dataset.drop);delete part('empty').dataset.over}
  function dropGap(x,y){
    const target=document.elementFromPoint(x,y);
    if(!target?.closest('#modal-writing-desk [data-part=track],#modal-writing-desk [data-part=empty]'))return null;
    const bar=target.closest('.mw-bar');
    if(!bar){if(!bars.length)part('empty').dataset.over=true;return bars.length}
    const box=bar.getBoundingClientRect(),after=x>=box.left+box.width/2;
    bar.dataset.drop=after?'after':'before';return bars.findIndex(b=>b.id===Number(bar.dataset.id))+Number(after);
  }
  desk.addEventListener('pointerdown',e=>{
    if(e.button!==0||!e.isPrimary)return;
    suppressClick=false;
    const source=e.target.closest('.mw-tile,.mw-bar-play');
    if(!source)return;
    drag={source,pointer:e.pointerId,x:e.clientX,y:e.clientY,active:false,
      seed:source.matches('.mw-tile')?tileSeed(source):null,id:Number(source.closest('.mw-bar')?.dataset.id)};
    source.setPointerCapture(e.pointerId);
  });
  desk.addEventListener('pointermove',e=>{
    if(!drag||drag.pointer!==e.pointerId)return;
    if(!drag.active&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<6)return;
    drag.active=true;drag.source.dataset.moving=true;
    clearCaret();dropGap(e.clientX,e.clientY);
  });
  function endDrag(e){
    if(!drag||drag.pointer!==e.pointerId)return;
    const session=drag;drag=null;suppressClick=session.active;
    delete session.source.dataset.moving;
    const gap=session.active&&e.type==='pointerup'?dropGap(e.clientX,e.clientY):null;
    if(session.source.hasPointerCapture(e.pointerId))session.source.releasePointerCapture(e.pointerId);
    clearCaret();
    if(gap!==null){if(session.seed)add(session.seed,gap);else move(session.id,gap)}
  }
  desk.addEventListener('pointerup',endDrag);
  desk.addEventListener('pointercancel',endDrag);
  desk.addEventListener('lostpointercapture',endDrag);
  window.addEventListener('pagehide',stop);
  window.addEventListener('openai:set_globals',e=>restore(e.detail?.globals?.widgetState));
  buildWheel();renderLibrary();renderBars();restore(loadDraft());
})();
