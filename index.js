const CHAR_CLASSES = [
  'abcdefghijklmnopqrstuvwxyz',
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  '0123456789',
  '!#$%&()*+-;<=>?@^_`{|}~',
];

async function generate(/*options*/) {
  //const { master, domain, version, charClasses, len } = options;
  const master = document.getElementById('master').value;
  const domain = document.getElementById('domain').value;
  const version = document.getElementById('version').value;
  const len = parseInt(document.getElementById('length').value, 10);

  const charClasses = [];
  if (document.getElementById('letters').checked) {
    charClasses.push(0);
  }
  if (document.getElementById('capitals').checked) {
    charClasses.push(1);
  }
  if (document.getElementById('digits').checked) {
    charClasses.push(2);
  }
  if (document.getElementById('symbols').checked) {
    charClasses.push(3);
  }


  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-512', encoder.encode(`${master}:${domain}:${version}`));
  const bytes = new Uint8Array(digest);
  const classes = [...charClasses];
  const usedClasses = new Set();

  let password = '';
  for (let i = 0; i < len; i++) {
    if (charClasses.length - usedClasses.size === len - i) {
      for (let j = 0; j < classes.length;) {
        if (usedClasses.has(classes[j])) {
          classes.splice(j, 1);
        } else {
          j++;
        }
      }
    }
    const cls = classes[bytes[i * 3] % classes.length];
    usedClasses.add(cls);
    const charIndex = (bytes[i * 3 + 1] * 256 + bytes[i * 3 + 2]) % CHAR_CLASSES[cls].length;
    password += CHAR_CLASSES[cls][charIndex];
  }
  await navigator.clipboard.writeText(password);
}
