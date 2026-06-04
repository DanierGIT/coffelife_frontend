import * as bi from 'react-icons/bi';
const names = Object.keys(bi);
names.forEach(k => {
  if (k.includes('Exclamation') || k.includes('Report') || k.includes('Flag')) console.log(k);
});
