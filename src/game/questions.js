// Evidence groups reference the current main-branch case deck by square ID.
export const QUESTIONS = [
 {key:'leaker',text:'Who leaked the original video?',answer:'noah',supportGroups:[['H1','B1','C7']]},
 {key:'editor',text:'Who altered and uploaded the second video?',answer:'olivia',supportGroups:[['A2','D7']]},
 {key:'innocent',text:'Who was wrongly accused by the early evidence?',answer:'ethan',supportGroups:[['B7','F2']]},
 {key:'security',text:'Whose security concerns were legitimate?',answer:'avery',supportGroups:[['C2','H2']]},
 {key:'insight',text:'Why did the early evidence point to the wrong person?',answer:'interpretation',supportGroups:[['B7','F2'],['C1','G7','E8']],choices:[
  {key:'fabricated',name:'The badge and account logs were fabricated.'},
  {key:'interpretation',name:'The logs were authentic, but someone else used Ethan’s badge and session.'},
  {key:'same-source',name:'Both videos came from the same person.'}
 ]}
];
